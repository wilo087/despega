import type {
  AffinityAxis,
  AffinityDelta,
  AffinityProfile,
  AppliedOutcome,
  CareerModule,
  PublicScene,
  SceneResponse,
  SimulationState,
} from "../types.ts";
import { SimulationError } from "../engine.ts";
import {
  INDUSTRIAL_DIALOGUES,
  INDUSTRIAL_DISCOVERIES,
  INDUSTRIAL_FEEDBACK,
} from "../modules/ingenieria-industrial.ts";
import {
  DEFAULT_LAYOUT,
  FACTORY_TARGETS,
  FACTORY_WORKERS,
  STATIONS,
} from "./world.ts";
import type {
  FactoryCommand,
  FactoryState,
  Placement,
  PublicFactoryWorld,
  Skill,
} from "./types.ts";
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const positiveAxes = [
  "numeric",
  "analytical",
  "communication",
  "detail",
  "pressure",
] as const;
// Maxima from declared opportunities, not from the student's choices. EST stays signed.
const maxima = {
  numeric: 21,
  analytical: 31,
  communication: 32,
  detail: 32,
  pressure: 13,
};
export function initialFactoryState(): FactoryState {
  return {
    avatar: "alma",
    position: { x: -13, z: 12 },
    visited: [],
    hazards: [],
    objectives: [],
    measurements: {},
    layout: DEFAULT_LAYOUT.map((p) => ({ ...p })),
    budget: [],
    skills: {
      soft: { earned: 0, possible: 0 },
      technical: { earned: 0, possible: 0 },
      tools: { earned: 0, possible: 0 },
    },
    taskElapsedMs: 0,
    paused: false,
    layoutPenalized: false,
    production: {
      good: 0,
      rejected: 0,
      workedSeconds: [0, 0, 0],
      downtimeSeconds: 0,
    },
  };
}
export function factoryAffinity(
  state: Pick<SimulationState, "affinity">,
): AffinityProfile {
  const normalized = {
    analytical: 0,
    communication: 0,
    detail: 0,
    pressure: 0,
    structure: clamp(state.affinity.structure, -11, 11),
    numeric: 0,
  };
  for (const axis of positiveAxes)
    normalized[axis] = Math.round(
      clamp((state.affinity[axis] ?? 0) / maxima[axis], 0, 1) * 100,
    );
  return {
    raw: { ...state.affinity },
    normalized,
    ranking: [...positiveAxes].sort((a, b) => normalized[b] - normalized[a]),
    unavailable: [],
  };
}
function stationCycles(state: SimulationState): Record<string, number> {
  const w = state.factory!,
    trained = w.budget.includes("training");
  return {
    feed: 8,
    fill: trained ? 7.65 : 8.5,
    seal:
      state.sessionIndex === 0
        ? 14
        : state.flags.solucion_elegida === "parallel" &&
            w.budget.includes("install") &&
            state.flags.bodega_vista
          ? 7
          : 11,
    label: 7.5,
    pack: trained ? 7.38 : 8.2,
  };
}
export function factoryCycle(state: SimulationState): number {
  return Math.max(...Object.values(stationCycles(state)));
}
export function factorySpent(state: SimulationState): number {
  const costs: Record<string, number> = {
    training: 1500,
    maintenance: 2000,
    install: 2500,
    overtime: 3000,
  };
  return (
    state.factory!.budget.reduce((sum, id) => sum + (costs[id] ?? 0), 0) +
    (state.flags.machinePurchased ? 2000 : 0)
  );
}
function produce(state: SimulationState, seconds: number, day: number) {
  const w = state.factory!;
  const overtime = day === 1 && w.budget.includes("overtime") ? 14400 : 0;
  const amount = Math.min(
    Math.max(0, seconds),
    28800 + overtime - w.production.workedSeconds[day]!,
  );
  const stop = Math.min(amount, w.production.downtimeSeconds);
  w.production.downtimeSeconds -= stop;
  const covered = state.flags.staffCovered !== false;
  const gross = covered ? (amount - stop) / factoryCycle(state) : 0;
  const defects = state.flags.defectRisk
    ? 0.09
    : day === 0
      ? 0.03
      : w.budget.includes("training") || w.budget.includes("maintenance")
        ? 0.01
        : 0.03;
  w.production.good += gross * (1 - defects);
  w.production.rejected += gross * defects;
  w.production.workedSeconds[day]! += amount;
}
export function factoryPublic(
  module: CareerModule,
  state: SimulationState,
): PublicFactoryWorld {
  const w = state.factory!;
  const task =
    module.sessions[state.sessionIndex]!.scenes[state.sceneIndex]!.factory!;
  let choices = task.choices?.map((c) => ({ ...c }));
  if (
    state.sessionIndex === 2 &&
    state.sceneIndex === 1 &&
    w.budget.includes("maintenance")
  )
    choices = choices?.filter((c) => c.id === "stop");
  return {
    ...(w.tutorial
      ? {
          tutorial: {
            step: w.tutorial.step,
            active: w.tutorial.active,
            completed: w.tutorial.completed,
            suspended: w.tutorial.suspended,
            origin: { ...w.tutorial.origin },
          },
        }
      : {}),
    task: {
      kind: task.kind,
      zone: task.zone,
      speaker: task.speaker,
      prompt:
        (module.sessions[state.sessionIndex]!.scenes[state.sceneIndex]!.id ===
        "3.3"
          ? Number(state.flags.confianza_yuleisy) > 0
            ? "Yuleisy llamó para avisar que no podrá llegar. "
            : "Yuleisy no llegó y el equipo todavía no recibió un aviso. "
          : "") +
        task.prompt.replaceAll("{nombre}", state.playerName) +
        (state.flags.pilotReportError && state.sessionIndex === 2
          ? " El informe de la prueba tiene diferencias: verifica las cifras antes de comprometer el despacho."
          : ""),
      ...(task.timeLimit &&
      (module.sessions[state.sessionIndex]!.scenes[state.sceneIndex]!.id !==
        "1.6" ||
        w.sheetReady)
        ? { timeLimit: task.timeLimit * (state.flags.extendedTime ? 2 : 1) }
        : {}),
      ...(choices ? { choices } : {}),
      ...(task.cards ? { cards: task.cards.map((c) => ({ ...c })) } : {}),
      ...(task.categories
        ? { categories: task.categories.map((c) => ({ ...c })) }
        : {}),
      ...(task.method ? { method: true } : {}),
      ...(task.samples ? { samples: task.samples.map((s) => ({ ...s })) } : {}),
    },
    lineRunning:
      !["1.8", "1.9", "3.2"].includes(
        module.sessions[state.sessionIndex]!.scenes[state.sceneIndex]!.id,
      ) &&
      w.production.downtimeSeconds <= 0 &&
      (state.sessionIndex !== 2 || w.production.workedSeconds[2]! < 28800),
    stationCycles: stationCycles(state),
    yuleisyAbsent: state.sessionIndex === 2 && state.sceneIndex >= 2,
    avatar: w.avatar,
    position: { ...w.position },
    visited: [...w.visited],
    hazards: [...w.hazards],
    objectives: [...w.objectives],
    measurements: structuredClone(w.measurements),
    layout: w.layout.map((p) => ({ ...p })),
    budget: [...w.budget],
    openZones: [
      "entrance",
      "office",
      ...(w.objectives.includes("1.2") ? ["line"] : []),
      ...(w.objectives.includes("1.3") ? ["warehouse", "canteen"] : []),
      ...(w.objectives.includes("1.9") ? ["quality"] : []),
    ],
    remaining: Math.max(0, 9000 - Math.floor(w.production.good)),
    produced: Math.floor(w.production.good),
    rejected: Math.floor(w.production.rejected),
    spent: factorySpent(state),
    climate: Number(state.flags.clima_equipo),
    wilfredoTrust: Number(state.flags.confianza_wilfredo),
    yuleisyTrust: Number(state.flags.confianza_yuleisy),
    ally: !!state.flags.aliado_wilfredo,
    machineFound: !!state.flags.bodega_vista,
    purchaseRequired: !!state.flags.machinePurchased,
    extendedTime: !!state.flags.extendedTime,
    ...(w.draft ? { draft: structuredClone(w.draft) } : {}),
    shiftSecondsRemaining: Math.max(
      0,
      Math.ceil((28800 - w.production.workedSeconds[2]!) / 19.2),
    ),
    incidents: state.flags.incident ? 1 : 0,
    reportEstimated: !!state.flags.pilotReportError,
    measurementEstimated: !!state.flags.estimatedData,
    staff:
      typeof state.flags.staffAssignment === "string"
        ? JSON.parse(state.flags.staffAssignment)
        : {},
    taskElapsedMs: w.taskElapsedMs,
    paused: w.paused,
    ...(w.lastReaction ? { reaction: w.lastReaction } : {}),
    affinity: factoryAffinity(state),
    skills: Object.fromEntries(
      Object.entries(w.skills).map(([id, s]) => [
        id,
        s.possible ? Math.round((s.earned / s.possible) * 100) : null,
      ]),
    ) as Record<Skill, number | null>,
    ...(w.production.dispatched !== undefined
      ? { shipment: w.production.dispatched }
      : {}),
    cycleSeconds: factoryCycle(state),
    overtime: w.budget.includes("overtime"),
  };
}
export function getFactoryScene(
  module: CareerModule,
  state: SimulationState,
): PublicScene | null {
  if (
    state.status === "completed" ||
    state.sessions[state.sessionIndex]?.status !== "in_progress"
  )
    return null;
  const session = module.sessions[state.sessionIndex]!;
  const scene = session.scenes[state.sceneIndex]!;
  return {
    id: scene.id,
    title: scene.title,
    screen: "factory",
    participants: Object.keys(module.characters),
    hud: {},
    lines: [
      {
        speaker: scene.factory!.speaker,
        text: scene.factory!.prompt.replaceAll("{nombre}", state.playerName),
        mood: "neutral",
      },
    ],
    session: { id: session.id, number: session.number, title: session.title },
    sceneNumber: state.sceneIndex + 1,
    sceneCount: session.scenes.length,
    interaction: {
      kind: "none",
      continueLabel: "Continuar",
      cutToBlack: scene.factory!.kind === "cutscene",
    },
    factory: factoryPublic(module, state),
  };
}
export function validateFactoryLayout(layout: readonly Placement[]): string[] {
  const errors: string[] = [];
  const ids = layout.map((p) => p.id);
  if (
    STATIONS.some((s) => !ids.includes(s.id)) ||
    ids.length !== 5 ||
    new Set(ids).size !== 5
  )
    errors.push("Ubica las cinco estaciones una sola vez.");
  for (const p of layout) {
    if (
      !Number.isFinite(p.x) ||
      !Number.isFinite(p.z) ||
      Math.abs(p.x) > 5 ||
      p.z < -8 ||
      p.z > 10
    )
      errors.push(
        "Conserva las máquinas dentro de la Línea 2 y despeja la salida.",
      );
  }
  for (let i = 0; i < layout.length; i++)
    for (let j = i + 1; j < layout.length; j++)
      if (
        Math.abs(layout[i]!.x - layout[j]!.x) < 3 &&
        Math.abs(layout[i]!.z - layout[j]!.z) < 3
      )
        errors.push("Se requiere un metro libre entre máquinas.");
  const ordered = STATIONS.map((s) => layout.find((p) => p.id === s.id));
  for (let i = 1; i < ordered.length; i++)
    if (ordered[i] && ordered[i - 1] && ordered[i]!.z <= ordered[i - 1]!.z)
      errors.push(
        "El recorrido debe avanzar sin cruces: alimentación, llenado, sellado, etiquetado y empaque.",
      );
  return [...new Set(errors)];
}
function invalid(message: string): never {
  throw new SimulationError("INVALID_RESPONSE", message);
}
export function applyFactoryResponse(
  module: CareerModule,
  current: SimulationState,
  input: {
    sceneId: string;
    response: SceneResponse;
    elapsedMs: number;
    now: string;
  },
): { state: SimulationState; outcome: AppliedOutcome } {
  if (!current.factory || input.response.kind !== "factory")
    invalid("La respuesta no corresponde a esta experiencia.");
  const currentScene =
    module.sessions[current.sessionIndex]?.scenes[current.sceneIndex];
  if (current.status === "completed")
    throw new SimulationError("MODULE_COMPLETED", "La experiencia ya terminó.");
  if (current.sessions[current.sessionIndex]?.status !== "in_progress")
    throw new SimulationError(
      "SESSION_NOT_STARTED",
      "Abre la sesión disponible.",
    );
  if (currentScene?.id !== input.sceneId)
    throw new SimulationError(
      "SCENE_MISMATCH",
      "El objetivo cambió. Recupera tu progreso.",
    );
  const state = structuredClone(current);
  const w = state.factory!;
  const task = currentScene.factory!;
  const c: FactoryCommand = input.response.command;
  const serverDelta = Math.max(
    0,
    Date.parse(input.now) - Date.parse(current.updatedAt),
  );
  if (
    w.paused &&
    !["resume", "pause", "checkpoint", "settings", "tutorial"].includes(c.op)
  )
    invalid("Reanuda la experiencia antes de responder.");
  if (w.tutorial?.active && ["submit", "interact", "draft"].includes(c.op))
    invalid(
      "Termina u omite la guía de controles para continuar con la tarea.",
    );
  const reported = c.op === "checkpoint" ? c.elapsedMs : input.elapsedMs;
  const elapsed = w.paused
    ? 0
    : Math.min(20_000, Math.max(0, reported), serverDelta);
  w.taskElapsedMs += elapsed;
  state.sessions[state.sessionIndex]!.elapsedMs += elapsed;
  if (
    state.sessionIndex === 2 &&
    currentScene.id !== "3.8" &&
    currentScene.id !== "3.9"
  )
    produce(state, (elapsed * 19.2) / 1000, 2);
  state.updatedAt = input.now;
  let advance = false,
    performance = 0,
    affinity: AffinityDelta = {},
    credit: number | undefined,
    resolvedTimeout = false,
    reaction = "",
    label = currentScene.title;
  const add = (delta: AffinityDelta) => {
    for (const [axis, value] of Object.entries(delta))
      affinity[axis as AffinityAxis] =
        (affinity[axis as AffinityAxis] ?? 0) + (value ?? 0);
  };
  if (c.op === "tutorial") {
    const position = c.position;
    if (
      position &&
      (!Number.isFinite(position.x) ||
        !Number.isFinite(position.z) ||
        position.x < -19 ||
        position.x > 19 ||
        position.z < -14 ||
        position.z > 16)
    )
      invalid("La posición de práctica no es válida.");
    if (c.action === "start") {
      if (!w.tutorial?.active) {
        if (position) w.position = { ...position };
        w.tutorial = {
          step: "welcome",
          active: true,
          completed: w.tutorial?.completed ?? false,
          suspended: false,
          returnPaused: w.paused,
          origin: { ...w.position },
        };
        w.paused = true;
      }
    } else {
      const tutorial = w.tutorial;
      if (!tutorial?.active) invalid("No hay una guía activa.");
      if (c.action === "advance") {
        if (tutorial.suspended) invalid("Reanuda la guía antes de continuar.");
        if (c.expectedStep !== tutorial.step)
          invalid("El paso de la guía cambió. Recupera tu progreso.");
        const next = {
          welcome: "move",
          move: "interact",
          interact: "tablet",
          tablet: "ready",
        } as const;
        if (tutorial.step === "ready")
          invalid("La práctica ya está lista para terminar.");
        tutorial.step = next[tutorial.step];
        if (position) w.position = { ...position };
      } else {
        if (c.action === "finish" && tutorial.step !== "ready")
          invalid("Completa la práctica o usa Omitir tutorial.");
        tutorial.active = false;
        tutorial.completed = true;
        tutorial.suspended = false;
        w.paused = tutorial.returnPaused;
      }
    }
  } else if (c.op === "settings") state.flags.extendedTime = c.extendedTime;
  else if (c.op === "draft") {
    const { op: _, ...draft } = c;
    w.draft = draft;
    if (
      currentScene.id === "1.6" &&
      !w.sheetReady &&
      STATIONS.every((s) => draft.assignments?.[s.id])
    ) {
      w.sheetReady = true;
      w.taskElapsedMs = 0;
    }
  } else if (c.op === "pause") {
    w.paused = true;
    if (w.tutorial?.active) w.tutorial.suspended = true;
  } else if (c.op === "resume") {
    if (w.tutorial?.active) w.tutorial.suspended = false;
    else w.paused = false;
  } else if (c.op === "checkpoint") {
    if (
      c.position &&
      Number.isFinite(c.position.x) &&
      Number.isFinite(c.position.z) &&
      c.position.x >= -19 &&
      c.position.x <= 19 &&
      c.position.z >= -14 &&
      c.position.z <= 16
    )
      w.position = { ...c.position };
  } else if (c.op === "interact") {
    const target = FACTORY_TARGETS.find((t) => t.id === c.targetId);
    if (!target) invalid("Ese objeto no existe.");
    if (
      task.kind === "hazards" &&
      ["puddle", "guard", "exit", "gloves", "cable"].includes(target.id)
    ) {
      if (!w.hazards.includes(target.id)) {
        w.hazards.push(target.id);
        add({ detail: 2 });
        reaction = INDUSTRIAL_DISCOVERIES[target.id]!;
      }
    } else if (
      task.kind === "explore" &&
      ["wilfredo", "yuleisy", "kevin", "spare", "canteen"].includes(target.id)
    ) {
      if (!w.visited.includes(target.id)) {
        w.visited.push(target.id);
        reaction = INDUSTRIAL_DISCOVERIES[target.id]!;
        if (target.id === "kevin" || target.id === "spare") {
          if (!state.flags.bodega_vista) add({ analytical: 3 });
          state.flags.bodega_vista = true;
        }
        if (target.id === "yuleisy") {
          state.flags.confianza_yuleisy = clamp(
            Number(state.flags.confianza_yuleisy) + 1,
            -3,
            3,
          );
        }
        if (target.id === "canteen")
          state.flags.clima_equipo = clamp(
            Number(state.flags.clima_equipo) + 5,
            0,
            100,
          );
      }
    } else if (target.zone === task.zone) {
      if (!w.visited.includes(`${currentScene.id}:${target.id}`))
        w.visited.push(`${currentScene.id}:${target.id}`);
      reaction = `${target.label}: ${task.prompt}`;
    } else invalid("Ese objeto no está disponible para el objetivo actual.");
  } else if (c.op === "submit") {
    const timeout =
      !!c.timedOut ||
      (!!task.timeLimit &&
        (currentScene.id !== "1.6" || !!w.sheetReady) &&
        w.taskElapsedMs >=
          task.timeLimit * 1000 * (state.flags.extendedTime ? 2 : 1));
    resolvedTimeout = timeout;
    const picked = timeout ? [] : (c.choices ?? []);
    if (new Set(picked).size !== picked.length)
      invalid("No repitas una selección.");
    label =
      picked
        .map(
          (id) =>
            [...(task.choices ?? []), ...(task.cards ?? [])].find(
              (o) => o.id === id,
            )?.label ?? id,
        )
        .join(" · ") || currentScene.title;
    const allowed = [...(task.choices ?? []), ...(task.cards ?? [])].map(
      (o) => o.id,
    );
    if (
      task.kind !== "inspection" &&
      picked.some((id) => !allowed.includes(id))
    )
      invalid("La selección contiene una opción inexistente.");
    const method = c.method ?? w.draft?.method;
    if (task.method) {
      if (!timeout && method !== "structured" && method !== "creative")
        invalid("Elige cómo abordarás la tarea.");
    }
    advance = true;
    switch (task.kind) {
      case "avatar":
        if (!c.avatar || !c.name?.trim())
          invalid("Elige un personaje y escribe tu nombre.");
        w.avatar = c.avatar;
        state.playerName = c.name.replace(/\s+/g, " ").trim().slice(0, 40);
        reaction =
          "Tu equipo te espera. Acércate a Operaciones para conocer el pedido.";
        break;
      case "walk":
        if (!w.visited.some((id) => id.startsWith(currentScene.id + ":")))
          invalid("Acércate al objetivo e interactúa antes de continuar.");
        reaction =
          "Llegaste al punto de encuentro. Tu equipo tiene información para compartir.";
        break;
      case "dialogue": {
        if (
          currentScene.id === "3.2" &&
          w.budget.includes("maintenance") &&
          !timeout &&
          picked[0] !== "stop"
        )
          invalid(
            "El mantenimiento preventivo ya define la intervención de este turno.",
          );
        const rules = INDUSTRIAL_DIALOGUES[currentScene.id];
        const entry = rules?.[picked[0] ?? ""];
        if (!entry && !timeout) invalid("Elige una respuesta.");
        if (entry) {
          add(entry.affinity ?? {});
          state.flags = { ...state.flags, ...entry.flags };
          state.flags.confianza_wilfredo = clamp(
            Number(state.flags.confianza_wilfredo) + (entry.trust ?? 0),
            -3,
            3,
          );
          state.flags.confianza_yuleisy = clamp(
            Number(state.flags.confianza_yuleisy) + (entry.yuleisy ?? 0),
            -3,
            3,
          );
          state.flags.clima_equipo = clamp(
            Number(state.flags.clima_equipo) + (entry.climate ?? 0),
            0,
            100,
          );
          reaction = entry.reaction;
          credit =
            picked[0] === "blame" ||
            picked[0] === "impose" ||
            picked[0] === "ignore"
              ? 0
              : 1;
        } else {
          reaction =
            "El equipo interviene al agotarse el tiempo. La operación continúa y puedes revisar lo ocurrido en la tablet.";
          credit = 0;
          performance = -3;
        }
        if (currentScene.id === "2.6") {
          state.flags.aliado_wilfredo =
            Number(state.flags.confianza_wilfredo) >= 2;
          if (state.flags.aliado_wilfredo) performance = 4;
        }
        if (currentScene.id === "3.2")
          w.production.downtimeSeconds += Number(entry?.flags?.downtime ?? 0);
        if (currentScene.id === "3.5") {
          performance =
            picked[0] === "ignore"
              ? -6
              : picked[0] === "stop"
                ? -2
                : performance;
          state.flags.incident = true;
          if (picked[0] === "stop") w.production.downtimeSeconds += 600;
        }
        break;
      }
      case "hazards": {
        if (!timeout && picked.length !== 3)
          invalid("Elige tres elementos de protección.");
        const p = picked.filter((id) =>
          ["helmet", "glasses", "gloves"].includes(id),
        ).length;
        add({ detail: p });
        state.flags.peligros_omitidos = 5 - w.hazards.length;
        credit = (w.hazards.length + p) / 8;
        performance = credit === 1 ? 4 : 0;
        break;
      }
      case "explore":
        if (picked[0] === "respect") {
          state.flags.confianza_wilfredo = clamp(
            Number(state.flags.confianza_wilfredo) + 1,
            -3,
            3,
          );
          add({ communication: 2 });
        } else if (picked[0] === "accuse") {
          state.flags.confianza_wilfredo = clamp(
            Number(state.flags.confianza_wilfredo) - 2,
            -3,
            3,
          );
          add({ communication: -1 });
        }
        credit = picked[0] === "accuse" ? 0 : picked[0] === "respect" ? 1 : 0.5;
        reaction =
          "Tu recorrido queda registrado. Lo que escuchaste puede cambiar las opciones del próximo turno.";
        break;
      case "measure": {
        const records =
          c.measurements ?? w.draft?.measurements ?? w.measurements;
        let correct = 0;
        for (const s of STATIONS) {
          const times = records[s.id] ?? [];
          if (!timeout && !w.visited.includes(`${currentScene.id}:${s.id}`))
            invalid(
              "Visita cada estación y observa sus ciclos antes de enviar las mediciones.",
            );
          if (
            times.some((n) => !Number.isFinite(n) || n < 0 || n > 120) ||
            times.length > 3
          )
            invalid("La medición no es válida.");
          if (!timeout && times.length !== 3)
            invalid(
              "Registra tres ciclos por estación o espera el cierre del cronómetro.",
            );
          if (
            times.length === 3 &&
            Math.abs(times.reduce((a, b) => a + b, 0) / 3 - s.cycle) <= 1
          )
            correct++;
        }
        w.measurements = records;
        add(
          correct >= 4
            ? { numeric: 6, detail: 3 }
            : correct >= 2
              ? { numeric: 3 }
              : { numeric: 1 },
        );
        credit = correct / 5;
        performance = correct >= 4 ? 4 : correct <= 1 ? -2 : 0;
        state.flags.estimatedData = correct <= 1;
        break;
      }
      case "spreadsheet": {
        if (currentScene.id === "1.6" && !timeout) {
          const cells = c.assignments ?? w.draft?.assignments ?? {};
          const values = Object.values(cells);
          if (
            STATIONS.some((s) => !cells[s.id]) ||
            values.length !== 5 ||
            new Set(values).size !== 5 ||
            values.some((id) => !STATIONS.some((s) => s.id === id))
          )
            invalid(
              "Ubica una medición en cada fila de la hoja antes de compartir tu diagnóstico.",
            );
        }

        const correct =
          currentScene.id === "1.6"
            ? picked[0] === "seal"
            : c.value === 68 &&
              ["seal", "label", "fill", "box", "other"].every(
                (id, i) => picked[i] === id,
              );
        add(
          correct
            ? currentScene.id === "1.6"
              ? { numeric: 4, analytical: 4 }
              : { numeric: 5, detail: 3 }
            : timeout
              ? { pressure: 1 }
              : {},
        );
        performance = correct ? 4 : currentScene.id === "1.6" ? -3 : -2;
        credit = correct ? 1 : 0;
        if (picked[0] === "people") {
          state.flags.clima_equipo = clamp(
            Number(state.flags.clima_equipo) - 10,
            0,
            100,
          );
          state.flags.confianza_wilfredo = clamp(
            Number(state.flags.confianza_wilfredo) - 1,
            -3,
            3,
          );
        }
        break;
      }
      case "message": {
        if (
          !timeout &&
          (picked.length < 2 ||
            picked.length > 4 ||
            (currentScene.id === "1.7" && picked.length > 3))
        )
          invalid("Completa el mensaje con los bloques indicados.");
        const professional =
          currentScene.id === "1.7"
            ? picked.filter((id) => ["data", "plan", "update"].includes(id))
                .length
            : picked.filter((id) =>
                ["figure", "risk", "plan", "update"].includes(id),
              ).length;
        const full =
          currentScene.id === "1.7"
            ? professional === picked.length && professional >= 2
            : ["figure", "plan", "update"].every((id) => picked.includes(id)) &&
              !picked.includes("promise");
        if (currentScene.id === "3.4" && picked.includes("promise")) {
          state.flags.unbackedPromise = true;
          credit = 0;
          performance = 0;
          add({ pressure: 1, communication: -3 });
        } else {
          credit = full ? 1 : professional ? 0.5 : 0;
          add(
            full
              ? currentScene.id === "1.7"
                ? { communication: 6 }
                : { communication: 5, pressure: 2 }
              : professional
                ? { communication: 1 }
                : {},
          );
          performance = full
            ? 4
            : timeout
              ? -3
              : professional
                ? 0
                : currentScene.id === "1.7"
                  ? -4
                  : 0;
        }
        break;
      }
      case "causes": {
        const assignments = c.assignments ?? {};
        if (
          Object.keys(assignments).some(
            (id) => !task.cards?.some((card) => card.id === id),
          ) ||
          Object.values(assignments).some(
            (id) => !task.categories?.some((cat) => cat.id === id),
          )
        )
          invalid("La categoría no existe.");
        const correct = Object.entries(task.answers ?? {}).filter(
          ([id, answer]) => assignments[id] === answer,
        ).length;
        add(
          correct >= 7
            ? { analytical: 5, detail: 2 }
            : correct >= 4
              ? { analytical: 2 }
              : {},
        );
        credit = correct / 8;
        performance = correct >= 7 ? 4 : correct < 4 ? -2 : 0;
        break;
      }
      case "layout": {
        const layout = c.guided
          ? DEFAULT_LAYOUT.map((p) => ({ ...p }))
          : (c.layout ?? []);
        const errors = validateFactoryLayout(layout);
        if (
          picked[0] === "parallel" &&
          state.flags.bodega_vista &&
          layout.some((p) => Math.abs(p.x - 3) < 3 && Math.abs(p.z - 1) < 3)
        )
          errors.push(
            "Deja un metro libre alrededor de la segunda selladora en paralelo.",
          );
        if (errors.length) {
          advance = false;
          reaction = errors.join(" ");
          if (!w.layoutPenalized) {
            performance = -2;
            w.layoutPenalized = true;
          }
          break;
        }
        if (picked.length !== 1) invalid("Elige una solución para la línea.");
        w.layout = layout;
        state.flags.solucion_elegida = picked[0]!;
        if (picked[0] === "parallel" && !state.flags.bodega_vista)
          state.flags.machinePurchased = true;
        credit = c.guided ? 0 : 1;
        performance = c.guided ? 0 : 4;
        if (!c.guided) add({ analytical: 6, detail: 4 });
        break;
      }
      case "budget": {
        w.budget = picked;
        const spent = factorySpent(state);
        if (spent > 5000) invalid("El plan supera los $5.000.");
        if (
          state.flags.solucion_elegida === "parallel" &&
          !picked.includes("install")
        )
          invalid("Incluye la instalación de la segunda selladora.");
        state.flags.presupuesto_usado = spent;
        if (picked.includes("overtime"))
          state.flags.clima_equipo = clamp(
            Number(state.flags.clima_equipo) - 15,
            0,
            100,
          );
        credit =
          picked.includes("training") || picked.includes("maintenance") ? 1 : 0;
        performance = credit ? 4 : 0;
        if (credit) add({ numeric: 4 });
        break;
      }
      case "inspection": {
        // The defects are observable visual evidence, not hidden answers in the public payload.
        const expected = (task.samples ?? [])
          .filter((s) => s.sealGap > 0)
          .map((s) => s.id);
        const full =
          picked.length === 3 && expected.every((id) => picked.includes(id));
        if (picked.some((id) => !/^sample-(?:[1-9]|10)$/.test(id)))
          invalid("Esa caja no pertenece a la muestra.");
        credit = full ? 1 : 0.25;
        add({ detail: full ? 4 : 1 });
        performance = full ? 4 : 0;
        state.flags.pilotReportError = !full;
        break;
      }
      case "staff": {
        const assignments = { ...(c.assignments ?? {}) };
        const missing = STATIONS.filter((s) => !assignments[s.id]);
        if (
          state.flags.aliado_wilfredo &&
          missing.length === 1 &&
          !Object.values(assignments).includes("wilfredo")
        )
          assignments[missing[0]!.id] = "wilfredo";
        const workers: string[] = FACTORY_WORKERS.filter(
          (p) => p.id !== "wilfredo" || state.flags.aliado_wilfredo,
        ).map((p) => p.id);
        const values = Object.values(assignments);
        if (
          values.some((id) => !workers.includes(id)) ||
          new Set(values).size !== values.length ||
          Object.keys(assignments).some(
            (id) => !STATIONS.some((s) => s.id === id),
          )
        )
          invalid("Asigna cada persona a una sola estación disponible.");
        const covered = STATIONS.every((s) => assignments[s.id]);
        state.flags.staffCovered = covered;
        state.flags.staffAssignment = JSON.stringify(assignments);
        const full = covered && assignments.seal === "rosa";
        credit = full ? 1 : covered ? 0.5 : 0;
        performance = full ? 4 : covered ? 0 : -3;
        if (full) add({ analytical: 5 });
        break;
      }
      case "dashboard":
        produce(state, 28800 - w.production.workedSeconds[2]!, 2);
        w.production.dispatched = Math.min(9000, Math.floor(w.production.good));
        reaction =
          w.production.dispatched >= 9000
            ? state.flags.aliado_wilfredo
              ? "El pedido está completo. Don Wilfredo reúne al equipo para celebrar el trabajo compartido."
              : "El pedido está completo. Altagracia reconoce los datos y propone seguir fortaleciendo la colaboración."
            : state.performance >= 45
              ? "El despacho es parcial. Marcos confirma la cantidad real y coordina el resto para el próximo envío."
              : "El pedido sale con retraso. Altagracia revisa contigo qué señales atender antes; la experiencia continúa.";
        break;
      case "cutscene":
      case "summary":
      case "timeline":
        reaction = task.prompt;
        break;
    }
    if (!reaction) {
      const feedback = INDUSTRIAL_FEEDBACK[currentScene.id];
      reaction =
        feedback?.[credit === 1 ? 0 : 1] ??
        "El equipo registra tu decisión y continúa contigo.";
    }
    if (advance) {
      if (task.method && method)
        add({
          structure:
            (currentScene.id === "1.3" ? 2 : 3) *
            (method === "structured" ? 1 : -1),
        });
      delete w.draft;
      w.objectives.push(currentScene.id);
      if (credit !== undefined)
        for (const skill of task.skills ?? []) {
          w.skills[skill].earned += credit;
          w.skills[skill].possible++;
        }
      if (
        task.kind !== "avatar" &&
        task.kind !== "walk" &&
        task.kind !== "cutscene" &&
        task.kind !== "summary" &&
        task.kind !== "timeline"
      )
        state.log.push({
          sceneId: currentScene.id,
          sessionId: module.sessions[state.sessionIndex]!.id,
          outcomeId: `${currentScene.id}:${credit ?? "choice"}`,
          label: currentScene.title,
          performanceDelta:
            clamp(state.performance + performance, 0, 100) - state.performance,
          affinityDelta: affinity,
          timedOut: timeout,
          at: input.now,
        });
      state.sceneIndex++;
      w.taskElapsedMs = 0;
      const next =
        module.sessions[state.sessionIndex]!.scenes[state.sceneIndex];
      if (next?.id === "3.5" && Number(state.flags.peligros_omitidos) < 3)
        state.sceneIndex++;
      if (
        state.sceneIndex >= module.sessions[state.sessionIndex]!.scenes.length
      ) {
        const index = state.sessionIndex;
        if (index < 2)
          produce(
            state,
            28800 +
              (index === 1 && w.budget.includes("overtime") ? 14400 : 0) -
              w.production.workedSeconds[index]!,
            index,
          );
        const record = state.sessions[index]!;
        record.status = "completed";
        record.completedAt = input.now;
        record.performanceEnd = clamp(state.performance + performance, 0, 100);
        record.affinityEnd = { ...state.affinity };
        if (index === 2) {
          state.status = "completed";
          state.completedAt = input.now;
        } else {
          state.sessionIndex++;
          state.sceneIndex = 0;
          state.sessions[state.sessionIndex]!.status = "available";
          w.position = { x: -13, z: 12 };
        }
      }
    }
  }
  if (!advance && performance !== 0) {
    const delta =
      clamp(state.performance + performance, 0, 100) - state.performance;
    if (delta !== 0)
      state.log.push({
        sceneId: currentScene.id,
        sessionId: module.sessions[current.sessionIndex]!.id,
        outcomeId: `${currentScene.id}:correction`,
        label: "Distribución pendiente de corregir",
        performanceDelta: delta,
        affinityDelta: {},
        timedOut: false,
        at: input.now,
      });
  }
  state.performance = clamp(state.performance + performance, 0, 100);
  for (const [axis, value] of Object.entries(affinity))
    state.affinity[axis as AffinityAxis] =
      (state.affinity[axis as AffinityAxis] ?? 0) + (value ?? 0);
  state.affinity.structure = clamp(state.affinity.structure, -11, 11);
  if (reaction) w.lastReaction = reaction;
  return {
    state,
    outcome: {
      sceneId: currentScene.id,
      sessionId: module.sessions[current.sessionIndex]!.id,
      outcomeId: `${currentScene.id}:${credit ?? c.op}`,
      label,
      timedOut: resolvedTimeout,
      performanceBefore: current.performance,
      performanceAfter: state.performance,
      performanceDelta: state.performance - current.performance,
      affinityDelta: affinity,
      reactions: [],
      ...(reaction ? { narration: reaction } : {}),
      detail: [
        "checkpoint",
        "pause",
        "resume",
        "settings",
        "draft",
        "tutorial",
      ].includes(c.op)
        ? { kind: "continue" }
        : { kind: "dialogue", optionId: null },
      sessionCompleted:
        state.sessionIndex !== current.sessionIndex ||
        state.status === "completed",
      moduleCompleted: state.status === "completed",
    },
  };
}
