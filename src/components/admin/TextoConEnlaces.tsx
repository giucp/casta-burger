/**
 * Texto plano donde las URLs (la ubicación de Maps del cliente, por ejemplo)
 * se vuelven enlaces tocables. Todo lo demás queda como texto.
 */
export function TextoConEnlaces({ texto }: { texto: string }) {
  const partes = texto.split(/(https?:\/\/\S+)/g);

  return (
    <>
      {partes.map((parte, i) =>
        /^https?:\/\//.test(parte) ? (
          <a
            key={i}
            href={parte}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-dotted underline-offset-2 hover:text-casta"
          >
            {parte.includes("maps") ? "Ver ubicación en el mapa" : parte}
          </a>
        ) : (
          <span key={i}>{parte}</span>
        ),
      )}
    </>
  );
}
