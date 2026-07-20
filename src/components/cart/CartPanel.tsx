"use client";

import { useState } from "react";
import { describirOpciones, subtotalLinea } from "@/lib/cart";
import { usd } from "@/lib/format";
import { linkWhatsApp, mensajePedido, type TipoPedido } from "@/lib/whatsapp";
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

export function CartPanel({ onClose }: { onClose: () => void }) {
  const { lineas, subtotal, cambiarCantidad, quitar, vaciar } = useCart();

  const [tipo, setTipo] = useState<TipoPedido>("retiro");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [nota, setNota] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [intentado, setIntentado] = useState(false);

  const faltaNombre = !nombre.trim();
  const faltaTelefono = !telefono.trim();
  const faltaDireccion = tipo === "delivery" && !direccion.trim();
  const incompleto = faltaNombre || faltaTelefono || faltaDireccion;

  const confirmar = () => {
    setIntentado(true);
    if (incompleto || lineas.length === 0) return;

    const mensaje = mensajePedido(
      lineas,
      {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        tipo,
        direccion: direccion.trim() || undefined,
        nota: nota.trim() || undefined,
      },
      subtotal,
    );

    // TODO(fase 1, paso 6): antes de abrir WhatsApp, guardar el pedido en
    // Supabase (estado 'nuevo') y disparar el aviso a Telegram.
    window.open(linkWhatsApp(mensaje), "_blank", "noopener,noreferrer");

    vaciar();
    setEnviado(true);
  };

  if (enviado) {
    return (
      <Sheet titulo="Pedido enviado" onClose={onClose}>
        <div className="py-6 text-center">
          <p className="mb-3 font-display text-3xl uppercase leading-tight">
            ¡Listo!
          </p>
          <p className="text-sm text-bone-soft">
            Se abrió WhatsApp con el resumen de tu pedido.
            <br />
            Termina de coordinar el pago por ahí.
          </p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-bone-mute">
            Si no se abrió, revisá que el navegador no haya bloqueado la ventana
          </p>
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
          <button
            type="button"
            onClick={confirmar}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-casta px-6 py-3.5 font-display text-lg uppercase tracking-[0.03em] text-white transition-colors hover:bg-casta-deep"
          >
            Confirmar por WhatsApp
            <span className="font-mono text-base font-bold">
              {usd(subtotal)}
            </span>
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
        <Campo
          id="cliente-direccion"
          etiqueta="Dirección"
          valor={direccion}
          onChange={setDireccion}
          placeholder="Calle, casa/apto, referencia"
          requerido
        />
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
