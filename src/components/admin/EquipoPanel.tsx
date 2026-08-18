"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  agregarAdmin,
  cambiarClaveDe,
  quitarAdmin,
  type Admin,
  type Rol,
} from "@/lib/acciones/equipo";

const CLAVE_MINIMA = 8;

const ROLES: { valor: Rol; titulo: string; explica: string }[] = [
  {
    valor: "cocina",
    titulo: "Cocina",
    explica: "Ve los pedidos y les cambia el estado. Nada más.",
  },
  {
    valor: "dueno",
    titulo: "Dueño",
    explica:
      "Todo: las ventas del día, las compras, los precios y quién entra acá.",
  },
];

function Campo({
  id,
  etiqueta,
  tipo = "text",
  valor,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  etiqueta: string;
  tipo?: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <label
        htmlFor={id}
        className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.16em] text-smoke"
      >
        {etiqueta}
      </label>
      <input
        id={id}
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-white/15 bg-card px-3.5 py-3 text-sm placeholder:text-smoke/60"
      />
    </div>
  );
}

/**
 * Quién puede entrar al back-office, y con qué contraseña.
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

  // --- mi propia contraseña ---
  const [miClave, setMiClave] = useState("");
  const [miEstado, setMiEstado] = useState<string | null>(null);
  const [miError, setMiError] = useState<string | null>(null);

  // --- alta ---
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [rolNuevo, setRolNuevo] = useState<Rol>("cocina");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // --- cambiarle la clave a otro ---
  const [editando, setEditando] = useState<string | null>(null);
  const [claveOtro, setClaveOtro] = useState("");

  const cambiarMiClave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMiError(null);
    setMiEstado(null);
    if (miClave.length < CLAVE_MINIMA)
      return setMiError(`Mínimo ${CLAVE_MINIMA} caracteres.`);

    const { error } = await createClient().auth.updateUser({
      password: miClave,
    });
    if (error) return setMiError("No se pudo cambiar.");
    setMiClave("");
    setMiEstado("Lista. Usá la nueva la próxima vez que entres.");
  };

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAviso(null);

    const email = correo.trim().toLowerCase();
    if (!email) return;

    setGuardando(true);
    const r = await agregarAdmin(email, clave, rolNuevo);
    setGuardando(false);

    if (!r.ok) return setError(r.error);

    setAdmins((lista) => [
      ...lista,
      { email, rol: rolNuevo, agregadoPor: yo, desde: new Date().toISOString() },
    ]);
    setCorreo("");
    setClave("");
    setAviso(`${email} ya puede entrar. Decile la contraseña de palabra.`);
  };

  const guardarClaveOtro = async (email: string) => {
    setError(null);
    setAviso(null);
    const r = await cambiarClaveDe(email, claveOtro);
    if (!r.ok) return setError(r.error);
    setEditando(null);
    setClaveOtro("");
    setAviso(`Contraseña de ${email} cambiada.`);
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
      <section className="mb-8 max-w-lg">
        <h2 className="mb-3 font-display text-2xl uppercase tracking-[0.01em]">
          Tu contraseña
        </h2>
        <form onSubmit={cambiarMiClave} className="flex flex-wrap items-end gap-2">
          <Campo
            id="mi-clave"
            etiqueta="Nueva contraseña"
            tipo="password"
            valor={miClave}
            onChange={setMiClave}
            autoComplete="new-password"
          />
          <button
            type="submit"
            disabled={!miClave}
            className="shrink-0 rounded-full border border-white/15 px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.08em] text-smoke transition-colors hover:border-white/40 hover:text-white disabled:opacity-45"
          >
            Cambiar
          </button>
        </form>
        {miError && (
          <p className="mt-2 font-mono text-[11px] text-casta">{miError}</p>
        )}
        {miEstado && (
          <p className="mt-2 font-mono text-[11px] text-emerald-400">
            {miEstado}
          </p>
        )}
      </section>

      <section className="max-w-lg">
        <h2 className="mb-3 font-display text-2xl uppercase tracking-[0.01em]">
          Quién entra
        </h2>

        <form onSubmit={agregar} className="mb-5">
          <div className="mb-2 flex flex-wrap gap-2">
            <Campo
              id="nuevo-admin"
              etiqueta="Correo"
              tipo="email"
              valor={correo}
              onChange={setCorreo}
              placeholder="alguien@ejemplo.com"
              autoComplete="off"
            />
            <Campo
              id="nueva-clave"
              etiqueta="Contraseña"
              tipo="password"
              valor={clave}
              onChange={setClave}
              placeholder={`mínimo ${CLAVE_MINIMA}`}
              autoComplete="new-password"
            />
          </div>
          <fieldset className="mb-3">
            <legend className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-smoke">
              Qué puede hacer
            </legend>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.valor}
                  type="button"
                  onClick={() => setRolNuevo(r.valor)}
                  aria-pressed={rolNuevo === r.valor}
                  className={[
                    "rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                    rolNuevo === r.valor
                      ? "border-casta bg-casta/10"
                      : "border-white/15 hover:border-white/35",
                  ].join(" ")}
                >
                  <span className="block font-mono text-xs font-bold uppercase tracking-[0.08em]">
                    {r.titulo}
                  </span>
                  <span className="block max-w-[26ch] font-mono text-[10px] leading-snug text-smoke">
                    {r.explica}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={guardando || !correo.trim() || !clave}
            className="rounded-full bg-casta px-6 py-3 font-display text-base uppercase tracking-[0.03em] text-white transition-colors hover:bg-casta-deep disabled:opacity-45"
          >
            {guardando ? "Agregando…" : "Dar acceso"}
          </button>

          {error && (
            <p className="mt-2 font-mono text-[11px] text-casta">{error}</p>
          )}
          {aviso && (
            <p className="mt-2 font-mono text-[11px] text-emerald-400">
              {aviso}
            </p>
          )}
        </form>

        <ul>
          {admins.map((a) => {
            const soyYo = a.email === yo;
            return (
              <li key={a.email} className="border-b border-white/8 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {a.email}
                      {soyYo && (
                        <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.08em] text-smoke">
                          vos
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-casta">
                      {a.rol === "dueno" ? "Dueño · todo" : "Cocina · solo pedidos"}
                    </p>
                    {a.agregadoPor && !soyYo && (
                      <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-smoke/80">
                        lo agregó {a.agregadoPor}
                      </p>
                    )}
                  </div>

                  {/* Sacarse o resetearse a uno mismo se hace arriba. Acá van
                      las acciones sobre los demás. */}
                  {!soyYo && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditando(editando === a.email ? null : a.email);
                          setClaveOtro("");
                        }}
                        className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-smoke transition-colors hover:text-white"
                      >
                        Cambiar contraseña
                      </button>
                      <button
                        type="button"
                        onClick={() => quitar(a.email)}
                        className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-smoke transition-colors hover:text-casta"
                      >
                        Quitar acceso
                      </button>
                    </>
                  )}
                </div>

                {editando === a.email && (
                  <div className="mt-2 flex flex-wrap items-end gap-2">
                    <Campo
                      id={`clave-${a.email}`}
                      etiqueta={`Contraseña nueva para ${a.email}`}
                      tipo="password"
                      valor={claveOtro}
                      onChange={setClaveOtro}
                      placeholder={`mínimo ${CLAVE_MINIMA}`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      disabled={!claveOtro}
                      onClick={() => guardarClaveOtro(a.email)}
                      className="shrink-0 rounded-full border border-white/15 px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.08em] text-smoke transition-colors hover:border-white/40 hover:text-white disabled:opacity-45"
                    >
                      Guardar
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
