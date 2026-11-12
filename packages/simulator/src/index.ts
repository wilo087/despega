export * from './types.ts';
export {
  AFFINITY_DESCRIPTIONS,
  AFFINITY_LABELS,
  AFFINITY_SHORT_LABELS,
  affinityMaximaBySession,
  buildAffinityProfile,
  cumulativeAffinityMaximum,
  emptyAffinity,
} from './affinity.ts';
export { evaluateCondition, resolveText } from './conditions.ts';
export {
  COMPLAINT_INTERVAL_MS,
  MAX_PLAYER_NAME_LENGTH,
  MAX_SCENE_ELAPSED_MS,
  SimulationError,
  WORLD_FLAGS,
  affinityProfileOf,
  applySceneResponse,
  createInitialState,
  currentSceneDefinition,
  getPublicScene,
  normalizePlayerName,
  progressSnapshot,
  scoreBranches,
  startSession,
  type ProgressSnapshot,
  type SimulationErrorCode,
} from './engine.ts';
export { validateModule } from './validation.ts';
export { CAREERS, findCareer, type Career, type CareerStatus } from './careers.ts';
export { MODULES, findModule, ingenieriaSoftware, ingenieriaSoftwareV2 } from './modules/index.ts';

export type * from './factory/types.ts';
export { factoryAffinity, factoryCycle, factorySpent, validateFactoryLayout } from './factory/engine.ts';
export { ingenieriaIndustrial } from './modules/ingenieria-industrial.ts';
