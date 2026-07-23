import { BUSINESS } from "@/lib/config";
import { InstagramIcon, MapPinIcon, WhatsAppIcon } from "./icons";

function Block({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-smoke">
        {titulo}
      </h3>
      <div className="space-y-1.5 text-sm text-ash">{children}</div>
    </div>
  );
}

/** Enlace de red con su logo. El nombre de la red va como texto, no el handle. */
function RedSocial({
  href,
  icono,
  children,
}: {
  href?: string;
  icono: React.ReactNode;
  children: React.ReactNode;
}) {
  const contenido = (
    <>
      <span className="text-smoke transition-colors group-hover:text-casta">
        {icono}
      </span>
      {children}
    </>
  );

  if (!href) {
    return (
      <span className="flex items-center gap-2 text-smoke">{contenido}</span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-2 transition-colors hover:text-casta"
    >
      {contenido}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-char">
      <div className="mx-auto flex max-w-[1080px] flex-wrap gap-x-15 gap-y-7 px-5 pt-9.5 pb-7.5">
        <Block titulo="Horario">
          <p>Jueves a domingo</p>
          <p>6:00 – 11:00 PM</p>
        </Block>

        <Block titulo="Dónde">
          <p>{BUSINESS.formato}</p>
          {/* Un solo enlace con las dos líneas adentro: así el área para tocar
              es toda la fila, no dos renglones de 20 px. */}
          {BUSINESS.mapa && (
            <a
              href={BUSINESS.mapa}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col gap-0.5 transition-colors hover:text-casta"
            >
              <span className="flex items-center gap-2">
                <span className="text-smoke transition-colors group-hover:text-casta">
                  <MapPinIcon className="size-4.5" />
                </span>
                Cómo llegar
              </span>
              <span className="text-xs text-smoke">
                Presiona acá y Google Maps te guía.
              </span>
            </a>
          )}
        </Block>

        <Block titulo="Escríbenos">
          <RedSocial
            href={
              BUSINESS.whatsapp
                ? `https://wa.me/${BUSINESS.whatsapp}`
                : undefined
            }
            icono={<WhatsAppIcon className="size-4.5" />}
          >
            WhatsApp
          </RedSocial>
          <RedSocial
            href={`https://instagram.com/${BUSINESS.instagram}`}
            icono={<InstagramIcon className="size-4.5" />}
          >
            Instagram
          </RedSocial>
        </Block>
      </div>
    </footer>
  );
}
