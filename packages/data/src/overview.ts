import {
  AFFINITY_AXES,
  factoryAffinity,
  type AffinityAxis,
  buildAffinityProfile,
  cumulativeAffinityMaximum,
  emptyAffinity,
  type AffinityVector,
} from '@despega/simulator';
import type { DataConfig } from './config.ts';
import { listProgressByCareer, type CareerProgressSummary } from './progress.ts';
import { moduleFor } from './simulation-service.ts';

export type CareerOverview = {
  readonly careerId: string;
  /** Registros considerados (tope de lectura para el piloto). */
  readonly sampled: number;
  readonly truncated: boolean;
  readonly started: number;
  readonly completed: number;
  readonly bySession: readonly { readonly sessionNumber: number; readonly completed: number }[];
  readonly averagePerformance: number | null;
  readonly averagePerformanceCompleted: number | null;
  /** Promedio del perfil normalizado (0–100) de quienes completaron el módulo. */
  readonly averageAffinityCompleted: AffinityVector | null;
  readonly recent: readonly CareerProgressSummary[];
};

/**
 * Agrega el progreso de una carrera leyendo el índice por carrera. Sin Scan: a la
 * escala del piloto basta con paginar el índice; si el volumen crece, se reemplaza
 * por contadores mantenidos en la escritura (ver docs/architecture/data-model.md).
 */
export async function careerOverview(
  config: DataConfig,
  careerId: string,
  options: { ceiling?: number; recent?: number } = {},
): Promise<CareerOverview> {
  const module = moduleFor(careerId);
  const ceiling = options.ceiling ?? 1_000;
  const items: CareerProgressSummary[] = [];
  let cursor: string | undefined;
  do {
    const page = await listProgressByCareer(config, careerId, { limit: 500, cursor });
    items.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor && items.length < ceiling);

  const completed = items.filter((item) => item.status === 'completed');
  const axes: readonly AffinityAxis[] = module.presentation === 'factory' ? [...AFFINITY_AXES, 'numeric'] : AFFINITY_AXES;
  const affinitySum = module.presentation === 'factory' ? {...emptyAffinity(),numeric:0} : emptyAffinity();
  for (const item of completed) {
    const playedModule = moduleFor(careerId, item.moduleVersion);
    const maximum = cumulativeAffinityMaximum(playedModule, playedModule.sessions.length - 1);
    const profile = playedModule.presentation === 'factory' ? factoryAffinity({affinity:item.affinity}) : buildAffinityProfile(item.affinity, maximum);
    for (const axis of axes) affinitySum[axis] = (affinitySum[axis] ?? 0) + (profile.normalized[axis] ?? 0);
  }

  return {
    careerId,
    sampled: items.length,
    truncated: Boolean(cursor),
    started: items.length,
    completed: completed.length,
    bySession: module.sessions.map((session) => ({
      sessionNumber: session.number,
      completed: items.filter((item) => item.completedSessions >= session.number).length,
    })),
    averagePerformance: average(items.map((item) => item.performance)),
    averagePerformanceCompleted: average(completed.map((item) => item.performance)),
    averageAffinityCompleted: completed.length === 0
      ? null
      : Object.fromEntries(axes.map((axis) => [axis, Math.round((affinitySum[axis] ?? 0) / completed.length)])) as AffinityVector,
    recent: items.slice(0, options.recent ?? 10),
  };
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
