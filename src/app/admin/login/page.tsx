import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { LogoMark } from "@/components/icons";

export const metadata = { title: "Entrar — Casta Admin" };

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-ink px-5 py-12">
      <div className="w-full max-w-[380px]">
        <div className="mb-7 flex items-center gap-3">
          <LogoMark className="size-9 shrink-0" />
          <span className="font-display text-2xl uppercase tracking-[0.02em]">
            Casta <b className="font-normal text-casta">Admin</b>
          </span>
        </div>

        <h1 className="mb-2 font-display text-3xl uppercase leading-tight">
          Entrar
        </h1>
        <p className="mb-6 text-sm text-smoke">
          Te mandamos un enlace al correo. No hay contraseña que recordar ni que
          se pueda filtrar.
        </p>

        {/* LoginForm lee ?volver= de la URL, y eso obliga a Next a resolverlo
            en el cliente. El fallback mantiene el alto para que no salte. */}
        <Suspense
          fallback={
            <div className="h-[168px] animate-pulse rounded-xl bg-card" />
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
