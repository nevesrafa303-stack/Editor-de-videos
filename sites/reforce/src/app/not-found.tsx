import Link from "next/link";

export default function NotFound() {
  return (
    <main id="conteudo" className="container-site grid min-h-dvh place-content-center gap-6 text-center">
      <p className="kicker justify-center">Erro 404</p>
      <h1 className="font-display texto-metal text-[clamp(2.4rem,6vw,4.5rem)] font-semibold leading-tight">
        Esta página saiu do cronograma.
      </h1>
      <Link href="/" className="botao-contorno mx-auto">
        Voltar ao início
      </Link>
    </main>
  );
}
