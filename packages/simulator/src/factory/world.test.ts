import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_LAYOUT,
  FACTORY_TARGETS,
  factoryNavigation,
  factoryNearestPosition,
  factoryMovement,
  factoryPath,
  factoryLayoutConflicts,
  factoryPracticePoint,
  type FactorySolid,
} from "./world.ts";

function overlaps(a: FactorySolid, b: FactorySolid) {
  return (
    Math.abs(a.x - b.x) < (a.w + b.w) / 2 - 0.001 &&
    Math.abs(a.z - b.z) < (a.d + b.d) / 2 - 0.001
  );
}
function assertClear(solids: FactorySolid[]) {
  for (let i = 0; i < solids.length; i++)
    for (const b of solids.slice(i + 1))
      assert.equal(
        overlaps(solids[i]!, b),
        false,
        `${solids[i]!.id} intersects ${b.id}`,
      );
}
describe("factory spatial navigation", () => {
  it("places a reachable practice beacon near each sector without using a story target", () => {
    const n = factoryNavigation();
    for (const origin of [
      { x: -13, z: 12 },
      { x: -13, z: -4 },
      { x: 0, z: 4 },
      { x: 13, z: -5 },
      { x: 11, z: 3 },
      { x: 14, z: 10 },
    ]) {
      const safe = factoryNearestPosition(origin, n.walkable),
        point = factoryPracticePoint(safe, n.walkable);
      assert.ok(n.walkable(point.x, point.z));
      assert.ok(Math.hypot(point.x - safe.x, point.z - safe.z) >= 1.5);
      assert.ok(factoryPath(safe, point, n.walkable).length);
    }
  });
  it("keeps furniture, machines, hazards and people in distinct spaces", () => {
    for (const installed of [false, true])
      for (const yuleisyAbsent of [false, true]) {
        const navigation = factoryNavigation(DEFAULT_LAYOUT, {
          installed,
          yuleisyAbsent,
        });
        assertClear(navigation.solids);
      }
  });
  it("uses moved machines and moves their operators without intersecting coworkers", () => {
    for (const x of [-5, 0, 5]) {
      const layout = DEFAULT_LAYOUT.map((p) => ({ ...p, x }));
      const n = factoryNavigation(layout);
      assertClear(n.solids);
      assert.equal(n.walkable(x, -7), false);
      if (x === 5)
        assert.equal(n.walkable(-3, -7), true, "old machine position is free");
      for (const p of layout) {
        const op = n.actors.find((a) => a.id === "operator-" + p.id)!;
        assert.ok(Math.hypot(op.x - p.x, op.z - p.z) < 3, p.id);
      }
    }
  });
  it("reserves the installed sealer and displays an assigned supervisor once", () => {
    const n = factoryNavigation(DEFAULT_LAYOUT, {
      installed: true,
      staff: { seal: "wilfredo" },
      yuleisyAbsent: true,
    });
    assert.equal(n.walkable(3, 1), false);
    assert.equal(n.actors.filter((a) => a.model === "wilfredo").length, 1);
    assert.equal(
      n.actors.some((a) => a.id === "yuleisy"),
      false,
    );
    assertClear(n.solids);
  });
  it("reaches every interaction without routing through any solid", () => {
    for (const x of [-3, 4]) {
      const layout = DEFAULT_LAYOUT.map((p) => ({ ...p, x }));
      const n = factoryNavigation(layout, { installed: x === -3 });
      for (const target of FACTORY_TARGETS) {
        const actor = n.actors.find((a) => a.id === target.id);
        const placement = layout.find((p) => p.id === target.id);
        const destination = actor ?? placement ?? target;
        const path = factoryPath(
          { x: -13, z: 12 },
          destination,
          n.walkable,
          2.2,
        );
        assert.ok(path.length, target.id);
        let previous = { x: -13, z: 12 };
        for (const p of path) {
          for (let i = 1; i <= 5; i++)
            assert.ok(
              n.walkable(
                previous.x + ((p.x - previous.x) * i) / 5,
                previous.z + ((p.z - previous.z) * i) / 5,
              ),
              `${target.id}: blocked segment`,
            );
          previous = p;
        }
        assert.ok(
          Math.hypot(previous.x - destination.x, previous.z - destination.z) <
            2.6,
          target.id,
        );
      }
    }
  });
  it("keeps locked rooms inaccessible and recovers a saved position occupied by furniture", () => {
    const n = factoryNavigation(DEFAULT_LAYOUT, {
      openZones: ["entrance", "office"],
    });
    assert.equal(n.walkable(2, 5), false);
    assert.ok(
      factoryPath({ x: -13, z: 12 }, FACTORY_TARGETS[0]!, n.walkable, 2.2)
        .length,
    );
    const safe = factoryNearestPosition({ x: -13, z: -7 }, n.walkable);
    assert.ok(n.walkable(safe.x, safe.z));
    assert.ok(Math.hypot(safe.x + 13, safe.z + 7) < 3);
  });
  it("maps screen directions to an orthogonal isometric ground plane", () => {
    const up = factoryMovement(0, -1),
      right = factoryMovement(1, 0);
    assert.ok(Math.abs(up.x * right.x + up.z * right.z) < 1e-10);
    assert.ok(Math.abs(Math.hypot(up.x, up.z) - 1) < 1e-10);
    const down = factoryMovement(0, 1);
    assert.deepEqual(down, { x: -up.x, z: -up.z });
  });
  it("accepts engine vectors whose coordinates are inherited getters", () => {
    const vector = Object.create({
      get x() {
        return -13;
      },
      get z() {
        return 12;
      },
    }) as { x: number; z: number };
    assert.deepEqual(
      factoryNearestPosition(vector, () => true),
      { x: -13, z: 12 },
    );
  });
  it("does not accept a nonfinite position or duplicate machine footprints", () => {
    const n = factoryNavigation();
    assert.equal(n.walkable(NaN, 0), false);
    const safe = factoryNearestPosition({ x: NaN, z: Infinity }, n.walkable);
    assert.ok(n.walkable(safe.x, safe.z));
    const bad = DEFAULT_LAYOUT.map((p) => ({ ...p, x: 0, z: 0 }));
    assert.equal(factoryLayoutConflicts(bad).length, 5);
    assert.deepEqual(factoryLayoutConflicts(DEFAULT_LAYOUT), []);
  });
  it("keeps people clear across 100 alternative machine arrangements", () => {
    for (let i = 0; i < 100; i++) {
      const layout = DEFAULT_LAYOUT.map((p, j) => ({
        ...p,
        x: ((i * 7 + j * 3) % 11) - 5,
        z: p.z + (i % 3) * 0.5,
      }));
      assertClear(factoryNavigation(layout).solids);
    }
  });
});
