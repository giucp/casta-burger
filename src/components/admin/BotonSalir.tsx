"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function BotonSalir() {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  const salir = async () => {
    setSaliendo(true);
    await createClient().auth.signOut();
    // refresh() para que el middleware vuelva a evaluar y no quede
    // una versión cacheada del panel con la sesión vieja
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={salir}
      disabled={saliendo}
      className="font-mono text-[11px] uppercase tracking-[0.12em] text-smoke transition-colors hover:text-casta disabled:opacity-50"
    >
      {saliendo ? "Saliendo…" : "Salir"}
    </button>
  );
}
