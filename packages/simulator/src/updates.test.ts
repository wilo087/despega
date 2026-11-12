import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { affinityMaximaBySession } from './affinity.ts';
import { CAREERS } from './careers.ts';
import { applySceneResponse, createInitialState, getPublicScene, SimulationError, startSession } from './engine.ts';
import { findModule, ingenieriaSoftware as module, ingenieriaSoftwareV2 } from './modules/index.ts';
import type { SceneResponse } from './types.ts';
import { validateModule } from './validation.ts';

const NOW = '2026-10-30T12:00:00.000Z';
const CONTINUE: SceneResponse = { kind: 'continue' };

function reportsState() {
  let state = startSession(module, createInitialState(module, { playerName: 'Alex', now: NOW }), { sessionIndex: 0, now: NOW });
  state = applySceneResponse(module, state, { sceneId: '1.1', response: CONTINUE, elapsedMs: 1000, now: NOW }).state;
  return applySceneResponse(module, state, { sceneId: '1.2', response: { kind: 'dialogue', optionId: 'revisar' }, elapsedMs: 1000, now: NOW }).state;
}


function complete(responses: Readonly<Record<string, SceneResponse>>) {
  let state = createInitialState(module, { playerName: 'Alex', now: NOW });
  let count = 0;
  while (state.status !== 'completed') {
    let scene = getPublicScene(module, state);
    if (!scene) {
      state = startSession(module, state, { sessionIndex: state.sessionIndex, now: NOW });
      scene = getPublicScene(module, state)!;
    }
    state = applySceneResponse(module, state, { sceneId: scene.id, response: responses[scene.id] ?? CONTINUE, elapsedMs: 1000, now: NOW }).state;
    assert.ok(++count <= 19);
  }
  return { state, count };
}

describe('actualizaciones del piloto v3', () => {
  it('presenta comentarios sin categorías y la lectura no da puntos ni revela el diagnóstico', () => {
    assert.deepEqual(validateModule(module), []);
    const state = reportsState();
    const reports = getPublicScene(module, state)!;
    assert.equal(reports.interaction.kind, 'none');
    assert.equal(reports.reports?.length, 4);
    assert.ok(reports.reports?.every((report) => report.body.length > 30));
    assert.doesNotMatch(JSON.stringify(reports), /correctCategoryId|Conexión lenta|Conexión rápida/);
    const next = applySceneResponse(module, state, { sceneId: '1.3', response: CONTINUE, elapsedMs: 90000, now: NOW });
    assert.equal(next.state.performance, state.performance);
    assert.deepEqual(next.state.affinity, state.affinity);
    const diagnosis = getPublicScene(module, next.state)!;
    assert.equal(diagnosis.id, '1.4');
    assert.equal(diagnosis.interaction.kind === 'dialogue' && diagnosis.interaction.timeLimitSeconds, 15);
    assert.equal(diagnosis.interaction.kind === 'dialogue' && diagnosis.interaction.hint, undefined);
    assert.equal(affinityMaximaBySession(module)[0]?.analytical, affinityMaximaBySession(ingenieriaSoftwareV2)[0]!.analytical - 6);
    assert.throws(() => applySceneResponse(module, state, { sceneId: '1.3', response: { kind: 'timeout' }, elapsedMs: 0, now: NOW }), SimulationError);
  });

  it('el camino de mayor desempeño completa las tres sesiones con 86 puntos', () => {
    const responses: Record<string, SceneResponse> = {
      '1.2': { kind: 'dialogue', optionId: 'revisar' },
      '1.4': { kind: 'dialogue', optionId: 'espera' },
      '1.5': { kind: 'message-builder', blockIds: ['estado', 'compromiso', 'apoyo'] },
      '2.1': { kind: 'sequence', candidateId: 'carga', slot: 1 },
      '2.2': { kind: 'dialogue', optionId: 'grupo' },
      '2.3': { kind: 'message-builder', blockIds: ['reconoce', 'prueba'] },
      '2.4': { kind: 'prioritization', selectedTaskIds: ['pruebas', 'ticket', 'diseno'] },
      '3.2': { kind: 'matching', timedOut: false, matches: { duplicado: 'sol-desactivar', envio: 'sol-sumar-envio', historial: 'sol-mensaje-vacio', correo: 'sol-correo-inmediato' } },
      '3.3': { kind: 'live-decision', optionId: 'lanzar' },
      '3.4': { kind: 'dialogue', optionId: 'investigar' },
    };
    const { state, count } = complete(responses);
    assert.equal(count, 19);
    assert.equal(state.performance, 86);
    assert.ok(state.sessions.every((session) => session.status === 'completed'));
  });

  it('el peor camino v3 también termina, incluidos los tres tiempos agotados', () => {
    const { state, count } = complete({
      '1.2': { kind: 'dialogue', optionId: 'intentar' },
      '1.4': { kind: 'timeout' },
      '1.5': { kind: 'message-builder', blockIds: ['no-se', 'relax'] },
      '2.1': { kind: 'sequence', candidateId: 'color', slot: 3 },
      '2.2': { kind: 'timeout' },
      '2.3': { kind: 'message-builder', blockIds: [] },
      '2.4': { kind: 'prioritization', selectedTaskIds: ['documentacion', 'ticket', 'diseno'] },
      '3.2': { kind: 'matching', timedOut: true, matches: {} },
      '3.3': { kind: 'live-decision', optionId: 'lanzar' },
      '3.4': { kind: 'dialogue', optionId: 'decidir' },
    });
    assert.equal(count, 19);
    assert.equal(state.performance, 34);
    assert.ok(state.sessions.every((session) => session.status === 'completed'));
  });

  it('continúa intentos v2 con su clasificación y rechaza evaluar con otra versión', () => {
    assert.equal(findModule(module.careerId), module);
    assert.equal(findModule(module.careerId, 2), ingenieriaSoftwareV2);
    assert.equal(findModule(module.careerId, 999), undefined);
    const previous = createInitialState(ingenieriaSoftwareV2, { playerName: 'Alex', now: NOW });
    const resumed = startSession(findModule(previous.careerId, previous.moduleVersion)!, previous, { sessionIndex: 0, now: NOW });
    assert.equal(getPublicScene(ingenieriaSoftwareV2, { ...resumed, sceneIndex: 2 })?.interaction.kind, 'classification');
    assert.throws(() => getPublicScene(module, resumed), (error: unknown) => error instanceof SimulationError && error.code === 'MODULE_MISMATCH');
  });

  it('el catálogo amplía las opciones sin ofrecer guiones inexistentes', () => {
    assert.equal(CAREERS.length, 19);
    assert.equal(new Set(CAREERS.map((career) => career.id)).size, 19);
    assert.ok(!CAREERS.some((career) => ['enfermeria', 'psicologia'].includes(career.id)));
    for (const id of ['ingenieria-mecanica', 'publicidad', 'odontologia', 'hoteleria-turismo', 'economia', 'psicologia-industrial', 'psicologia-clinica']) {
      assert.equal(CAREERS.find((career) => career.id === id)?.status, 'coming-soon');
      assert.equal(findModule(id), undefined);
    }
  });
});
