import assert from 'node:assert/strict';
import { it } from 'node:test';
import {
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { documentClient } from './client.ts';
import {
  submitSurvey,
  listSurveyLeads,
  getSurveyMetrics,
  updateSurveyLead,
} from './survey-repository.ts';
import { csvCell, metricKeys, type SurveyAnswers } from './survey.ts';
const config = {
  region: 'us-east-1',
  tables: { core: 'despega_dev_core', simulation: 'despega_dev_simulation' },
};
const answers: SurveyAnswers = {
  audience: 'guardian',
  fullName: 'Prueba',
  email: 'example@example.com',
  city: 'santiago',
  need: 'explore',
  professions: ['medicine', 'technology', 'medicine'],
  participation: 'yes',
  willingness: 'pay',
  priceRange: '4000-5999',
  marketingConsent: false,
};
const id = 'b45678cd-1234-4123-8123-1234567890ab';
it('guarda respuesta, recibo y contadores en la misma transacción; día Santo Domingo', async (t) => {
  t.mock.method(documentClient(config), 'send', async (command: unknown) => {
    assert.ok(command instanceof TransactWriteCommand);
    const tx = command.input.TransactItems!;
    assert.equal(tx.length, 3);
    assert.equal(tx[0]!.Put!.Item!.entity, 'SurveyLead');
    assert.equal(tx[0]!.Put!.Item!.consentAt, '2026-11-13T02:00:00.000Z');
    assert.equal(tx[1]!.Put!.ConditionExpression, 'attribute_not_exists(pk)');
    assert.match(tx[1]!.Put!.Item!.pk, /SURVEYSUBMISSION/);
    assert.equal(tx[2]!.Update!.Key!.sk, 'DAY#2026-11-12');
    const counters = Object.values(tx[2]!.Update!.ExpressionAttributeNames!);
    assert.equal(counters.filter((k) => k === 'profession_medicine').length, 1);
    assert.ok(counters.includes('commercial'));
    return {};
  });
  await submitSurvey(config, answers, id, '2026-11-13T02:00:00.000Z');
});
it('solo un conflicto de recibo se considera reintento exitoso', async (t) => {
  const error = Object.assign(new Error('conflict'), {
    name: 'TransactionCanceledException',
    CancellationReasons: [{ Code: 'None' }, { Code: 'ConditionalCheckFailed' }],
  });
  t.mock.method(documentClient(config), 'send', async () => {
    throw error;
  });
  await submitSurvey(config, answers, id, '2026-11-12T12:00:00.000Z');
  error.CancellationReasons = [
    { Code: 'ConditionalCheckFailed' },
    { Code: 'None' },
  ];
  await assert.rejects(() =>
    submitSurvey(config, answers, id, '2026-11-12T12:00:00.000Z'),
  );
});
it('KPIs recorren todas las páginas y no incluyen datos personales', async (t) => {
  let calls = 0;
  t.mock.method(documentClient(config), 'send', async (command: unknown) => {
    assert.ok(command instanceof QueryCommand);
    calls++;
    return calls === 1
      ? {
          Items: [{ pk: 'metrics', total: 3, commercial: 2 }],
          LastEvaluatedKey: { pk: 'metrics', sk: 'day' },
        }
      : { Items: [{ pk: 'metrics', total: 2, commercial: 1 }] };
  });
  assert.deepEqual(await getSurveyMetrics(config, '2026-11-01', '2026-11-12'), {
    total: 5,
    commercial: 3,
  });
  assert.equal(calls, 2);
});
it('consultas usan días locales completos y rechazan cursor de otro contexto', async (t) => {
  t.mock.method(documentClient(config), 'send', async (command: unknown) => {
    assert.ok(command instanceof QueryCommand);
    assert.equal(
      command.input.ExpressionAttributeValues![':from'],
      'RESPONSE#2026-11-12T04:00:00.000Z',
    );
    assert.equal(
      command.input.ExpressionAttributeValues![':to'],
      'RESPONSE#2026-11-13T03:59:59.999Z_\uffff',
    );
    return { Items: [] };
  });
  await listSurveyLeads(config, { from: '2026-11-12', to: '2026-11-12' });
  await assert.rejects(
    () =>
      listSurveyLeads(config, {
        from: '2026-11-12',
        to: '2026-11-12',
        cursor: Buffer.from(
          JSON.stringify({ pk: 'STUDENT#other', sk: 'PROFILE' }),
        ).toString('base64url'),
      }),
    /Cursor/,
  );
});
it('seguimiento protege la versión y no acepta sobrescrituras silenciosas', async (t) => {
  t.mock.method(documentClient(config), 'send', async (command: unknown) => {
    assert.ok(command instanceof UpdateCommand);
    assert.match(command.input.ConditionExpression!, /#v = :v/);
    throw Object.assign(new Error(), {
      name: 'ConditionalCheckFailedException',
    });
  });
  await assert.rejects(
    () =>
      updateSurveyLead(config, `2026-11-12T12:00:00.000Z_${id}`, {
        status: 'contacted',
        notes: 'nota',
        version: 2,
        actor: 'staff',
        now: '2026-11-12T13:00:00.000Z',
      }),
    /Recarga/,
  );
});
it('las preguntas comerciales excluyen estudiantes y el CSV neutraliza fórmulas', () => {
  assert.equal(
    metricKeys({
      ...answers,
      audience: 'student',
      willingness: undefined,
      priceRange: undefined,
    }).includes('commercial'),
    false,
  );
  for (const value of [
    '=1+1',
    '+SUM(A1)',
    '@cmd',
    '-1+1',
    '  =1+1',
    '\tformula',
  ])
    assert.ok(csvCell(value).startsWith('"\''));
  assert.equal(csvCell('Texto, "válido"'), '"Texto, ""válido"""');
});
