/** Browser-safe exports. Never re-export the module registry or evaluation engine. */
export { AFFINITY_AXES } from './types.ts';
export type * from './types.ts';
export { AFFINITY_LABELS, AFFINITY_SHORT_LABELS, AFFINITY_DESCRIPTIONS, emptyAffinity } from './affinity.ts';
export { CAREERS, findCareer } from './careers.ts';
export { COMPLAINT_INTERVAL_MS } from './constants.ts';
