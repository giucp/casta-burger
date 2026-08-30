"use client";

import { useState } from "react";
import { describirOpciones, subtotalLinea } from "@/lib/cart";
import { usd } from "@/lib/format";
import { BUSINESS } from "@/lib/config";
import { linkWhatsApp, mensajePedido, type TipoPedido } from "@/lib/whatsapp";
import { crearPedido } from "@/lib/acciones/crear-pedido";
import { guardarSuscripcion } from "@/lib/acciones/suscribir";
import { soportaPush, suscribirCliente } from "@/lib/push-cliente";
import { useEstadoNegocio } from "../EstadoNegocio";
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
  const estado = useEstadoNegocio();

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
    /** Si el navegador dejó abrir WhatsApp solo. Cambia lo que dice la pantalla. */
    abrio: boolean;
    id: string;
    numero: number;
    tipo: TipoPedido;
    total: number;
    enlace: string;
  } | null>(null);
  const [avisos, setAvisos] = useState<"idle" | "pidiendo" | "activados" | "no">(
    "idle",
  );


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
    // El servidor lo vuelve a verificar; esto solo evita el viaje en vano si el
    // reloj cruzó la hora de cierre con el panel abierto.
    if (!estado.puedePedir) return;

    /**
     * La pestaña se abre ACÁ, todavía dentro del toque, y recién después se le
     * pone la dirección. Es lo único que hace que un solo botón pueda guardar
     * el pedido Y abrir WhatsApp.
     *
     * Abrirla después del `await` no funciona: para el navegador eso ya no es
     * un gesto del visitante sino algo que la página decidió sola, y lo trata
     * como una ventana emergente. Por eso antes hacían falta dos toques.
     *
     * Si aun así devuelve null —hay navegadores que bloquean todo—, el pedido
     * se guarda igual y la pantalla de confirmación ofrece el botón. Nunca se
     * pierde un pedido por esto.
     */
    const ventana = window.open("", "_blank");
    if (ventana) {
      // Una pestaña en blanco por un segundo parece que algo se rompió.
      ventana.document.write(
        `<!doctype html><meta charset="utf-8"><title>${BUSINESS.nombre}</title>` +
          `<body style="margin:0;background:#0C0C0C;color:#D6CFC7;` +
          `font:16px/1.5 system-ui,sans-serif;display:grid;place-items:center;height:100vh">` +
          `<p>Abriendo WhatsApp…</p>`,
      );
      ventana.document.close();
    }

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
      // No dejarle una pestaña huérfana abierta a alguien cuyo pedido no salió.
      ventana?.close();
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

    const enlace = linkWhatsApp(mensaje);
    const abrio = !!ventana && !ventana.closed;
    if (abrio) ventana.location.href = enlace;

    setConfirmado({
      id: resultado.id,
      numero: resultado.numero,
      tipo,
      total: resultado.total,
      enlace,
      abrio,
    });
    vaciar();
  };

  const activarAvisos = async () => {
    if (!confirmado) return;
    setAvisos("pidiendo");
    const sub = await suscribirCliente();
    if (!sub) {
      setAvisos("no");
      return;
    }
    const r = await guardarSuscripcion(confirmado.id, sub);
    setAvisos(r.ok ? "activados" : "no");
  };

  if (confirmado) {
    const textoAviso =
      confirmado.tipo === "delivery"
        ? "Te avisamos cuando tu pedido salga en camino."
        : "Te avisamos cuando esté listo para buscar.";

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
            {confirmado.abrio
              ? "Ya lo recibimos en la cocina y te abrimos WhatsApp para cerrar el pago."
              : "Ya lo recibimos en la cocina. Falta cerrar el pago por WhatsApp."}
          </p>

          {/*
            Con un solo toque WhatsApp ya se abrió en otra pestaña. El botón
            queda igual, y no es de adorno: es la salida cuando el navegador
            bloqueó la pestaña, cuando el visitante la cerró sin querer, o
            cuando volvió acá a activar los avisos y perdió la otra de vista.
            Por eso cambia lo que dice, no si está.
          */}
          <a
            href={confirmado.enlace}
            target="_blank"
            rel="noreferrer"
            className={[
              "flex w-full items-center justify-center rounded-full px-6 py-3.5 font-display text-lg uppercase tracking-[0.03em] transition-colors",
              confirmado.abrio
                ? "border border-bone-line text-bone-ink hover:border-bone-ink"
                : "bg-casta text-white hover:bg-casta-deep",
            ].join(" ")}
          >
            {confirmado.abrio ? "Volver a abrir WhatsApp" : "Abrir WhatsApp"}
          </a>

          {/* Avisos push: solo se ofrece si el navegador los soporta */}
          {soportaPush() && avisos !== "activados" && (
            <div className="mt-4 border-t border-bone-line pt-4">
              {avisos === "no" ? (
                <p className="font-mono text-[11px] text-bone-mute">
                  Sin avisos por ahora. Igual podés seguir tu pedido por
                  WhatsApp.
                </p>
              ) : (
                <>
                  <p className="mb-2 text-sm font-medium text-bone-ink">
                    ¿Querés que te avisemos cuando esté listo?
                  </p>
                  <p className="mb-3 font-mono text-[10px] text-bone-mute">
                    {textoAviso}
                  </p>
                  <button
                    type="button"
                    onClick={activarAvisos}
                    disabled={avisos === "pidiendo"}
                    className="w-full rounded-full border border-bone-ink px-6 py-3 font-mono text-xs font-bold uppercase tracking-[0.06em] text-bone-ink transition-colors hover:bg-bone-ink hover:text-bone disabled:opacity-60"
                  >
                    {avisos === "pidiendo" ? "Activando…" : "Sí, avisame"}
                  </button>
                </>
              )}
            </div>
          )}

          {avisos === "activados" && (
            <div className="mt-4 border-t border-bone-line pt-4">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-emerald-700">
                Avisos activados
              </p>
              <p className="mt-1 font-mono text-[10px] text-bone-mute">
                {textoAviso}
              </p>
            </div>
          )}
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
        estado.puedePedir ? (
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
        ) : (
          /* Cerró mientras el panel estaba abierto. El pedido no se borra: el
             carrito sobrevive en el teléfono y sigue ahí cuando abramos. */
          <div className="rounded-full border border-bone-line px-6 py-3.5 text-center">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-bone-mute">
              Cerrado
            </p>
            <p className="mt-1 font-mono text-[11px] text-bone-mute">
              {estado.proximaApertura}. Tu pedido queda guardado acá.
            </p>
          </div>
        )
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
