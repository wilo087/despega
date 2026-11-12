import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applySceneResponse,
  createInitialState,
  getPublicScene,
  startSession,
  SimulationError,
} from "./engine.ts";
import { ingenieriaIndustrial as module } from "./modules/ingenieria-industrial.ts";
import { validateModule } from "./validation.ts";
import { validateFactoryLayout } from "./factory/engine.ts";
import {
  DEFAULT_LAYOUT,
  FACTORY_TARGETS,
  STATIONS,
  factoryPath,
  factoryWalkable,
} from "./factory/world.ts";
import type { FactoryCommand } from "./factory/types.ts";
import type { SimulationState } from "./types.ts";
const now = "2026-11-11T12:00:00.000Z";
function command(state: SimulationState, c: FactoryCommand) {
  const scene = module.sessions[state.sessionIndex]!.scenes[state.sceneIndex]!;
  return applySceneResponse(module, state, {
    sceneId: scene.id,
    response: { kind: "factory", command: c },
    elapsedMs: 0,
    now,
  }).state;
}
function initial() {
  return startSession(
    module,
    createInitialState(module, { playerName: "Alex", now }),
    { sessionIndex: 0, now },
  );
}
export function playFactory(
  quality = true,
  seed = 1,
  stopAt?: string,
): SimulationState {
  let state = initial();
  let iterations = 0;
  let random = seed;
  const next = () => {
    random = (random * 1664525 + 1013904223) >>> 0;
    return random / 4294967296;
  };
  while (state.status !== "completed") {
    assert.ok(iterations++ < 100);
    if (state.sessions[state.sessionIndex]!.status === "available")
      state = startSession(module, state, {
        sessionIndex: state.sessionIndex,
        now,
      });
    const scene =
      module.sessions[state.sessionIndex]!.scenes[state.sceneIndex]!;
    if (scene.id === stopAt) return state;
    const skill = seed > 2 ? next() > 0.35 : quality;
    const task = scene.factory!;
    let c: Extract<FactoryCommand, { op: "submit" }> = {
      op: "submit",
      method: seed % 2 ? "structured" : "creative",
    };
    switch (task.kind) {
      case "avatar":
        c = { ...c, avatar: seed % 2 ? "alma" : "leo", name: "Alex" };
        break;
      case "walk":
        state = command(state, {
          op: "interact",
          targetId: task.zone === "office" ? "altagracia" : "wilfredo",
        });
        break;
      case "hazards":
        if (skill)
          for (const targetId of [
            "puddle",
            "guard",
            "exit",
            "gloves",
            "cable",
          ].sort(() => (seed % 2 ? 1 : -1)))
            state = command(state, { op: "interact", targetId });
        c.choices = skill
          ? ["helmet", "glasses", "gloves"]
          : ["helmet", "earplugs", "coat"];
        break;
      case "explore":
        if (skill)
          for (const targetId of seed % 2
            ? ["spare", "kevin", "yuleisy", "wilfredo", "canteen"]
            : ["canteen", "wilfredo", "yuleisy", "kevin", "spare"])
            state = command(state, { op: "interact", targetId });
        c.choices = [skill ? "respect" : "accuse"];
        break;
      case "measure":
        for (const s of STATIONS)
          state = command(state, { op: "interact", targetId: s.id });
        c.measurements = Object.fromEntries(
          STATIONS.map((s) => [
            s.id,
            [
              s.cycle + (skill ? 0 : 4),
              s.cycle + (skill ? 0.3 : 4),
              s.cycle + (skill ? -0.2 : 4),
            ],
          ]),
        );
        break;
      case "dialogue":
        c.choices = [
          (
            {
              "1.2": skill ? "people" : "rush",
              "2.1": skill ? "private" : "blame",
              "2.6": skill ? "respect" : "impose",
              "3.2": skill ? "stop" : "watch",
              "3.5": skill ? "security" : "ignore",
              "3.7": "team",
            } as Record<string, string>
          )[scene.id]!,
        ];
        break;
      case "spreadsheet":
        if (scene.id === "1.6")
          c.assignments = Object.fromEntries(STATIONS.map((s) => [s.id, s.id]));
        c.choices =
          scene.id === "1.6"
            ? [skill ? "seal" : "people"]
            : skill
              ? ["seal", "label", "fill", "box", "other"]
              : ["other", "box", "fill", "label", "seal"];
        c.value = skill ? 68 : 5;
        break;
      case "message":
        c.choices = skill
          ? scene.id === "1.7"
            ? ["data", "plan", "update"]
            : ["figure", "risk", "plan", "update"]
          : scene.id === "1.7"
            ? ["promise", "blame"]
            : ["promise", "risk"];
        break;
      case "causes":
        c.assignments = Object.fromEntries(
          Object.entries(task.answers ?? {}).map(([id, answer]) => [
            id,
            skill ? answer : "discard",
          ]),
        );
        break;
      case "layout":
        c.choices = [skill && state.flags.bodega_vista ? "parallel" : "method"];
        c.layout = DEFAULT_LAYOUT.map((p) => ({ ...p }));
        break;
      case "budget":
        c.choices =
          state.flags.solucion_elegida === "parallel"
            ? ["training", "install"]
            : skill
              ? ["training", "maintenance"]
              : ["overtime"];
        break;
      case "inspection":
        c.choices = skill ? ["sample-2", "sample-5", "sample-8"] : ["sample-1"];
        break;
      case "staff":
        c.assignments = skill
          ? {
              feed: "jose",
              fill: "luis",
              seal: "rosa",
              label: "ana",
              pack: "pedro",
            }
          : {};
        break;
    }
    if (scene.id === "3.2" && state.factory!.budget.includes("maintenance"))
      c.choices = ["stop"];
    const serialized = JSON.stringify(getPublicScene(module, state));
    for (const secret of [
      '"answers"',
      '"outcome"',
      '"correctCategoryId"',
      '"rules"',
    ])
      assert.ok(!serialized.includes(secret), `public scene leaks ${secret}`);
    state = command(state, c);
  }
  return state;
}
describe("EnvaPlast 3D · authoritative engine", () => {
  it("declares three complete valid sessions", () =>
    assert.deepEqual(validateModule(module), []));
  it("a careful path delivers the order and keeps all six affinity axes", () => {
    const state = playFactory(true);
    assert.equal(state.factory!.production.dispatched, 9000);
    assert.equal(state.performance, 98);
    assert.equal(state.affinity.structure, 11);
    assert.ok(state.affinity.numeric! > 0);
    assert.ok(state.flags.aliado_wilfredo);
    assert.equal(
      state.factory!.skills.technical.earned,
      state.factory!.skills.technical.possible,
    );
    assert.ok(!state.factory!.objectives.includes("3.5"));
  });
  it("the worst path also completes with a late shipment and visible consequences", () => {
    const state = playFactory(false);
    assert.equal(state.status, "completed");
    assert.ok(state.performance < 45);
    assert.ok(state.factory!.production.dispatched! < 9000);
    assert.ok(state.factory!.objectives.includes("3.5"));
    assert.ok(state.factory!.lastReaction);
  });
  it("supports both EST poles without changing performance", () => {
    const a = playFactory(true, 1),
      b = playFactory(true, 2);
    assert.equal(a.affinity.structure, 11);
    assert.equal(b.affinity.structure, -11);
    assert.equal(a.performance, b.performance);
  });
  it("does not reward hazards or discoveries twice", () => {
    let s = playFactory(true, 1, "1.3");
    s = command(s, { op: "interact", targetId: "puddle" });
    const next = command(s, { op: "interact", targetId: "puddle" });
    assert.equal(next.affinity.detail, s.affinity.detail);
    assert.equal(next.factory!.hazards.length, 1);
  });
  it("rejects unknown or unavailable targets", () => {
    const s = playFactory(true, 1, "1.3");
    assert.throws(
      () => command(s, { op: "interact", targetId: "unknown" }),
      SimulationError,
    );
    assert.throws(
      () => command(s, { op: "interact", targetId: "kevin" }),
      SimulationError,
    );
  });
  it("penalizes an invalid layout once and allows a guided recovery without farming EST", () => {
    let s = playFactory(true, 1, "2.4");
    const bad = {
      op: "submit",
      method: "structured",
      choices: ["parallel"],
      layout: [],
    } as const;
    s = command(s, { ...bad, choices: [...bad.choices], layout: [] });
    const points = s.performance,
      structure = s.affinity.structure;
    s = command(s, { ...bad, choices: [...bad.choices], layout: [] });
    assert.equal(s.performance, points);
    assert.equal(s.affinity.structure, structure);
    s = command(s, {
      op: "submit",
      choices: ["parallel"],
      method: "creative",
      guided: true,
    });
    assert.equal(s.performance, points);
    assert.equal(s.affinity.structure, structure - 3);
    assert.equal(
      s.log.reduce((sum, entry) => sum + entry.performanceDelta, 50),
      s.performance,
    );
    assert.equal(
      module.sessions[s.sessionIndex]!.scenes[s.sceneIndex]!.id,
      "2.5",
    );
  });
  it("rejects overspending including mandatory installation", () => {
    const s = playFactory(true, 1, "2.5");
    assert.throws(
      () =>
        command(s, {
          op: "submit",
          choices: ["training", "maintenance", "install"],
          method: "structured",
        }),
      /5.000/,
    );
    assert.throws(
      () =>
        command(s, {
          op: "submit",
          choices: ["training"],
          method: "structured",
        }),
      /instalación/,
    );
  });
  it("saves drafts, pauses clocks and caps elapsed time with server time", () => {
    let s = playFactory(true, 1, "1.5");
    s = command(s, { op: "draft", measurements: { feed: [8, 8.1] } });
    assert.deepEqual(s.factory!.draft?.measurements?.feed, [8, 8.1]);
    s = command(s, { op: "pause" });
    const scene = module.sessions[s.sessionIndex]!.scenes[s.sceneIndex]!;
    const after = applySceneResponse(module, s, {
      sceneId: scene.id,
      response: {
        kind: "factory",
        command: { op: "checkpoint", elapsedMs: 20000 },
      },
      elapsedMs: 0,
      now: "2026-11-11T13:00:00Z",
    }).state;
    assert.equal(after.factory!.taskElapsedMs, s.factory!.taskElapsedMs);
  });
  it("expanded time is persisted and projected", () => {
    let s = playFactory(true, 1, "1.3");
    s = command(s, { op: "settings", extendedTime: true });
    assert.equal(getPublicScene(module, s)!.factory!.task.timeLimit, 120);
  });
  it("all walking destinations have a traversable route", () => {
    for (const target of FACTORY_TARGETS) {
      const path = factoryPath(
        { x: -13, z: 12 },
        { x: target.x + 1.8, z: target.z + 1 },
      );
      assert.ok(path.length > 0, target.id);
      assert.ok(
        path.every((p) => factoryWalkable(p.x, p.z)),
        target.id,
      );
    }
  });
  it("validates machine order and clearances", () => {
    assert.deepEqual(validateFactoryLayout(DEFAULT_LAYOUT), []);
    assert.ok(
      validateFactoryLayout(DEFAULT_LAYOUT.map((p) => ({ ...p, z: 0 }))).length,
    );
  });
  it("every declared clock has a narrative timeout that advances", () => {
    for (const scene of module.sessions
      .flatMap((s) => s.scenes)
      .filter((s) => s.factory?.timeLimit)) {
      const before = playFactory(scene.id !== "3.5", 1, scene.id);
      const after = command(before, {
        op: "submit",
        timedOut: true,
        method: "structured",
      });
      assert.notEqual(after.sceneIndex, before.sceneIndex, scene.id);
      assert.ok(after.factory!.lastReaction, scene.id);
      assert.ok(after.log.at(-1)?.timedOut, scene.id);
    }
  });
  it("a partial dispatch and a complete dispatch without an ally have defined endings", () => {
    const partial = playFactory(true, 1, "3.6");
    partial.factory!.budget = ["maintenance"];
    partial.flags.solucion_elegida = "method";
    const after = command(partial, { op: "submit" });
    assert.ok(
      after.factory!.production.dispatched! > 0 &&
        after.factory!.production.dispatched! < 9000,
    );
    assert.match(after.factory!.lastReaction!, /parcial/);
    const alone = playFactory(true, 1, "3.6");
    alone.flags.aliado_wilfredo = false;
    const completed = command(alone, { op: "submit" });
    assert.equal(completed.factory!.production.dispatched, 9000);
    assert.match(completed.factory!.lastReaction!, /colaboración/);
  });
  it("backed and unbacked messages keep the explicit pressure and communication deltas", () => {
    const before = playFactory(true, 1, "3.4");
    const after = command(before, {
      op: "submit",
      choices: ["promise", "risk"],
    });
    assert.equal(
      after.affinity.communication,
      before.affinity.communication - 3,
    );
    assert.equal(after.affinity.pressure, before.affinity.pressure + 1);
  });
  it("timeout without a method does not invent a preference", () => {
    const s = playFactory(true, 1, "1.3");
    const after = command(s, { op: "submit", timedOut: true });
    assert.equal(after.affinity.structure, s.affinity.structure);
  });
  it("the restricted maintenance choice is enforced on the server", () => {
    const s = playFactory(true, 1, "3.2");
    s.factory!.budget = ["maintenance"];
    assert.throws(
      () => command(s, { op: "submit", choices: ["watch"] }),
      /mantenimiento preventivo/,
    );
  });
  it("the diagnosis clock begins after the sheet has been assembled", () => {
    let s = playFactory(true, 1, "1.6");
    assert.equal(getPublicScene(module, s)!.factory!.task.timeLimit, undefined);
    s = command(s, {
      op: "draft",
      assignments: Object.fromEntries(
        STATIONS.map((station) => [station.id, station.id]),
      ),
    });
    assert.equal(getPublicScene(module, s)!.factory!.task.timeLimit, 20);
    assert.equal(s.factory!.taskElapsedMs, 0);
  });
  it("every authored dialogue option advances with its own narrative consequence", () => {
    for (const scene of module.sessions
      .flatMap((s) => s.scenes)
      .filter((s) => s.factory?.kind === "dialogue"))
      for (const option of scene.factory!.choices ?? []) {
        const before = playFactory(scene.id !== "3.5", 1, scene.id),
          after = command(before, { op: "submit", choices: [option.id] });
        assert.ok(after.factory!.lastReaction, `${scene.id}/${option.id}`);
        assert.notEqual(
          after.sceneIndex,
          before.sceneIndex,
          `${scene.id}/${option.id}`,
        );
        assert.ok(Math.abs(Number(after.flags.confianza_wilfredo)) <= 3);
        assert.ok(Math.abs(Number(after.flags.confianza_yuleisy)) <= 3);
      }
  });
  it("all valid combinations of message blocks have a consequence", () => {
    for (const id of ["1.7", "3.4"]) {
      const before = playFactory(true, 1, id);
      const task =
        module.sessions[before.sessionIndex]!.scenes[before.sceneIndex]!
          .factory!;
      const cards = task.cards!;
      for (let mask = 0; mask < 1 << cards.length; mask++) {
        const chosen = cards.filter((_, i) => mask & (1 << i)).map((c) => c.id);
        if (chosen.length < 2 || chosen.length > (id === "1.7" ? 3 : 4))
          continue;
        const after = command(before, { op: "submit", choices: chosen });
        assert.ok(after.factory!.lastReaction);
        assert.notEqual(after.sceneIndex, before.sceneIndex);
      }
    }
  });
  it("600 reproducible combinations complete without leaking keys or crossing bounds", () => {
    for (let n = 0; n < 600; n++) {
      const s = playFactory(n % 3 !== 0, n + 1);
      assert.ok(s.performance >= 0 && s.performance <= 100);
      assert.ok(Math.abs(s.affinity.structure) <= 11);
      assert.equal(
        s.sessions.filter((x) => x.status === "completed").length,
        3,
      );
    }
  });
});
