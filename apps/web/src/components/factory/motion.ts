import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";

export function smoothFacing(
  current: number,
  target: number,
  seconds: number,
): number {
  const delta = Math.atan2(
    Math.sin(target - current),
    Math.cos(target - current),
  );
  return current + delta * (1 - Math.exp(-Math.max(0, seconds) * 16));
}
/** Blend full poses. All authored clips share their animated transform channels. */
export class FactoryAnimator {
  private readonly clips: AnimationGroup[];
  private readonly phase: number;
  private weights = new Map<AnimationGroup, number>();
  private current: AnimationGroup | undefined;
  private reduced = false;
  private visible = true;
  setVisible(visible: boolean) {
    if (visible === this.visible) return;
    this.visible = visible;
    for (const group of this.weights.keys())
      if (visible) group.play(group.loopAnimation);
      else group.pause();
  }
  constructor(clips: AnimationGroup[], identity = "player") {
    this.clips = clips;
    this.phase =
      (Array.from(identity).reduce(
        (n, c) => (n * 31 + c.charCodeAt(0)) >>> 0,
        7,
      ) %
        997) /
      997;
  }
  update(
    requested: string,
    seconds: number,
    velocity = 0,
    reducedMotion = false,
  ) {
    if (!this.visible) return;
    const name = reducedMotion && requested !== "Walk" ? "Idle" : requested;
    const wanted =
      this.clips.find((g) => g.name.includes(name)) ??
      this.clips.find((g) => g.name.includes("Idle"));
    if (!wanted) return;
    if (this.current !== wanted || this.reduced !== reducedMotion) {
      if (reducedMotion) {
        for (const g of this.weights.keys()) if (g !== wanted) g.stop();
        this.weights.clear();
      }
      this.reduced = reducedMotion;
      const initial = this.weights.size === 0 ? 1 : 0;
      if (!this.weights.has(wanted)) {
        wanted.start(!["Greet", "React", "Point"].includes(name));
        wanted.setWeightForAllAnimatables(initial);
        if (["Idle", "Work", "Listen"].includes(name))
          wanted.goToFrame(
            wanted.from + (wanted.to - wanted.from) * this.phase,
          );
        this.weights.set(wanted, initial);
      }
      this.current = wanted;
    }
    const blend = 1 - Math.exp(-Math.max(0, seconds) * 18);
    let total = 0;
    for (const [g, weight] of this.weights) {
      const next = reducedMotion
        ? Number(g === wanted)
        : weight + (Number(g === wanted) - weight) * blend;
      this.weights.set(g, next);
      total += next;
    }
    for (const [g, weight] of this.weights) {
      if (g !== wanted && weight < 0.001) {
        g.stop();
        this.weights.delete(g);
        continue;
      }
      g.setWeightForAllAnimatables(total > 0 ? weight / total : 0);
      if (g === wanted)
        g.speedRatio =
          reducedMotion && name === "Idle"
            ? 0
            : name === "Walk"
              ? Math.max(
                  0.5,
                  Math.min(2.5, (velocity / 1.6) * wanted.getLength()),
                )
              : 1;
    }
  }
  dispose() {
    for (const g of this.clips) g.dispose();
    this.weights.clear();
  }
}
