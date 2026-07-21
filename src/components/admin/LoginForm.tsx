"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const params = useSearchParams();
  const volver = params.get("volver") ?? "/admin/cocina";

  const [correo, setCorreo] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado">("idle");
  const [error, setError] = useState<string | null>(null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEstado("enviando");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: correo.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/admin/auth/callback?volver=${encodeURIComponent(volver)}`,
      },
    });

    if (error) {
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
          Le mandamos un enlace a <b>{correo}</b>. Tocalo desde este mismo
          dispositivo y entrás directo.
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-smoke">
          Si no llega, mirá en spam
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar}>
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
