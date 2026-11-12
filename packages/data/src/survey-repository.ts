import { randomUUID } from 'node:crypto';
import {
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { documentClient } from './client.ts';
import type { DataConfig } from './config.ts';
import { DataError, isConditionalFailure } from './errors.ts';
import { decodeCursor, encodeCursor } from './keys.ts';
import { SURVEY_STORAGE } from './schema.ts';
import {
  metricKeys,
  PRIVACY_VERSION,
  SURVEY_VERSION,
  type LeadStatus,
  type SurveyAnswers,
  type SurveyLead,
  type SurveyMetrics,
} from './survey.ts';

const ID = /^\d{4}-\d{2}-\d{2}T[\d:.]+Z_[a-f0-9-]{36}$/;
const UUID =
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const leadKey = (id: string) => {
  if (!ID.test(id)) throw new DataError('NOT_FOUND', 'Contacto no encontrado.');
  return {
    pk: SURVEY_STORAGE.leadsPartition,
    sk: `${SURVEY_STORAGE.responsePrefix}${id}`,
  };
};

/** Respuesta + recibo idempotente + métricas se confirman en una sola transacción. */
export async function submitSurvey(
  config: DataConfig,
  answers: SurveyAnswers,
  submissionId: string,
  now: string,
): Promise<void> {
  if (!UUID.test(submissionId) || !Number.isFinite(Date.parse(now)))
    throw new Error('Envío inválido.');
  const id = `${now}_${randomUUID()}`;
  const lead: SurveyLead = {
    ...answers,
    id,
    createdAt: now,
    updatedAt: now,
    version: 0,
    status: 'new',
    notes: '',
    surveyVersion: SURVEY_VERSION,
    privacyVersion: PRIVACY_VERSION,
    consentAt: now,
    guardianConsentMethod:
      answers.studentAge === 'minor' ? 'joint-declaration' : undefined,
  };
  const metricNames = [...new Set(metricKeys(answers))];
  try {
    await documentClient(config).send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: config.tables.core,
              Item: { ...leadKey(id), entity: 'SurveyLead', ...lead },
              ConditionExpression: 'attribute_not_exists(pk)',
            },
          },
          {
            Put: {
              TableName: config.tables.core,
              Item: {
                pk: `${SURVEY_STORAGE.receiptPrefix}${submissionId}`,
                sk: 'RECEIPT',
                entity: 'SurveyReceipt',
                createdAt: now,
              },
              ConditionExpression: 'attribute_not_exists(pk)',
            },
          },
          {
            Update: {
              TableName: config.tables.core,
              Key: {
                pk: SURVEY_STORAGE.metricsPartition,
                sk: `DAY#${new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now))}`,
              },
              UpdateExpression: `ADD ${metricNames.map((_, i) => `#m${i} :one`).join(', ')}`,
              ExpressionAttributeNames: Object.fromEntries(
                metricNames.map((key, i) => [`#m${i}`, key]),
              ),
              ExpressionAttributeValues: { ':one': 1 },
            },
          },
        ],
      }),
    );
  } catch (error) {
    // Only a conflict on the receipt means the exact form was already accepted.
    const reasons = (error as { CancellationReasons?: { Code?: string }[] })
      .CancellationReasons;
    if (
      error instanceof Error &&
      error.name === 'TransactionCanceledException' &&
      reasons?.[1]?.Code === 'ConditionalCheckFailed'
    )
      return;
    throw error;
  }
}

export async function listSurveyLeads(
  config: DataConfig,
  options: { cursor?: string; limit?: number; from: string; to: string },
) {
  let cursor: Record<string, unknown> | undefined;
  if (options.cursor) {
    cursor = decodeCursor(options.cursor);
    if (
      !cursor ||
      cursor.pk !== SURVEY_STORAGE.leadsPartition ||
      typeof cursor.sk !== 'string' ||
      !cursor.sk.startsWith(SURVEY_STORAGE.responsePrefix)
    )
      throw new DataError('INVALID_CURSOR', 'Cursor inválido.');
  }
  const result = await documentClient(config).send(
    new QueryCommand({
      TableName: config.tables.core,
      ConsistentRead: true,
      KeyConditionExpression: 'pk = :pk AND sk BETWEEN :from AND :to',
      ExpressionAttributeValues: {
        ':pk': SURVEY_STORAGE.leadsPartition,
        ':from': `RESPONSE#${new Date(`${options.from}T00:00:00-04:00`).toISOString()}`,
        ':to': `RESPONSE#${new Date(`${options.to}T23:59:59.999-04:00`).toISOString()}_\uffff`,
      },
      ScanIndexForward: false,
      Limit: Math.min(200, Math.max(1, options.limit ?? 50)),
      ExclusiveStartKey: cursor,
    }),
  );
  return {
    items: (result.Items ?? []) as SurveyLead[],
    nextCursor: encodeCursor(result.LastEvaluatedKey),
  };
}
export async function getSurveyLead(
  config: DataConfig,
  id: string,
): Promise<SurveyLead | null> {
  const r = await documentClient(config).send(
    new GetCommand({
      TableName: config.tables.core,
      Key: leadKey(id),
      ConsistentRead: true,
    }),
  );
  return (r.Item as SurveyLead | undefined) ?? null;
}
export async function updateSurveyLead(
  config: DataConfig,
  id: string,
  change: {
    status: LeadStatus;
    notes: string;
    version: number;
    actor: string;
    now: string;
  },
) {
  try {
    await documentClient(config).send(
      new UpdateCommand({
        TableName: config.tables.core,
        Key: leadKey(id),
        ConditionExpression: 'attribute_exists(pk) AND #v = :v',
        UpdateExpression:
          'SET #status = :status, notes = :notes, updatedAt = :now, updatedBy = :actor, #v = :next',
        ExpressionAttributeNames: { '#status': 'status', '#v': 'version' },
        ExpressionAttributeValues: {
          ':status': change.status,
          ':notes': change.notes,
          ':now': change.now,
          ':actor': change.actor,
          ':v': change.version,
          ':next': change.version + 1,
        },
      }),
    );
  } catch (error) {
    if (isConditionalFailure(error))
      throw new DataError(
        'CONFLICT',
        'Otro miembro del equipo actualizó este contacto. Recarga antes de guardar.',
      );
    throw error;
  }
}
export async function getSurveyMetrics(
  config: DataConfig,
  from: string,
  to: string,
): Promise<SurveyMetrics> {
  const totals: SurveyMetrics = {};
  let cursor: Record<string, unknown> | undefined;
  do {
    const r = await documentClient(config).send(
      new QueryCommand({
        TableName: config.tables.core,
        ConsistentRead: true,
        KeyConditionExpression: 'pk = :pk AND sk BETWEEN :from AND :to',
        ExpressionAttributeValues: {
          ':pk': SURVEY_STORAGE.metricsPartition,
          ':from': `DAY#${from}`,
          ':to': `DAY#${to}`,
        },
        ExclusiveStartKey: cursor,
      }),
    );
    for (const item of r.Items ?? [])
      for (const [key, value] of Object.entries(item))
        if (typeof value === 'number') totals[key] = (totals[key] ?? 0) + value;
    cursor = r.LastEvaluatedKey;
  } while (cursor);
  return totals;
}
