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

/**
 * 8 y no 6. Este panel tiene los pedidos con nombre, teléfono y dirección de
 * cada cliente; seis caracteres es poco para eso. Se valida acá y no solo en el
 * navegador porque una acción de servidor la puede llamar cualquiera.
 */
const CLAVE_MINIMA = 8;

function normalizar(correo: string): string {
  return correo.trim().toLowerCase();
}

/**
 * Corta si quien llama no es admin.
 *
 * Hace falta explícitamente en todo lo que toque la llave secreta: esa llave se
 * salta el RLS, así que ahí la base ya no protege nada y la autorización tiene
 * que estar en el código. Se pregunta con el cliente de SESIÓN, que es el único
 * que sabe quién está llamando.
 */
async function exigirAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("es_admin");
  return data === true ? null : "No tenés permiso para esto.";
}

/**
 * El id de Auth de un correo.
 *
 * La API de administración de Supabase no busca por correo, así que hay que
 * recorrer las páginas. Para un equipo de dos personas sobra; el tope de 10
 * páginas está para que un error no se convierta en un bucle infinito.
 */
async function idDe(email: string): Promise<string | null> {
  const admin = createAdminClient();
  for (let pagina = 1; pagina <= 10; pagina++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page: pagina,
      perPage: 200,
    });
    if (error || !data?.users?.length) return null;
    const encontrado = data.users.find(
      (u) => (u.email ?? "").toLowerCase() === email,
    );
    if (encontrado) return encontrado.id;
    if (data.users.length < 200) return null;
  }
  return null;
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
 * Suma a alguien al back-office, con su contraseña puesta acá mismo.
 *
 * Son dos pasos y el orden importa:
 *
 * 1. La fila se inserta con el cliente de SESIÓN. Ahí es donde se autoriza: el
 *    RLS solo deja escribir en `admins` a quien ya es admin. Si el que llama no
 *    lo es, la inserción falla y no se sigue.
 *
 * 2. Recién entonces se crea la cuenta con la llave secreta.
 *
 * Nunca al revés: la llave secreta se salta el RLS, así que crear la cuenta
 * primero sería regalarle una cuenta a cualquiera que llame a esta acción.
 *
 * La contraseña se la decís a la persona de palabra. No se manda ningún correo
 * —ni hace falta— y así el cupo de Supabase queda fuera del camino.
 */
export async function agregarAdmin(
  correo: string,
  clave: string,
): Promise<Resultado> {
  const email = normalizar(correo);
  if (!CORREO.test(email))
    return { ok: false, error: "Ese correo no es válido." };
  if (clave.length < CLAVE_MINIMA)
    return {
      ok: false,
      error: `La contraseña tiene que tener al menos ${CLAVE_MINIMA} caracteres.`,
    };

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
    password: clave,
    // Sin esto Supabase le mandaría un correo de confirmación y no podría
    // entrar hasta abrirlo — justo lo que estamos sacando del medio.
    email_confirm: true,
  });

  if (errorCuenta) {
    // Ya existía la cuenta (alguien de antes): se le pone la contraseña nueva.
    const id = await idDe(email);
    if (!id) {
      console.error("No se pudo crear la cuenta:", errorCuenta.message);
      return {
        ok: false,
        error: "Quedó en la lista, pero no se pudo crear su cuenta. Avisame.",
      };
    }
    const { error: errorClave } = await admin.auth.admin.updateUserById(id, {
      password: clave,
    });
    if (errorClave)
      return {
        ok: false,
        error: "Quedó en la lista, pero no se pudo poner la contraseña.",
      };
  }

  revalidatePath("/admin/equipo");
  return { ok: true };
}

/**
 * Cambiarle la contraseña a otro admin: es la recuperación del sistema.
 *
 * Que no dependa del correo es todo el punto del cambio. Si el cocinero olvida
 * la suya un viernes a las 8 PM, el dueño se la cambia acá y sigue trabajando.
 */
export async function cambiarClaveDe(
  correo: string,
  clave: string,
): Promise<Resultado> {
  const noPuede = await exigirAdmin();
  if (noPuede) return { ok: false, error: noPuede };

  if (clave.length < CLAVE_MINIMA)
    return {
      ok: false,
      error: `La contraseña tiene que tener al menos ${CLAVE_MINIMA} caracteres.`,
    };

  const email = normalizar(correo);

  // Solo se le puede cambiar la contraseña a quien está en la lista. Sin esto,
  // un admin podría cambiarle la contraseña a cualquier cuenta del proyecto.
  const supabase = await createClient();
  const { data: fila } = await supabase
    .from("admins")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  if (!fila) return { ok: false, error: "Ese correo no está en la lista." };

  const id = await idDe(email);
  if (!id) return { ok: false, error: "No se encontró esa cuenta." };

  const { error } = await createAdminClient().auth.admin.updateUserById(id, {
    password: clave,
  });
  if (error) return { ok: false, error: "No se pudo cambiar la contraseña." };

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
      return {
        ok: false,
        error: "Es el último admin: nadie podría volver a entrar.",
      };
    return { ok: false, error: "No se pudo quitar." };
  }

  revalidatePath("/admin/equipo");
  return { ok: true };
}
