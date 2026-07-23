"use client";

import { useState } from "react";
import { describirOpciones, subtotalLinea } from "@/lib/cart";
import { usd } from "@/lib/format";
import { linkWhatsApp, mensajePedido, type TipoPedido } from "@/lib/whatsapp";
import { crearPedido } from "@/lib/acciones/crear-pedido";
import { useCart } from "./CartProvider";
import { Sheet } from "./Sheet";

function Campo({
  id,
  etiqueta,
  valor,
  onChange,
  placeholder,
  tipo = "text",
  requerido,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  tipo?: string;
  requerido?: boolean;
}) {
  return (
    <div className="mb-3">
      <label
        htmlFor={id}
        className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.16em] text-bone-mute"
      >
        {etiqueta}
        {requerido && <span className="text-casta"> *</span>}
      </label>
      <input
        id={id}
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-bone-line bg-white/50 px-3 py-2.5 text-sm placeholder:text-bone-mute"
      />
    </div>
  );
}

const CLAVE_CLIENTE = "casta-cliente";

/**
 * Datos del cliente guardados en este teléfono. Recordarlos sin cuenta ni
 * contraseña da lo mismo que un login —pedir de nuevo es un toque— sin la
 * fricción de registrarse, y respeta el "pedir sin crear cuenta" del brief.
 *
 * CartPanel solo se monta al abrir el carrito (nunca en el servidor), así que
 * leer localStorage acá no rompe la hidratación.
 */
function leerClienteGuardado(): {
  nombre: string;
  telefono: string;
  direccion: string;
} {
  const vacio = { nombre: "", telefono: "", direccion: "" };
  if (typeof window === "undefined") return vacio;
  try {
    const guardado = localStorage.getItem(CLAVE_CLIENTE);
    if (!guardado) return vacio;
    const d = JSON.parse(guardado);
    return {
      nombre: d.nombre ?? "",
      telefono: d.telefono ?? "",
      direccion: d.direccion ?? "",
    };
  } catch {
    return vacio;
  }
}

export function CartPanel({ onClose }: { onClose: () => void }) {
  const { lineas, subtotal, cambiarCantidad, quitar, vaciar } = useCart();

  const recordado = leerClienteGuardado();
  const [tipo, setTipo] = useState<TipoPedido>("retiro");
  const [nombre, setNombre] = useState(recordado.nombre);
  const [telefono, setTelefono] = useState(recordado.telefono);
  const [direccion, setDireccion] = useState(recordado.direccion);
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [geoEstado, setGeoEstado] = useState<"idle" | "pidiendo" | "error">("idle");
  const [fallo, setFallo] = useState<string | null>(null);
  const [intentado, setIntentado] = useState(false);
  /** Queda listo cuando el pedido ya está guardado en la base */
  const [confirmado, setConfirmado] = useState<{
    numero: number;
    total: number;
    enlace: string;
  } | null>(null);


  const faltaNombre = !nombre.trim();
  const faltaTelefono = !telefono.trim();
  const faltaDireccion = tipo === "delivery" && !direccion.trim() && !ubicacion;
  const incompleto = faltaNombre || faltaTelefono || faltaDireccion;

  const compartirUbicacion = () => {
    if (!("geolocation" in navigator)) {
      setGeoEstado("error");
      return;
    }
    setGeoEstado("pidiendo");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoEstado("idle");
      },
      () => setGeoEstado("error"),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  };

  const confirmar = async () => {
    setIntentado(true);
    setFallo(null);
    if (incompleto || lineas.length === 0 || guardando) return;

    const ubicacionUrl = ubicacion
      ? `https://maps.google.com/?q=${ubicacion.lat.toFixed(6)},${ubicacion.lng.toFixed(6)}`
      : undefined;

    const datos = {
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      tipo,
      direccion: direccion.trim() || undefined,
      ubicacionUrl,
      nota: nota.trim() || undefined,
    };

    setGuardando(true);
    const resultado = await crearPedido(
      { ...datos, ubicacion: ubicacion ?? undefined },
      lineas.map((l) => ({
        menuItemId: l.menuItemId,
        cantidad: l.cantidad,
        opciones: {
          proteina: l.opciones.proteina,
          // Solo los ids: los precios los pone el servidor
          extras: l.opciones.extras.map((e) => e.id),
        },
        nota: l.nota,
      })),
    );
    setGuardando(false);

    if (!resultado.ok) {
      setFallo(resultado.error);
      return;
    }

    // Guardar los datos para el próximo pedido
    try {
      localStorage.setItem(
        CLAVE_CLIENTE,
        JSON.stringify({
          nombre: datos.nombre,
          telefono: datos.telefono,
          direccion: datos.direccion ?? "",
        }),
      );
    } catch {
      // Si no se puede guardar, el pedido igual salió
    }

    // El total del mensaje es el del servidor, no el del navegador
    const mensaje = mensajePedido(
      lineas,
      datos,
      resultado.total,
      resultado.numero,
    );

    setConfirmado({
      numero: resultado.numero,
      total: resultado.total,
      enlace: linkWhatsApp(mensaje),
    });
    vaciar();
  };

  if (confirmado) {
    return (
      <Sheet titulo={`Pedido #${confirmado.numero}`} onClose={onClose}>
        <div className="py-4 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-bone-mute">
            Tu número de pedido
          </p>
          <p className="my-1 font-display text-6xl leading-none">
            #{confirmado.numero}
          </p>
          <p className="mb-5 font-mono text-sm font-bold">
            {usd(confirmado.total)}
          </p>

          <p className="mb-5 text-sm text-bone-soft">
            Ya lo recibimos en la cocina. Falta cerrar el pago por WhatsApp.
          </p>

          {/* El enlace se abre con un toque aparte a propósito: si se abriera
              solo al terminar de guardar, el navegador lo bloquearía por venir
              de una espera y no de un gesto del visitante. */}
          <a
            href={confirmado.enlace}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center rounded-full bg-casta px-6 py-3.5 font-display text-lg uppercase tracking-[0.03em] text-white transition-colors hover:bg-casta-deep"
          >
            Abrir WhatsApp
          </a>
        </div>
      </Sheet>
    );
  }

  if (lineas.length === 0) {
    return (
      <Sheet titulo="Tu pedido" onClose={onClose}>
        <p className="py-8 text-center text-sm text-bone-soft">
          Todavía no agregaste nada.
        </p>
      </Sheet>
    );
  }

  return (
    <Sheet
      titulo="Tu pedido"
      onClose={onClose}
      pie={
        <>
          {intentado && incompleto && (
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.06em] text-casta">
              Completá los datos marcados
            </p>
          )}
          {fallo && (
            <p className="mb-2 font-mono text-[11px] text-casta">{fallo}</p>
          )}
          <button
            type="button"
            onClick={confirmar}
            disabled={guardando}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-casta px-6 py-3.5 font-display text-lg uppercase tracking-[0.03em] text-white transition-colors hover:bg-casta-deep disabled:opacity-60"
          >
            {guardando ? "Enviando…" : "Confirmar pedido"}
            {!guardando && (
              <span className="font-mono text-base font-bold">
                {usd(subtotal)}
              </span>
            )}
          </button>
        </>
      }
    >
      <ul className="mb-6">
        {lineas.map((linea) => {
          const opciones = describirOpciones(linea.opciones);
          return (
            <li
              key={linea.key}
              className="flex gap-3 border-b border-bone-line py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-lg uppercase">
                    {linea.nombre}
                  </span>
                  <span className="whitespace-nowrap font-mono text-sm font-bold">
                    {usd(subtotalLinea(linea))}
                  </span>
                </div>

                {opciones.length > 0 && (
                  <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.04em] text-bone-mute">
                    {opciones.join(" · ")}
                  </p>
                )}
                {linea.nota && (
                  <p className="mt-0.5 text-[12px] italic text-bone-soft">
                    {linea.nota}
                  </p>
                )}

                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      cambiarCantidad(linea.key, linea.cantidad - 1)
                    }
                    aria-label={`Quitar un ${linea.nombre}`}
                    className="size-7 rounded-full border border-bone-line font-mono text-sm leading-none hover:border-bone-ink"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-mono text-sm font-bold">
                    {linea.cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      cambiarCantidad(linea.key, linea.cantidad + 1)
                    }
                    aria-label={`Agregar un ${linea.nombre}`}
                    className="size-7 rounded-full border border-bone-line font-mono text-sm leading-none hover:border-bone-ink"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => quitar(linea.key)}
                    className="ml-auto font-mono text-[10px] uppercase tracking-[0.08em] text-bone-mute hover:text-casta"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mb-5">
        <h3 className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-bone-mute">
          ¿Cómo la querés?
        </h3>
        <div className="flex gap-2">
          {(["retiro", "delivery"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              aria-pressed={tipo === t}
              className={[
                "rounded-full border px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.06em] transition-colors",
                tipo === t
                  ? "border-casta bg-casta text-white"
                  : "border-bone-line text-bone-soft hover:border-bone-ink",
              ].join(" ")}
            >
              {t === "retiro" ? "Retiro en local" : "Delivery"}
            </button>
          ))}
        </div>
        {tipo === "delivery" && (
          <p className="mt-2 font-mono text-[11px] text-bone-mute">
            El costo de envío se acuerda por WhatsApp.
          </p>
        )}
      </div>

      <Campo
        id="cliente-nombre"
        etiqueta="Tu nombre"
        valor={nombre}
        onChange={setNombre}
        requerido
      />
      <Campo
        id="cliente-telefono"
        etiqueta="Teléfono"
        valor={telefono}
        onChange={setTelefono}
        tipo="tel"
        placeholder="0412 1234567"
        requerido
      />
      {tipo === "delivery" && (
        <>
          <Campo
            id="cliente-direccion"
            etiqueta="Dirección"
            valor={direccion}
            onChange={setDireccion}
            placeholder="Calle, casa/apto, referencia"
            requerido={!ubicacion}
          />

          <div className="mb-3 -mt-1">
            {ubicacion ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-600/40 bg-emerald-600/10 px-3 py-2.5">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-emerald-700">
                  Ubicación adjuntada
                </span>
                <a
                  href={`https://maps.google.com/?q=${ubicacion.lat.toFixed(6)},${ubicacion.lng.toFixed(6)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[11px] uppercase tracking-[0.06em] underline underline-offset-2"
                >
                  Ver en el mapa
                </a>
                <button
                  type="button"
                  onClick={() => setUbicacion(null)}
                  className="ml-auto font-mono text-[11px] uppercase tracking-[0.06em] text-bone-mute hover:text-casta"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={compartirUbicacion}
                disabled={geoEstado === "pidiendo"}
                className="w-full rounded-xl border border-bone-line px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-bone-soft transition-colors hover:border-bone-ink disabled:opacity-60"
              >
                {geoEstado === "pidiendo"
                  ? "Obteniendo tu ubicación…"
                  : "Compartir mi ubicación (GPS)"}
              </button>
            )}
            {geoEstado === "error" && (
              <p className="mt-1.5 font-mono text-[11px] text-casta">
                No pudimos leer tu ubicación. Revisá el permiso del navegador o
                escribí la dirección.
              </p>
            )}
          </div>
        </>
      )}
      <Campo
        id="pedido-nota"
        etiqueta="Nota del pedido"
        valor={nota}
        onChange={setNota}
        placeholder="opcional"
      />
    </Sheet>
  );
}
