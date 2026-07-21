import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Donde aterriza el enlace del magic link. Cambia el código por una sesión y
 * manda al dueño a donde quería entrar.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Solo rutas internas: un `volver` con dominio ajeno sería un redirect
  // abierto, útil para phishing con un link que parece nuestro.
  const pedido = searchParams.get("volver") ?? "/admin/cocina";
  const volver = pedido.startsWith("/") && !pedido.startsWith("//")
    ? pedido
    : "/admin/cocina";

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?error=sin-codigo`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/admin/login?error=enlace-invalido`);
  }

  return NextResponse.redirect(`${origin}${volver}`);
}
