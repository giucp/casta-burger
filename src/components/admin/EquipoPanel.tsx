"use client";

import { useState } from "react";
import { agregarAdmin, quitarAdmin, type Admin } from "@/lib/acciones/equipo";

/**
 * Quién puede entrar al back-office.
 *
 * Esta lista no es solo de esta pantalla: es la misma que consultan las
 * políticas de la base en cada consulta. Sacar a alguien de acá le corta el
 * acceso a los datos, no solo al panel.
 */
export function EquipoPanel({
  inicial,
  yo,
}: {
  inicial: Admin[];
  /** El correo con el que está entrando quien mira la pantalla */
  yo: string;
}) {
  const [admins, setAdmins] = useState(inicial);
  const [correo, setCorreo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAviso(null);

    const email = correo.trim().toLowerCase();
    if (!email) return;

    setGuardando(true);
    const r = await agregarAdmin(email);
    setGuardando(false);

    if (!r.ok) return setError(r.error);

    setAdmins((lista) => [
      ...lista,
      { email, agregadoPor: yo, desde: new Date().toISOString() },
    ]);
    setCorreo("");
    setAviso(
      `${email} ya puede entrar. Que vaya a la pantalla de acceso y pida su enlace.`,
    );
  };

  const quitar = async (email: string) => {
    setError(null);
    setAviso(null);
    const r = await quitarAdmin(email);
    if (!r.ok) return setError(r.error);
    setAdmins((lista) => lista.filter((a) => a.email !== email));
  };

  return (
    <>
      <form onSubmit={agregar} className="mb-6 max-w-lg">
        <label
          htmlFor="nuevo-admin"
          className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.16em] text-smoke"
        >
          Correo de la persona
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="nuevo-admin"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="alguien@ejemplo.com"
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-card px-3.5 py-3 text-sm placeholder:text-smoke/60"
          />
          <button
            type="submit"
            disabled={guardando || !correo.trim()}
            className="shrink-0 rounded-full bg-casta px-6 py-3 font-display text-base uppercase tracking-[0.03em] text-white transition-colors hover:bg-casta-deep disabled:opacity-45"
          >
            {guardando ? "Agregando…" : "Dar acceso"}
          </button>
        </div>

        {error && (
          <p className="mt-2 font-mono text-[11px] text-casta">{error}</p>
        )}
        {aviso && (
          <p className="mt-2 font-mono text-[11px] text-emerald-400">{aviso}</p>
        )}
      </form>

      <ul className="max-w-lg">
        {admins.map((a) => {
          const soyYo = a.email === yo;
          return (
            <li
              key={a.email}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/8 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {a.email}
                  {soyYo && (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.08em] text-smoke">
                      vos
                    </span>
                  )}
                </p>
                {a.agregadoPor && !soyYo && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-smoke/80">
                    lo agregó {a.agregadoPor}
                  </p>
                )}
              </div>

              {/* Sacarse a uno mismo dejaría al panel sin quien lo mire, y es
                  el error más fácil de cometer en una lista así. */}
              {!soyYo && (
                <button
                  type="button"
                  onClick={() => quitar(a.email)}
                  className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-smoke transition-colors hover:text-casta"
                >
                  Quitar acceso
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
