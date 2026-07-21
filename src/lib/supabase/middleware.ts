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
  const esAdmin = ruta.startsWith("/admin");
  const esPublica = PUBLICAS.some((p) => ruta.startsWith(p));

  if (esAdmin && !esPublica && !sesion) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/admin/login";
    // Para volver a donde quería entrar después de iniciar sesión
    destino.searchParams.set("volver", ruta);
    return NextResponse.redirect(destino);
  }

  // Ya con sesión, el login no tiene sentido
  if (ruta === "/admin/login" && sesion) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/admin/cocina";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return response;
}
