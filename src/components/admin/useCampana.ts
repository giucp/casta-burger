"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Campana para avisar pedidos nuevos (§6).
 *
 * Se genera con Web Audio en vez de un mp3: no hay que servir ningún archivo y
 * suena igual en cualquier dispositivo. Los navegadores bloquean el audio hasta
 * que el usuario interactúa con la página, así que hay que activarla a mano una
 * vez por sesión — de ahí el botón en la pantalla.
 */
export function useCampana() {
  const ctx = useRef<AudioContext | null>(null);
  const [activa, setActiva] = useState(false);

  const activar = useCallback(() => {
    if (!ctx.current) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctx.current = new AC();
    }
    void ctx.current.resume();
    setActiva(true);
  }, []);

  /** Dos tonos cortos y agudos, que se oyen sobre el ruido de una cocina. */
  const sonar = useCallback(() => {
    const audio = ctx.current;
    if (!audio || audio.state !== "running") return;

    const ahora = audio.currentTime;
    for (const [i, hz] of [880, 1320].entries()) {
      const osc = audio.createOscillator();
      const vol = audio.createGain();

      osc.type = "triangle";
      osc.frequency.value = hz;

      const t = ahora + i * 0.18;
      vol.gain.setValueAtTime(0.0001, t);
      vol.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      vol.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

      osc.connect(vol);
      vol.connect(audio.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    }
  }, []);

  return { activa, activar, sonar };
}
