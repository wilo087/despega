import { ingenieriaIndustrial } from './ingenieria-industrial.ts';
import type { CareerModule } from '../types.ts';
import { ingenieriaSoftware } from './ingenieria-software.ts';
import { reportsV2 } from './ingenieria-software-v2.ts';

/** Conserva la evaluación y los máximos de afinidad de intentos anteriores. */
export const ingenieriaSoftwareV2: CareerModule = /* @__PURE__ */ previousSoftwareModule();

function previousSoftwareModule(): CareerModule {
  return {
    ...ingenieriaSoftware,
    version: 2,
    sessions: ingenieriaSoftware.sessions.map((session) => ({
      ...session,
      scenes: session.scenes.map((scene) => scene.id === reportsV2.id ? reportsV2 : scene),
    })),
  };
}

/** Módulos jugables por carrera. Una carrera sin módulo aparece como «Próximamente». */
export const MODULES: Readonly<Record<string, CareerModule>> = {
  [ingenieriaIndustrial.careerId]: ingenieriaIndustrial,
  [ingenieriaSoftware.careerId]: ingenieriaSoftware,
};

export function findModule(careerId: string, version?: number): CareerModule | undefined {
  const latest = Object.hasOwn(MODULES, careerId) ? MODULES[careerId] : undefined;
  if (version === undefined || version === latest?.version) return latest;
  if (careerId === ingenieriaSoftwareV2.careerId && version === 2) return ingenieriaSoftwareV2;
  return undefined;
}

export { ingenieriaSoftware };
