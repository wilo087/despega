import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createInitialState,
  startSession,
  applySceneResponse,
  getPublicScene,
} from "../engine.ts";
import { ingenieriaIndustrial as module } from "../modules/ingenieria-industrial.ts";
import type { FactoryCommand } from "./types.ts";
import type { SimulationState } from "../types.ts";
const now = "2026-11-12T16:00:00Z";
function initial() {
  return startSession(
    module,
    createInitialState(module, { playerName: "Alex", now }),
    { sessionIndex: 0, now },
  );
}
function command(state: SimulationState, c: FactoryCommand, elapsed = 0) {
  return applySceneResponse(module, state, {
    sceneId: module.sessions[state.sessionIndex]!.scenes[state.sceneIndex]!.id,
    response: { kind: "factory", command: c },
    elapsedMs: elapsed,
    now: "2026-11-12T16:05:00Z",
  });
}
describe("non-scored controls tutorial", () => {
  it("persists every step, can be replayed and never changes scores, objectives or scene", () => {
    const before = initial();
    let s = command(before, {
      op: "tutorial",
      action: "start",
      position: { x: -13, z: 12 },
    }).state;
    for (const step of ["welcome", "move", "interact", "tablet"] as const) {
      assert.equal(s.factory!.tutorial!.step, step);
      const result = command(s, {
        op: "tutorial",
        action: "advance",
        expectedStep: step,
      });
      s = JSON.parse(JSON.stringify(result.state));
      assert.equal(result.outcome.detail.kind, "continue");
      assert.equal(result.outcome.performanceDelta, 0);
      assert.deepEqual(result.outcome.affinityDelta, {});
    }
    s = command(s, { op: "tutorial", action: "finish" }).state;
    assert.equal(s.factory!.tutorial!.completed, true);
    assert.equal(s.factory!.paused, false);
    assert.equal(s.sceneIndex, before.sceneIndex);
    assert.deepEqual(s.factory!.objectives, before.factory!.objectives);
    assert.deepEqual(s.affinity, before.affinity);
    assert.deepEqual(s.factory!.skills, before.factory!.skills);
    s = command(s, { op: "tutorial", action: "start" }).state;
    assert.equal(s.factory!.tutorial!.active, true);
    assert.equal(s.factory!.tutorial!.completed, true);
  });
  it("freezes task clocks and third-day production even when resume is used during practice", () => {
    let s = initial();
    s.sessionIndex = 2;
    s.sceneIndex = 1;
    s.sessions[2]!.status = "in_progress";
    s = command(s, { op: "tutorial", action: "start" }).state;
    const production = structuredClone(s.factory!.production),
      elapsed = s.factory!.taskElapsedMs;
    s = command(s, { op: "resume" }, 20000).state;
    assert.equal(s.factory!.paused, true);
    s = command(
      s,
      { op: "checkpoint", position: { x: 0, z: 4 }, elapsedMs: 20000 },
      20000,
    ).state;
    assert.equal(s.factory!.taskElapsedMs, elapsed);
    assert.deepEqual(s.factory!.production, production);
  });
  it("can always be skipped and restores the previous pause state", () => {
    for (const paused of [false, true]) {
      let s = initial();
      s.factory!.paused = paused;
      s = command(s, { op: "tutorial", action: "start" }).state;
      s = command(s, { op: "tutorial", action: "skip" }).state;
      assert.equal(s.factory!.paused, paused);
      assert.equal(s.factory!.tutorial!.active, false);
      assert.equal(s.factory!.tutorial!.completed, true);
    }
  });
  it("suspends on pause, rejects stale steps and prevents story responses during practice", () => {
    let s = command(initial(), { op: "tutorial", action: "start" }).state;
    assert.throws(() =>
      command(s, { op: "tutorial", action: "advance", expectedStep: "move" }),
    );
    assert.throws(() => command(s, { op: "tutorial", action: "finish" }));
    assert.throws(() =>
      command(s, { op: "submit", avatar: "alma", name: "Alex" }),
    );
    s = command(s, { op: "pause" }).state;
    assert.equal(s.factory!.tutorial!.suspended, true);
    assert.throws(() =>
      command(s, {
        op: "tutorial",
        action: "advance",
        expectedStep: "welcome",
      }),
    );
    s = command(s, { op: "resume" }).state;
    assert.equal(s.factory!.tutorial!.suspended, false);
    s = command(s, {
      op: "tutorial",
      action: "advance",
      expectedStep: "welcome",
    }).state;
    assert.equal(s.factory!.tutorial!.step, "move");
  });
  it("reads legacy attempts and exposes only presentation fields for the tutorial", () => {
    let s = initial();
    assert.equal(getPublicScene(module, s)!.factory!.tutorial, undefined);
    s = command(s, { op: "tutorial", action: "start" }).state;
    const t = getPublicScene(module, s)!.factory!.tutorial!;
    assert.equal(t.step, "welcome");
    assert.equal("returnPaused" in t, false);
    assert.throws(() =>
      command(s, {
        op: "tutorial",
        action: "start",
        position: { x: NaN, z: 0 },
      }),
    );
  });
});
