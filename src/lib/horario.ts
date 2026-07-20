import { BUSINESS, HORARIO } from "./config";

const DIAS_ES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Hora local de Caracas, independiente de la zona del servidor o del visitante.
 * Vercel corre en UTC y el cliente puede estar en cualquier lado, así que el
 * horario SIEMPRE se evalúa contra America/Caracas.
 */
function ahoraEnCaracas(now: Date): { dia: number; hora: number } {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: HORARIO.timeZone,
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);

  const weekday = partes.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hour = partes.find((p) => p.type === "hour")?.value ?? "0";

  return {
    dia: WEEKDAY_INDEX[weekday] ?? 0,
    // hour12:false puede devolver "24" a la medianoche en algunos runtimes
    hora: Number(hour) % 24,
  };
}

export type EstadoNegocio = {
  abierto: boolean;
  /** Texto del sello: "Abierto" / "Cerrado" */
  etiqueta: string;
  /** Mensaje de cuándo volvemos, solo cuando está cerrado */
  proximaApertura: string | null;
};

/**
 * El negocio está abierto si (a) estamos dentro del horario jue–dom 6–11 PM
 * y (b) el dueño no apagó los pedidos manualmente (§5 del brief).
 */
export function estadoNegocio(now: Date = new Date()): EstadoNegocio {
  const { dia, hora } = ahoraEnCaracas(now);

  const enHorario =
    (HORARIO.dias as readonly number[]).includes(dia) &&
    hora >= HORARIO.desde &&
    hora < HORARIO.hasta;

  const abierto = enHorario && BUSINESS.aceptaPedidos;

  if (abierto) {
    return { abierto: true, etiqueta: "Abierto", proximaApertura: null };
  }

  return {
    abierto: false,
    etiqueta: "Cerrado",
    proximaApertura: BUSINESS.aceptaPedidos
      ? `Abrimos ${proximoDiaAbierto(dia, hora)} a las 6:00 PM`
      : "Volvemos a tomar pedidos en un rato",
  };
}

/** Nombre del próximo día en que abrimos, contando desde hoy. */
function proximoDiaAbierto(diaActual: number, horaActual: number): string {
  const dias = HORARIO.dias as readonly number[];

  // Si hoy abrimos y todavía no llega la hora, es hoy mismo.
  if (dias.includes(diaActual) && horaActual < HORARIO.desde) {
    return "hoy";
  }

  for (let salto = 1; salto <= 7; salto++) {
    const dia = (diaActual + salto) % 7;
    if (dias.includes(dia)) {
      return salto === 1 ? "mañana" : DIAS_ES[dia];
    }
  }

  return "pronto";
}
