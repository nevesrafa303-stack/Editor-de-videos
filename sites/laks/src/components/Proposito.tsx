import { proposito } from "@/content/site";

// Faixa laranja com as três palavras do propósito correndo em sentidos alternados (data-kinetic).
export function Proposito() {
  return (
    <section aria-labelledby="proposito-titulo" className="relative overflow-hidden bg-laranja py-20 text-ink md:py-28">
      <h2 id="proposito-titulo" className="sr-only">
        Nosso propósito: {proposito.palavras.join(", ")}
      </h2>
      <div aria-hidden="true" className="font-expanded text-[clamp(3.6rem,17vw,15rem)] font-black uppercase leading-[0.86] tracking-tight">
        {proposito.palavras.map((p, i) => (
          <p
            key={p}
            data-kinetic={i % 2 ? "direita" : "esquerda"}
            className={`w-max whitespace-nowrap ${i % 2 ? "ml-[18vw]" : "-ml-[2vw]"}`}
          >
            {p}
          </p>
        ))}
      </div>
      <p data-reveal className="container-site mt-10 max-w-xl text-lg font-semibold leading-snug md:mt-14 md:text-2xl">
        {proposito.complemento}
      </p>
    </section>
  );
}
