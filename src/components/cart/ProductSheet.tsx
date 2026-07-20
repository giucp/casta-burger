"use client";

import { useState } from "react";
import {
  extrasDisponibles,
  PAPAS_PRECIO,
  precioUnitario,
  type OpcionesLinea,
} from "@/lib/cart";
import { usd } from "@/lib/format";
import {
  PAPAS_ADICIONAL,
  PRESENTACIONES,
  PROTEINAS,
  type MenuItem,
  type Presentacion,
  type Proteina,
} from "@/lib/menu";
import { useCart } from "./CartProvider";
import { Sheet } from "./Sheet";

/** Fila de opción seleccionable, estilo ticket. */
function Opcion({
  activa,
  onClick,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={[
        "rounded-full border px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.06em] transition-colors",
        activa
          ? "border-casta bg-casta text-white"
          : "border-bone-line text-bone-soft hover:border-bone-ink",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Grupo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-bone-mute">
        {titulo}
      </h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

export function ProductSheet({
  item,
  onClose,
}: {
  item: MenuItem;
  onClose: () => void;
}) {
  const { agregar } = useCart();

  const llevaProteina =
    item.categoria === "Burgers" || item.categoria === "Combo";
  const llevaPresentacion = item.precioWhiteMeal !== undefined;
  const llevaPapas = item.categoria === "Burgers";
  const llevaExtras = llevaProteina;

  const [proteina, setProteina] = useState<Proteina>(PROTEINAS[0]);
  const [presentacion, setPresentacion] = useState<Presentacion>("only");
  const [papas, setPapas] = useState(false);
  const [extras, setExtras] = useState<string[]>([]);
  const [cantidad, setCantidad] = useState(1);
  const [nota, setNota] = useState("");

  const opciones: OpcionesLinea = {
    proteina: llevaProteina ? proteina : undefined,
    presentacion: llevaPresentacion ? presentacion : undefined,
    papas: llevaPapas ? papas : undefined,
    extras,
  };

  const unitario = precioUnitario(item, opciones);
  const total = unitario * cantidad;

  const alternarExtra = (id: string) =>
    setExtras((actuales) =>
      actuales.includes(id)
        ? actuales.filter((e) => e !== id)
        : [...actuales, id],
    );

  const confirmar = () => {
    agregar(item, opciones, cantidad, nota);
    onClose();
  };

  return (
    <Sheet
      titulo={item.nombre}
      onClose={onClose}
      pie={
        <button
          type="button"
          onClick={confirmar}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-casta px-6 py-3.5 font-display text-lg uppercase tracking-[0.03em] text-white transition-colors hover:bg-casta-deep"
        >
          Agregar
          <span className="font-mono text-base font-bold">{usd(total)}</span>
        </button>
      }
    >
      {item.descripcion && (
        <p className="mb-5 text-[13.5px] text-bone-soft">{item.descripcion}</p>
      )}

      {llevaProteina && (
        <Grupo titulo="Proteína">
          {PROTEINAS.map((p) => (
            <Opcion
              key={p}
              activa={proteina === p}
              onClick={() => setProteina(p)}
            >
              {p}
            </Opcion>
          ))}
        </Grupo>
      )}

      {llevaPresentacion && (
        <Grupo titulo="Presentación">
          <Opcion
            activa={presentacion === "only"}
            onClick={() => setPresentacion("only")}
          >
            {PRESENTACIONES.only.etiqueta} · {usd(item.precio ?? 0)}
          </Opcion>
          <Opcion
            activa={presentacion === "whiteMeal"}
            onClick={() => setPresentacion("whiteMeal")}
          >
            {PRESENTACIONES.whiteMeal.etiqueta} ·{" "}
            {usd(item.precioWhiteMeal ?? 0)}
          </Opcion>
          <p className="w-full font-mono text-[11px] text-bone-mute">
            {PRESENTACIONES.whiteMeal.etiqueta} ={" "}
            {PRESENTACIONES.whiteMeal.detalle}
          </p>
        </Grupo>
      )}

      {llevaPapas && (
        <Grupo titulo="Papás">
          <Opcion activa={papas} onClick={() => setPapas(!papas)}>
            {PAPAS_ADICIONAL.etiqueta} · +{usd(PAPAS_PRECIO)}
          </Opcion>
        </Grupo>
      )}

      {llevaExtras && (
        <Grupo titulo="Extras">
          {extrasDisponibles().map((extra) => (
            <Opcion
              key={extra.id}
              activa={extras.includes(extra.id)}
              onClick={() => alternarExtra(extra.id)}
            >
              {extra.nombre} · +{usd(extra.precio ?? 0)}
            </Opcion>
          ))}
        </Grupo>
      )}

      <Grupo titulo="Cantidad">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCantidad((c) => Math.max(1, c - 1))}
            aria-label="Quitar uno"
            className="size-9 rounded-full border border-bone-line font-mono text-lg leading-none text-bone-ink hover:border-bone-ink"
          >
            −
          </button>
          <span
            aria-live="polite"
            className="w-8 text-center font-mono text-base font-bold"
          >
            {cantidad}
          </span>
          <button
            type="button"
            onClick={() => setCantidad((c) => Math.min(20, c + 1))}
            aria-label="Agregar uno"
            className="size-9 rounded-full border border-bone-line font-mono text-lg leading-none text-bone-ink hover:border-bone-ink"
          >
            +
          </button>
        </div>
      </Grupo>

      <section>
        <label
          htmlFor="nota-producto"
          className="mb-2 block font-mono text-[11px] uppercase tracking-[0.16em] text-bone-mute"
        >
          Nota para la cocina
        </label>
        <input
          id="nota-producto"
          type="text"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="ej: sin cebolla"
          maxLength={120}
          className="w-full rounded-xl border border-bone-line bg-white/50 px-3 py-2.5 text-sm placeholder:text-bone-mute"
        />
      </section>
    </Sheet>
  );
}
