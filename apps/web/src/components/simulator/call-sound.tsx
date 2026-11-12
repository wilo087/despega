'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/** Tono propio, sin descargas ni permisos de micrófono. Se activa con un gesto. */
export function CallSound({ ringing }: { ringing: boolean }) {
  const context = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => () => { void context.current?.close().catch(() => undefined); }, []);

  useEffect(() => {
    const audio = context.current;
    if (!audio) return;
    let interval: number | undefined;
    let revision = 0;
    const stop = () => {
      revision += 1;
      window.clearInterval(interval);
      void audio.suspend().catch(() => undefined);
    };
    const ring = () => {
      if (audio.state !== 'running') return;
      for (const delay of [0, 0.3]) {
        for (const frequency of [520, 660]) {
          const oscillator = audio.createOscillator();
          const gain = audio.createGain();
          const at = audio.currentTime + delay;
          oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0, at);
          gain.gain.linearRampToValueAtTime(0.025, at + 0.02);
          gain.gain.linearRampToValueAtTime(0, at + 0.2);
          oscillator.connect(gain).connect(audio.destination);
          oscillator.start(at);
          oscillator.stop(at + 0.21);
          oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        }
      }
    };
    const sync = () => {
      stop();
      if (!enabled || !ringing || document.hidden) return;
      const current = revision;
      void audio.resume().then(() => {
        if (revision !== current || document.hidden) return;
        ring();
        interval = window.setInterval(ring, 2_400);
      }).catch(() => setUnavailable(true));
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => { stop(); document.removeEventListener('visibilitychange', sync); };
  }, [enabled, ringing]);

  async function toggle() {
    if (enabled) { setEnabled(false); return; }
    try {
      context.current ??= new AudioContext();
      await context.current.resume();
      setEnabled(true);
      setUnavailable(false);
    } catch { setUnavailable(true); }
  }

  return (
    <div>
      <button type="button" className="btn btn-ghost btn-sm" aria-pressed={enabled} onClick={() => void toggle()}>
        {enabled ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
        {enabled ? 'Silenciar sonido' : 'Activar sonido'}
      </button>
      {unavailable && <p role="status" className="mt-1 text-xs text-muted">El sonido no está disponible en este navegador. Puedes continuar.</p>}
    </div>
  );
}
