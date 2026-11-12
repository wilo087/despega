import { it } from "node:test";
import assert from "node:assert/strict";
import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { FactoryAnimator, smoothFacing } from "./motion.ts";
function clip(name: string) {
  return {
    name,
    from: 0,
    to: 60,
    speedRatio: 1,
    weight: 0,
    starts: 0,
    stops: 0,
    start() {
      this.starts++;
      return this;
    },
    stop() {
      this.stops++;
      return this;
    },
    setWeightForAllAnimatables(weight: number) {
      this.weight = weight;
      return this;
    },
    goToFrame() {
      return this;
    },
    getLength() {
      return 1;
    },
    pause() {
      return this;
    },
    play() {
      return this;
    },
    loopAnimation: true,
    dispose() {},
  };
}
it("turns across the angle boundary by the shortest arc", () => {
  const start = Math.PI - 0.02,
    target = -Math.PI + 0.02,
    next = smoothFacing(start, target, 1 / 60);
  assert.ok(next > start);
  assert.ok(next - start < 0.04);
  let angle = 0;
  for (let i = 0; i < 120; i++)
    angle = smoothFacing(angle, Math.PI / 2, 1 / 60);
  assert.ok(Math.abs(angle - Math.PI / 2) < 1e-10);
  assert.equal(smoothFacing(1, 2, 0), 1);
});
it("crossfades without restarting clips every frame and normalizes rapid transitions", () => {
  const idle = clip("Idle"),
    walk = clip("Walk"),
    talk = clip("Talk"),
    anim = new FactoryAnimator([
      idle,
      walk,
      talk,
    ] as unknown as AnimationGroup[]);
  anim.update("Idle", 1 / 60);
  anim.update("Walk", 1 / 60, 3.2);
  assert.ok(idle.weight > 0 && walk.weight > 0);
  assert.ok(Math.abs(idle.weight + walk.weight - 1) < 1e-8);
  anim.update("Talk", 1 / 60);
  assert.ok(Math.abs(idle.weight + walk.weight + talk.weight - 1) < 1e-8);
  for (let i = 0; i < 90; i++) anim.update("Talk", 1 / 60);
  assert.equal(talk.starts, 1);
  assert.ok(walk.stops > 0);
  assert.ok(talk.weight > 0.999);
});
it("keeps essential walking and stops decorative motion when reduced motion is requested", () => {
  const idle = clip("Idle"),
    walk = clip("Walk"),
    greet = clip("Greet"),
    anim = new FactoryAnimator([
      idle,
      walk,
      greet,
    ] as unknown as AnimationGroup[]);
  anim.update("Greet", 1 / 60, 0, true);
  assert.equal(greet.starts, 0);
  assert.equal(idle.speedRatio, 0);
  anim.update("Walk", 1 / 60, 3.2, true);
  assert.equal(walk.weight, 1);
  assert.equal(walk.speedRatio, 2);
});
it("freezes animation changes for distant characters and resumes their current pose", () => {
  const idle = clip("Idle"),
    work = clip("Work"),
    anim = new FactoryAnimator([idle, work] as unknown as AnimationGroup[]);
  anim.update("Idle", 1 / 60);
  anim.setVisible(false);
  anim.update("Work", 1 / 60);
  assert.equal(work.starts, 0);
  anim.setVisible(true);
  anim.update("Work", 1 / 60);
  assert.equal(work.starts, 1);
  assert.ok(idle.weight > 0 && work.weight > 0);
});
