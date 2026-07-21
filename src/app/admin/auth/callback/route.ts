import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const DESTINO_POR_DEFECTO = "/admin/cocina";

/**
 * Solo rutas internas. Un destino con dominio ajeno sería un redirect abierto:
 * un enlace que arranca en nuestro dominio y termina en otro.
 */
function destinoSeguro(valor: string | undefined): string {
  if (!valor) return DESTINO_POR_DEFECTO;
  const ruta = decodeURIComponent(valor);
  return ruta.startsWith("/") && !ruta.startsWith("//")
    ? ruta
    : DESTINO_POR_DEFECTO;
}

/**
 * Donde aterriza el enlace del magic link: cambia el enlace por una sesión y
 * manda al dueño a donde quería entrar.
 *
 * Acepta las dos formas en que Supabase puede devolver al visitante:
 *
 * - `code`: flujo PKCE. Necesita una cookie que quedó en el navegador que
 *   pidió el enlace, así que solo sirve si se abre el correo en ese mismo
 *   navegador.
 * - `token_hash` + `type`: se verifica contra el servidor de Supabase sin
 *   depender de nada guardado antes. Es el que salva el caso real de pedir el
 *   enlace en la tablet de la cocina y abrir el correo en el teléfono.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;

  const cookieStore = await cookies();
  const volver = destinoSeguro(cookieStore.get("casta_volver")?.value);

  const fallar = (motivo: string) =>
    NextResponse.redirect(`${origin}/admin/login?error=${motivo}`);

  const supabase = await createClient();

  let error = null;
  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && tipo) {
    ({ error } = await supabase.auth.verifyOtp({
      type: tipo,
      token_hash: tokenHash,
    }));
  } else {
    return fallar("sin-codigo");
  }

  if (error) return fallar("enlace-invalido");

  const respuesta = NextResponse.redirect(`${origin}${volver}`);
  respuesta.cookies.set("casta_volver", "", { path: "/", maxAge: 0 });
  return respuesta;
}
