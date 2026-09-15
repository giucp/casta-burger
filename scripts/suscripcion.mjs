// Control de la suscripción del servicio, para TaquionLabs.
//
// NO es una pantalla de la app: es una herramienta de línea de comando que se
// corre a mano con la llave secreta de Supabase. La app del cliente solo LEE
// la fecha; moverla es cosa de TaquionLabs y de nadie más.
//
//   node scripts/suscripcion.mjs estado
//   node scripts/suscripcion.mjs activar            # hasta el próximo día 15
//   node scripts/suscripcion.mjs activar 2026-11-15 # hasta una fecha exacta
//   node scripts/suscripcion.mjs suspender          # corta ahora mismo
//
// Lee NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY de .env.local.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function cargarEnv() {
  let texto = "";
  try {
    texto = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    throw new Error("No se encontró .env.local");
  }
  for (const linea of texto.split("\n")) {
    const m = linea.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

/** Fecha de hoy en Caracas, como YYYY-MM-DD. */
function hoyCaracas() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** El próximo día 15 que sea hoy o después, en Caracas. */
function proximoDia15() {
  const [a, m, d] = hoyCaracas().split("-").map(Number);
  if (d <= 15) return `${a}-${String(m).padStart(2, "0")}-15`;
  const mm = m === 12 ? 1 : m + 1;
  const aa = m === 12 ? a + 1 : a;
  return `${aa}-${String(mm).padStart(2, "0")}-15`;
}

function ayerCaracas() {
  const [a, m, d] = hoyCaracas().split("-").map(Number);
  const t = new Date(Date.UTC(a, m - 1, d));
  t.setUTCDate(t.getUTCDate() - 1);
  return t.toISOString().slice(0, 10);
}

cargarEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secreta = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secreta) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const supabase = createClient(url, secreta, {
  auth: { persistSession: false },
});

const [cmd, arg] = process.argv.slice(2);

async function estado() {
  const { data, error } = await supabase
    .from("suscripcion")
    .select("pagado_hasta, updated_at")
    .eq("id", true)
    .single();
  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
  const vencida = hoyCaracas() > data.pagado_hasta;
  console.log(`Pagado hasta: ${data.pagado_hasta}`);
  console.log(`Hoy (Caracas): ${hoyCaracas()}`);
  console.log(`Estado: ${vencida ? "VENCIDA — servicio en pausa" : "AL DÍA — en línea"}`);
}

async function mover(fecha, etiqueta) {
  const { data, error } = await supabase
    .from("suscripcion")
    .update({ pagado_hasta: fecha, updated_at: new Date().toISOString() })
    .eq("id", true)
    .select("pagado_hasta")
    .single();
  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
  console.log(`${etiqueta}: pagado hasta ${data.pagado_hasta}.`);
  console.log("La web y el panel reaccionan en menos de un minuto.");
}

if (cmd === "estado") {
  await estado();
} else if (cmd === "activar") {
  const fecha = arg ?? proximoDia15();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    console.error("Fecha inválida. Usá YYYY-MM-DD.");
    process.exit(1);
  }
  await mover(fecha, "Activado");
} else if (cmd === "suspender") {
  await mover(ayerCaracas(), "Suspendido");
} else {
  console.log("Uso: node scripts/suscripcion.mjs estado | activar [YYYY-MM-DD] | suspender");
  process.exit(1);
}
