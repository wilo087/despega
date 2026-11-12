/** Public geometry and observable labels only. No evaluation rules or story branches. */
import geometry from "./geometry.json" with { type: "json" };
export const FACTORY_ZONES = geometry.zones;
export const STATIONS = [
  { id: "feed", label: "Alimentación", x: -3, z: -7, cycle: 8 },
  { id: "fill", label: "Llenado", x: -3, z: -3, cycle: 8.5 },
  { id: "seal", label: "Sellado", x: -3, z: 1, cycle: 14 },
  { id: "label", label: "Etiquetado", x: -3, z: 5, cycle: 7.5 },
  { id: "pack", label: "Empaque", x: -3, z: 9, cycle: 8.2 },
] as const;
export const FACTORY_TARGETS = [
  {
    id: "altagracia",
    label: "Ing. Altagracia",
    zone: "office",
    x: -13,
    z: -8.8,
    model: "altagracia",
  },
  {
    id: "wilfredo",
    label: "Don Wilfredo",
    zone: "line",
    x: 3,
    z: 0,
    model: "wilfredo",
  },
  {
    id: "yuleisy",
    label: "Yuleisy",
    zone: "line",
    x: -1,
    z: 2,
    model: "yuleisy",
  },
  {
    id: "kevin",
    label: "Kevin",
    zone: "warehouse",
    x: 12.5,
    z: -5.5,
    model: "kevin",
  },
  {
    id: "canteen",
    label: "Conversar con el equipo",
    zone: "canteen",
    x: 14,
    z: 13.8,
    model: "operator",
  },
  {
    id: "spare",
    label: "Equipo almacenado",
    zone: "warehouse",
    x: 16,
    z: -5.5,
    model: "machine",
  },
  {
    id: "puddle",
    label: "Revisar el piso",
    zone: "entrance",
    x: -11,
    z: 6.5,
    model: "puddle",
  },
  {
    id: "guard",
    label: "Revisar el transportador",
    zone: "line",
    x: -5,
    z: 12,
    model: "guard",
  },
  {
    id: "exit",
    label: "Revisar la salida",
    zone: "entrance",
    x: -16,
    z: 6.5,
    model: "box",
  },
  {
    id: "gloves",
    label: "Revisar protección",
    zone: "entrance",
    x: -10,
    z: 11,
    model: "operator",
  },
  {
    id: "cable",
    label: "Revisar la conexión",
    zone: "entrance",
    x: -8.5,
    z: 7,
    model: "cable",
  },
  {
    id: "quality",
    label: "Mesa de inspección",
    zone: "quality",
    x: 14,
    z: 3,
    model: "table",
  },
  ...STATIONS.map((s) => ({
    id: s.id,
    label: s.label,
    zone: "line",
    x: s.x,
    z: s.z,
    model: "machine",
  })),
];
export const DEFAULT_LAYOUT = STATIONS.map((s) => ({
  id: s.id,
  x: s.x,
  z: s.z,
  rotation: 0,
}));
export const FACTORY_WORKERS = [
  { id: "rosa", label: "Rosa · precisión y sellado" },
  { id: "luis", label: "Luis · rapidez y llenado" },
  { id: "ana", label: "Ana · atención y etiquetas" },
  { id: "pedro", label: "Pedro · empaque y experiencia" },
  { id: "jose", label: "José · alimentación y orden" },
  { id: "wilfredo", label: "Don Wilfredo · supervisor" },
] as const;
export const FACTORY_SKILL_LABELS = {
  soft: "Habilidades blandas",
  technical: "Parte técnica",
  tools: "Manejo de herramientas",
} as const;
export const FACTORY_AFFINITY_LABELS = {
  numeric: "Razonamiento numérico",
  analytical: "Resolución de problemas",
  communication: "Comunicación y liderazgo",
  detail: "Atención al detalle",
  pressure: "Tolerancia a la presión",
  structure: "Creativo ↔ Estructurado",
} as const;
export const FACTORY_CAREER_STAGES = [
  {
    period: "Año 1",
    title: "Practicante / Analista junior",
    text: "Recoges datos, observas la operación y apoyas mejoras.",
  },
  {
    period: "Años 2–4",
    title: "Analista de procesos",
    text: "Diseñas y lideras proyectos de mejora continua.",
  },
  {
    period: "Años 5–8",
    title: "Jefatura de planta",
    text: "Coordinas la producción, la seguridad y a las personas.",
  },
  {
    period: "Tus caminos",
    title: "Calidad · Logística · Gerencia",
    text: "Puedes profundizar en calidad, cadena de suministro o dirección y emprendimiento. Esta experiencia es un punto de partida.",
  },
] as const;

export type FactoryPoint = { x: number; z: number };
export type FactorySolid = FactoryPoint & { id: string; w: number; d: number };
export type FactoryActor = FactoryPoint & {
  id: string;
  model: string;
  rotation: number;
};
export const FACTORY_PLAYER_RADIUS = 0.65;
export const FACTORY_ACTOR_RADIUS = 0.85;
export const FACTORY_CAMERA_ALPHA = -Math.PI / 3;
export const FACTORY_MACHINE_ROTATION = Math.PI;
const people = new Set([
  "altagracia",
  "wilfredo",
  "yuleisy",
  "kevin",
  "canteen",
  "gloves",
]);
const footprints: Record<string, { w: number; d: number; offsetX?: number }> = {
  machine: { w: 2.4, d: 1.92 },
  table: { w: 3, d: 1.5 },
  box: { w: 0.65, d: 0.5 },
  guard: { w: 1.9, d: 0.7 },
  cable: { w: 1.15, d: 0.35, offsetX: -0.5 },
  puddle: { w: 1.1, d: 0.65 },
};
export function factoryCanOccupy(
  x: number,
  z: number,
  solids: readonly FactorySolid[],
  radius = FACTORY_PLAYER_RADIUS,
): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
  const b = geometry.bounds;
  if (
    x < b.minX + radius ||
    x > b.maxX - radius ||
    z < b.minZ + radius ||
    z > b.maxZ - radius
  )
    return false;
  return !solids.some(
    (s) =>
      Math.abs(x - s.x) < s.w / 2 + radius &&
      Math.abs(z - s.z) < s.d / 2 + radius,
  );
}
export function factoryNearestPosition(
  point: FactoryPoint,
  walkable: (x: number, z: number) => boolean,
): FactoryPoint {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.z))
    point = { x: -13, z: 12 };
  if (walkable(point.x, point.z)) return { x: point.x, z: point.z };
  for (let radius = 0.5; radius <= 40; radius += 0.5)
    for (let i = 0; i < 32; i++) {
      const a = (i * Math.PI) / 16,
        x = point.x + Math.cos(a) * radius,
        z = point.z + Math.sin(a) * radius;
      if (walkable(x, z)) return { x, z };
    }
  return { x: -13, z: 12 };
}
export function factoryNavigation(
  placements: readonly (FactoryPoint & { id?: string })[] = STATIONS,
  options: {
    installed?: boolean;
    hazards?: readonly string[];
    yuleisyAbsent?: boolean;
    staff?: Record<string, string>;
    openZones?: readonly string[];
  } = {},
) {
  const solids: FactorySolid[] = FACTORY_ZONES.flatMap((r) =>
    r.door
      ? [-1, 1].map((side) => ({
          id: "wall-" + r.id + side,
          x: r.x + (side * (r.w + r.door!)) / 4,
          z: r.z - r.d / 2,
          w: (r.w - r.door!) / 2 + 0.25,
          d: 0.3,
        }))
      : [
          {
            id: "wall-" + r.id,
            x: r.x,
            z: r.z - r.d / 2,
            w: r.w + 0.25,
            d: 0.3,
          },
        ],
  );
  for (const f of geometry.furniture) {
    const zone = FACTORY_ZONES.find((r) => r.id === f.zone)!;
    solids.push({ ...f, x: zone.x + f.x, z: zone.z + f.z });
  }
  placements.forEach((p, i) =>
    solids.push({
      id: STATIONS[i]?.id ?? String(i),
      ...p,
      ...footprints.machine!,
    }),
  );
  for (const t of FACTORY_TARGETS)
    if (
      !people.has(t.id) &&
      !STATIONS.some((s) => s.id === t.id) &&
      !options.hazards?.includes(t.id)
    )
      solids.push({
        ...t,
        ...footprints[t.model]!,
        x: t.x + (footprints[t.model]?.offsetX ?? 0),
      });
  if (options.installed)
    solids.push({ id: "parallel", x: 3, z: 1, ...footprints.machine! });
  const inOpenZone = (x: number, z: number) =>
    !options.openZones ||
    !FACTORY_ZONES.some(
      (r) =>
        Math.abs(x - r.x) < r.w / 2 &&
        Math.abs(z - r.z) < r.d / 2 &&
        !options.openZones!.includes(r.id),
    );
  const actors: FactoryActor[] = [];
  const addActor = (
    id: string,
    model: string,
    point: FactoryPoint,
    rotation = 0,
  ) => {
    const p = factoryNearestPosition(point, (x, z) =>
      factoryCanOccupy(x, z, solids, FACTORY_ACTOR_RADIUS),
    );
    actors.push({ id, model, ...p, rotation });
    solids.push({
      id,
      ...p,
      w: FACTORY_ACTOR_RADIUS * 2,
      d: FACTORY_ACTOR_RADIUS * 2,
    });
  };
  placements.forEach((p, i) => {
    const station = STATIONS.find((s) => s.id === p.id) ?? STATIONS[i]!;
    if (!Object.keys(options.staff ?? {}).length || options.staff?.[station.id])
      addActor(
        "operator-" + station.id,
        options.staff?.[station.id] === "wilfredo" ? "wilfredo" : "operator",
        { x: p.x + 0.65, z: p.z - 1.85 },
        0,
      );
  });
  for (const t of FACTORY_TARGETS.filter((t) => people.has(t.id))) {
    if (t.id === "yuleisy" && options.yuleisyAbsent) continue;
    if (
      t.id === "wilfredo" &&
      Object.values(options.staff ?? {}).includes("wilfredo")
    )
      continue;
    addActor(t.id, t.model, t);
  }
  return {
    solids,
    actors,
    walkable: (x: number, z: number) =>
      inOpenZone(x, z) && factoryCanOccupy(x, z, solids),
  };
}
const defaultNavigation = factoryNavigation();
export function factoryWalkable(
  x: number,
  z: number,
  placements: readonly FactoryPoint[] = STATIONS,
): boolean {
  return (
    placements === STATIONS ? defaultNavigation : factoryNavigation(placements)
  ).walkable(x, z);
}
/** Convert screen directions to the fixed isometric camera's ground plane. */
export function factoryMovement(x: number, z: number): FactoryPoint {
  return {
    x: -Math.sin(FACTORY_CAMERA_ALPHA) * x + Math.cos(FACTORY_CAMERA_ALPHA) * z,
    z: Math.cos(FACTORY_CAMERA_ALPHA) * x + Math.sin(FACTORY_CAMERA_ALPHA) * z,
  };
}
/** A nearby practice point, unrelated to story discoveries or assessment. */
export function factoryPracticePoint(
  origin: FactoryPoint,
  walkable: (x: number, z: number) => boolean,
): FactoryPoint {
  const room = FACTORY_ZONES.find(
    (r) =>
      Math.abs(origin.x - r.x) < r.w / 2 && Math.abs(origin.z - r.z) < r.d / 2,
  );
  for (const radius of [2.8, 2.3, 3.3])
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 8,
        p = {
          x: origin.x + Math.cos(a) * radius,
          z: origin.z + Math.sin(a) * radius,
        };
      if (
        room &&
        (Math.abs(p.x - room.x) > room.w / 2 - 0.8 ||
          Math.abs(p.z - room.z) > room.d / 2 - 0.8)
      )
        continue;
      if (walkable(p.x, p.z) && factoryPath(origin, p, walkable).length)
        return p;
    }
  return factoryNearestPosition({ x: origin.x + 2, z: origin.z }, walkable);
}
/** Observable geometry only: overlap hints do not evaluate or score a layout. */
export function factoryLayoutConflicts(
  placements: readonly (FactoryPoint & { id: string })[],
  installed = false,
): string[] {
  const objects = installed
    ? [...placements, { id: "parallel", x: 3, z: 1 }]
    : placements;
  const conflicts = new Set<string>();
  for (let i = 0; i < objects.length; i++)
    for (const b of objects.slice(i + 1)) {
      const a = objects[i]!;
      if (Math.abs(a.x - b.x) < 2.4 && Math.abs(a.z - b.z) < 1.92) {
        conflicts.add(a.id);
        conflicts.add(b.id);
      }
    }
  return [...conflicts];
}
export function factoryPath(
  from: { x: number; z: number },
  to: { x: number; z: number },
  walkable: (x: number, z: number) => boolean = factoryWalkable,
  arrivalDistance?: number,
): { x: number; z: number }[] {
  const step = 0.5;
  const key = (x: number, z: number) => `${x},${z}`;
  const start = factoryNearestPosition(from, walkable);
  const sx = 0,
    sz = 0;
  const radius = arrivalDistance ?? (walkable(to.x, to.z) ? 0.4 : 1.75);
  const queue: [number, number][] = [[sx, sz]],
    previous = new Map<string, [number, number] | null>([[key(sx, sz), null]]);
  let goal: [number, number] | null = null;
  for (let i = 0; i < queue.length && i < 6000; i++) {
    const [x, z] = queue[i]!;
    if (
      walkable(start.x + x * step, start.z + z * step) &&
      Math.hypot(start.x + x * step - to.x, start.z + z * step - to.z) <= radius
    ) {
      goal = [x, z];
      break;
    }
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx!,
        nz = z + dz!,
        k = key(nx, nz);
      if (
        !previous.has(k) &&
        walkable(start.x + nx * step, start.z + nz * step)
      ) {
        previous.set(k, [x, z]);
        queue.push([nx, nz]);
      }
    }
  }
  if (!goal) return [];
  const path: { x: number; z: number }[] = [];
  let cursor: [number, number] | null = goal;
  while (cursor) {
    path.push({ x: start.x + cursor[0] * step, z: start.z + cursor[1] * step });
    cursor = previous.get(key(...cursor)) ?? null;
  }
  return path.reverse().slice(1);
}
