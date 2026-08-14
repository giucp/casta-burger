import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Rutas de /admin que se pueden ver sin sesión. */
const PUBLICAS = ["/admin/login", "/admin/auth"];

/**
 * Refresca la sesión en cada request y protege /admin (§6 del brief).
 *
 * Dos cosas que parecen detalles y no lo son:
 *
 * 1. Se usa `getClaims()` y no `getSession()`. `getSession()` lee la cookie sin
 *    verificarla, y una cookie la puede escribir cualquiera: usarla para decidir
 *    permisos del lado del servidor es confiar en el atacante. `getClaims()`
 *    valida la firma del JWT contra las llaves públicas del proyecto.
 *
 * 2. Los headers que devuelve `setAll` se copian a la respuesta. Marcan la
 *    respuesta como no cacheable: sin ellos, un CDN podría guardar una respuesta
 *    que trae la cookie de sesión de alguien y servírsela a otro visitante.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          response = NextResponse.next({ request });

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [clave, valor] of Object.entries(headers)) {
            response.headers.set(clave, valor);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const sesion = data?.claims ?? null;

  const ruta = request.nextUrl.pathname;
  const esRutaAdmin = ruta.startsWith("/admin");

  // La web pública no paga la consulta de permisos. Igual pasó por acá arriba,
  // que es lo que mantiene fresca la sesión del dueño mientras navega.
  if (!esRutaAdmin) return response;

  /**
   * Tener sesión no es tener permiso.
   *
   * Antes acá solo se preguntaba si había sesión, y con el formulario de login
   * dando de alta a cualquier correo, eso quería decir que cualquiera entraba.
   * `es_admin()` pregunta contra la lista de admins de la base — la misma que
   * usan todas las políticas de RLS, así que la interfaz y los datos no pueden
   * contradecirse.
   */
  let autorizado = false;
  if (sesion) {
    const { data: ok } = await supabase.rpc("es_admin");
    autorizado = ok === true;
  }

  const esPublica = PUBLICAS.some((p) => ruta.startsWith(p));

  if (!esPublica && !autorizado) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/admin/login";
    destino.search = "";
    if (sesion) {
      // Entró bien, pero no está en la lista. Merece saber por qué.
      destino.searchParams.set("error", "sin-permiso");
    } else {
      // Para volver a donde quería entrar después de iniciar sesión
      destino.searchParams.set("volver", ruta);
    }
    return NextResponse.redirect(destino);
  }

  /**
   * Ya adentro, el login no tiene sentido. Se rebota solo a los AUTORIZADOS:
   * mandar de vuelta al panel a alguien con sesión pero sin permiso lo haría
   * rebotar entre el panel y el login para siempre, sin poder ni salir.
   */
  if (ruta === "/admin/login" && autorizado) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/admin/cocina";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return response;
}
