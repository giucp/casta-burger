"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Qué salió mal al volver del correo, en cristiano. */
const MOTIVOS: Record<string, string> = {
  "sin-codigo":
    "El enlace llegó sin datos de acceso, o ya se había usado. Pedí UNO solo, abrí el correo más reciente y tocá el enlace desde este mismo navegador.",
  "enlace-invalido":
    "El enlace ya se usó o venció. Ojo: pedir uno nuevo invalida el anterior, así que sirve el del último correo.",
  "sin-permiso":
    "Esa cuenta no tiene acceso al panel. Pedile a alguien del equipo que te sume desde Equipo.",
};

export function LoginForm() {
  const params = useSearchParams();
  const volver = params.get("volver") ?? "/admin/cocina";
  const motivo = params.get("error");

  const [correo, setCorreo] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado">("idle");
  const [error, setError] = useState<string | null>(
    motivo ? (MOTIVOS[motivo] ?? "No se pudo entrar con ese enlace.") : null,
  );

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEstado("enviando");

    // A dónde volver va en una cookie corta, no en la URL de retorno.
    // Supabase compara la URL de retorno contra su lista de permitidas, y un
    // query string variable hace ese emparejamiento frágil: si no coincide,
    // manda al visitante a la Site URL sin avisar de nada.
    document.cookie = `casta_volver=${encodeURIComponent(volver)}; Path=/; Max-Age=900; SameSite=Lax`;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: correo.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/admin/auth/callback`,
        /**
         * Sin esto, Supabase le CREA la cuenta a cualquier correo que se
         * escriba acá y le manda un enlace que funciona. Es el valor por
         * defecto, y era la mitad del agujero: la otra mitad eran las
         * políticas de la base, que solo pedían tener sesión.
         *
         * Las cuentas ahora se crean al sumar a alguien desde /admin/equipo,
         * no acá.
         */
        shouldCreateUser: false,
      },
    });

    /**
     * Con `shouldCreateUser: false`, Supabase devuelve error cuando el correo
     * no tiene cuenta. No se muestra tal cual a propósito: sería un detector
     * de correos válidos para cualquiera que pruebe uno por uno. Se responde
     * lo mismo que si hubiera salido bien, y el que tiene acceso recibe su
     * enlace igual.
     */
    if (error && !/not.*(found|allowed)|signups/i.test(error.message)) {
      setError(error.message);
      setEstado("idle");
      return;
    }

    setEstado("enviado");
  };

  if (estado === "enviado") {
    return (
      <div className="rounded-card border border-emerald-500/30 bg-emerald-500/10 px-5 py-6">
        <p className="mb-2 font-display text-2xl uppercase leading-tight text-emerald-400">
          Revisá tu correo
        </p>
        <p className="text-sm text-ash">
          Si <b>{correo}</b> tiene acceso, le acaba de llegar un enlace. Tocalo
          desde este mismo dispositivo y entrás directo.
        </p>
        <p className="mt-2 font-mono text-[11px] text-smoke">
          No pidas otro enlace sin usar este: cada pedido nuevo invalida el
          anterior.
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-smoke">
          Si no llega, mirá en spam
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar}>
      {/* Quien llegó acá rebotado por falta de permiso sigue con la sesión
          puesta. Sin esta salida quedaría intentando con la misma cuenta que
          acaba de ser rechazada, sin entender por qué. */}
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
        Correo del dueño
      </label>
      <input
        id="correo"
        type="email"
        required
        autoComplete="email"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        placeholder="tucorreo@ejemplo.com"
        className="mb-3 w-full rounded-xl border border-white/15 bg-card px-3.5 py-3 text-sm placeholder:text-smoke/60"
      />

      {error && (
        <p className="mb-3 font-mono text-[11px] text-casta">{error}</p>
      )}

      <button
        type="submit"
        disabled={estado === "enviando" || !correo.trim()}
        className="w-full rounded-full bg-casta py-3.5 font-display text-lg uppercase tracking-[0.03em] text-white transition-colors hover:bg-casta-deep disabled:opacity-45"
      >
        {estado === "enviando" ? "Enviando…" : "Mandarme el enlace"}
      </button>
    </form>
  );
}
