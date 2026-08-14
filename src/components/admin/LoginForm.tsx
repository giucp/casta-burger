"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Qué pasó, en cristiano. */
const MOTIVOS: Record<string, string> = {
  "sin-permiso":
    "Esa cuenta no tiene acceso al panel. Pedile a alguien del equipo que te sume desde Equipo.",
};

/**
 * Entrar al back-office con correo y contraseña.
 *
 * Antes esto era un magic link, y era la decisión equivocada para una cocina.
 * El enlace mete al servicio de correo en el camino crítico: el plan gratis de
 * Supabase manda 2 correos por hora, así que un viernes a las 8 PM, con el
 * local lleno, perder la sesión significaba no poder entrar en una hora. La
 * pantalla de cocina es el corazón del sistema; no puede depender de que llegue
 * un mail.
 *
 * Con contraseña no hay nada externo de por medio. Y para el caso de olvidarla,
 * la recuperación tampoco necesita correo: otro admin la cambia desde Equipo.
 * Son dos personas que se ven todos los días.
 */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const volver = params.get("volver") ?? "/admin/cocina";
  const motivo = params.get("error");

  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState<string | null>(
    motivo ? (MOTIVOS[motivo] ?? "No se pudo entrar.") : null,
  );

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEntrando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: correo.trim().toLowerCase(),
      password: clave,
    });

    if (error) {
      /**
       * El mismo mensaje para "no existe" que para "contraseña mala", a
       * propósito: distinguirlos convertiría esta pantalla en un detector de
       * correos con acceso para cualquiera que pruebe uno por uno.
       */
      setError("Correo o contraseña incorrectos.");
      setEntrando(false);
      return;
    }

    // `refresh()` para que el middleware vuelva a evaluar con la sesión nueva
    // en vez de servir una versión cacheada.
    router.replace(volver);
    router.refresh();
  };

  return (
    <form onSubmit={entrar}>
      {/* Quien llegó rebotado por falta de permiso sigue con la sesión puesta.
          Sin esta salida quedaría intentando con la cuenta recién rechazada. */}
      {motivo === "sin-permiso" && (
        <button
          type="button"
          onClick={async () => {
            await createClient().auth.signOut();
            window.location.href = "/admin/login";
          }}
          className="mb-4 w-full rounded-full border border-white/15 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-smoke transition-colors hover:border-white/40 hover:text-white"
        >
          Salir de esa cuenta
        </button>
      )}

      <label
        htmlFor="correo"
        className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.16em] text-smoke"
      >
        Correo
      </label>
      <input
        id="correo"
        type="email"
        required
        autoComplete="username"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        placeholder="tucorreo@ejemplo.com"
        className="mb-3 w-full rounded-xl border border-white/15 bg-card px-3.5 py-3 text-sm placeholder:text-smoke/60"
      />

      <label
        htmlFor="clave"
        className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.16em] text-smoke"
      >
        Contraseña
      </label>
      <input
        id="clave"
        type="password"
        required
        autoComplete="current-password"
        value={clave}
        onChange={(e) => setClave(e.target.value)}
        className="mb-3 w-full rounded-xl border border-white/15 bg-card px-3.5 py-3 text-sm"
      />

      {error && (
        <p className="mb-3 font-mono text-[11px] text-casta">{error}</p>
      )}

      <button
        type="submit"
        disabled={entrando || !correo.trim() || !clave}
        className="w-full rounded-full bg-casta py-3.5 font-display text-lg uppercase tracking-[0.03em] text-white transition-colors hover:bg-casta-deep disabled:opacity-45"
      >
        {entrando ? "Entrando…" : "Entrar"}
      </button>

      <p className="mt-4 font-mono text-[11px] leading-relaxed text-smoke">
        ¿La olvidaste? Pedile a la otra persona del equipo que te la cambie
        desde Equipo. No hace falta ningún correo.
      </p>
    </form>
  );
}
