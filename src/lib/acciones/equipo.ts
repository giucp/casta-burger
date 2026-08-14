"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type Admin = {
  email: string;
  agregadoPor: string | null;
  desde: string;
};

export type Resultado = { ok: true } | { ok: false; error: string };

/** Formato de correo, a lo básico y sin pretensiones de RFC. */
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function normalizar(correo: string): string {
  return correo.trim().toLowerCase();
}

/**
 * La lista de admins.
 *
 * Va con el cliente de sesión, no con la llave secreta: así el RLS decide, y
 * quien no esté en la lista recibe una lista vacía en vez de la de verdad.
 */
export async function listarAdmins(): Promise<Admin[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admins")
    .select("email, agregado_por, created_at")
    .order("created_at");

  if (error) {
    console.error("No se pudo leer la lista de admins:", error.message);
    return [];
  }

  return (data ?? []).map((f) => ({
    email: f.email as string,
    agregadoPor: (f.agregado_por as string | null) ?? null,
    desde: f.created_at as string,
  }));
}

/**
 * Suma a alguien al back-office.
 *
 * Son dos pasos y el orden importa:
 *
 * 1. La fila se inserta con el cliente de SESIÓN. Ahí es donde se autoriza:
 *    el RLS solo deja escribir en `admins` a quien ya es admin. Si el que
 *    llama no lo es, la inserción falla y no se sigue.
 *
 * 2. Recién entonces se crea la cuenta de Auth con la llave secreta. Hace
 *    falta porque el login ya no da de alta a nadie (`shouldCreateUser: false`):
 *    sin este paso, el correo quedaría en la lista pero la persona pediría su
 *    enlace y no le llegaría nunca.
 *
 * Nunca al revés. La llave secreta se salta el RLS, así que crear la cuenta
 * primero sería regalarle una cuenta a cualquiera que llame a esta acción.
 */
export async function agregarAdmin(correo: string): Promise<Resultado> {
  const email = normalizar(correo);
  if (!CORREO.test(email)) return { ok: false, error: "Ese correo no es válido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("admins")
    .insert({ email, agregado_por: user?.email ?? null });

  if (error) {
    // 23505 = clave duplicada
    if (error.code === "23505")
      return { ok: false, error: "Ese correo ya tiene acceso." };
    return { ok: false, error: "No se pudo agregar. ¿Seguís con sesión?" };
  }

  const admin = createAdminClient();
  const { error: errorCuenta } = await admin.auth.admin.createUser({
    email,
    // Sin esto, Supabase le mandaría primero un correo de confirmación y el
    // enlace de acceso no funcionaría hasta que lo abriera.
    email_confirm: true,
  });

  // Que ya exista la cuenta no es un problema: es el caso de alguien que se
  // había registrado antes. Lo que importa es que ahora está en la lista.
  if (errorCuenta && !/already/i.test(errorCuenta.message)) {
    console.error("No se pudo crear la cuenta:", errorCuenta.message);
    return {
      ok: false,
      error:
        "Quedó en la lista, pero no se pudo crear su cuenta. Que pida el enlace igual y avisame si no le llega.",
    };
  }

  revalidatePath("/admin/equipo");
  return { ok: true };
}

/**
 * Saca a alguien.
 *
 * El último admin no se puede sacar —lo impide un trigger en la base, no solo
 * esta pantalla— porque dejaría el panel cerrado sin nadie que pueda volver a
 * abrirlo: para tocar la lista de admins hay que ser admin.
 *
 * La cuenta de Auth no se borra. Sin la fila en `admins` no puede leer ni
 * escribir nada, y borrar cuentas es más fácil de lamentar que de deshacer.
 */
export async function quitarAdmin(correo: string): Promise<Resultado> {
  const email = normalizar(correo);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (normalizar(user?.email ?? "") === email)
    return { ok: false, error: "No podés sacarte a vos mismo." };

  const { error } = await supabase.from("admins").delete().eq("email", email);

  if (error) {
    // El trigger del último admin llega como error de la base
    if (/último admin/i.test(error.message))
      return { ok: false, error: "Es el último admin: nadie podría volver a entrar." };
    return { ok: false, error: "No se pudo quitar." };
  }

  revalidatePath("/admin/equipo");
  return { ok: true };
}
