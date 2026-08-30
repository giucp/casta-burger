/**
 * Qué pantalla del back-office puede ver cada rol.
 *
 * Una sola lista, usada por la barra de pestañas y por el proxy. Si vivieran
 * en dos lados, tarde o temprano dirían cosas distintas: el menú escondería
 * una sección que la URL igual abre, o al revés.
 *
 * Esto NO es la seguridad. La frontera de verdad es el RLS de la base, que
 * pregunta el rol en cada consulta. Acá se decide qué se ofrece: una pantalla
 * que se abre para mostrar una tabla vacía es peor que no ofrecerla.
 */

export type Rol = "dueno" | "encargado" | "cocina";

export const ROLES: Rol[] = ["dueno", "encargado", "cocina"];

export function esRol(v: unknown): v is Rol {
  return typeof v === "string" && (ROLES as string[]).includes(v);
}

/** Cómo se llama cada rol donde lo lee una persona. */
export const ROL_ETIQUETA: Record<Rol, string> = {
  dueno: "Dueño",
  encargado: "Encargado",
  cocina: "Cocina",
};

export const ROL_DESCRIPCION: Record<Rol, string> = {
  dueno: "Todo, incluido repartir accesos y anular ventas.",
  encargado: "El día a día: pedidos, menú, inventario y compras.",
  cocina: "Solo la pantalla de pedidos.",
};

type Seccion = { href: string; label: string; roles: Rol[] };

const TODOS: Rol[] = ["dueno", "encargado", "cocina"];
const GESTION: Rol[] = ["dueno", "encargado"];
const SOLO_DUENO: Rol[] = ["dueno"];

export const SECCIONES: Seccion[] = [
  { href: "/admin", label: "Panel", roles: SOLO_DUENO },
  { href: "/admin/cocina", label: "Cocina", roles: TODOS },
  { href: "/admin/menu", label: "Menú", roles: GESTION },
  { href: "/admin/inventario", label: "Inventario", roles: GESTION },
  { href: "/admin/recetas", label: "Recetas", roles: GESTION },
  { href: "/admin/compras", label: "Compras", roles: GESTION },
  { href: "/admin/actividad", label: "Actividad", roles: SOLO_DUENO },
  { href: "/admin/equipo", label: "Equipo", roles: SOLO_DUENO },
];

export function seccionesDe(rol: Rol): Seccion[] {
  return SECCIONES.filter((s) => s.roles.includes(rol));
}

/**
 * Dónde aterriza cada rol: su primera sección.
 *
 * El dueño cae en el panel, el encargado y la cocina en los pedidos. Nadie
 * aterriza en una pantalla que no puede ver.
 */
export function destinoDe(rol: Rol): string {
  return seccionesDe(rol)[0]?.href ?? "/admin/cocina";
}

/**
 * Cerrado por omisión: una ruta de /admin que no esté en la lista solo la
 * abre el dueño. Así, el día que alguien agregue una pantalla y se olvide de
 * anotarla acá, el error es dejar afuera a quien correspondía — no dejar
 * entrar a quien no.
 */
export function puedeVer(rol: Rol, ruta: string): boolean {
  const seccion = SECCIONES.find((s) => s.href === ruta);
  return seccion ? seccion.roles.includes(rol) : rol === "dueno";
}
