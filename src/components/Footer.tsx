import { BUSINESS } from "@/lib/config";

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
      <div className="space-y-1 text-sm text-ash [&_a]:block [&_a]:transition-colors hover:[&_a]:text-casta">
        {children}
      </div>
    </div>
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
          <p>{BUSINESS.zona}</p>
          <p>{BUSINESS.ciudad}</p>
        </Block>

        <Block titulo="Escríbenos">
          {BUSINESS.whatsapp ? (
            <a
              href={`https://wa.me/${BUSINESS.whatsapp}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          ) : (
            <span className="block text-smoke">WhatsApp</span>
          )}
          <a
            href={`https://instagram.com/${BUSINESS.instagram}`}
            target="_blank"
            rel="noreferrer"
          >
            @{BUSINESS.instagram}
          </a>
        </Block>
      </div>
    </footer>
  );
}
