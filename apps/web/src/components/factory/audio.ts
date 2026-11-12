/** Original synthesized ambience and short effects; no recordings or external services. */
export class FactoryAudio {
  private context: AudioContext | null = null;
  private volume: GainNode | null = null;
  private hum: OscillatorNode | null = null;
  async enable() {
    this.context ??= new AudioContext();
    await this.context.resume();
    if (!this.hum) {
      this.volume = this.context.createGain();
      this.volume.gain.value = 0.018;
      this.volume.connect(this.context.destination);
      this.hum = this.context.createOscillator();
      this.hum.type = "triangle";
      this.hum.frequency.value = 58;
      this.hum.connect(this.volume);
      this.hum.start();
    }
  }
  async pause() {
    await this.context?.suspend();
  }
  tone(kind: "step" | "alarm" | "notification") {
    const c = this.context;
    if (!c || c.state !== "running") return;
    const osc = c.createOscillator(),
      gain = c.createGain();
    const t = c.currentTime;
    osc.type = kind === "step" ? "triangle" : "sine";
    osc.frequency.setValueAtTime(
      kind === "step" ? 90 : kind === "alarm" ? 630 : 880,
      t,
    );
    gain.gain.setValueAtTime(kind === "step" ? 0.012 : 0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.18);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }
  async dispose() {
    await this.context?.close();
    this.context = null;
    this.hum = null;
  }
}
