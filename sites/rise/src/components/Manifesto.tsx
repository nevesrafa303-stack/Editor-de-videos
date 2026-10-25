import Image from "next/image";
import { manifesto } from "@/content/site";
import palco from "@/assets/img/hermano-palco-pb.webp";

// "A RISE não é fuga. É método.": a tela fixa, um risco laranja corta "fuga" e "método" sobe em dourado
// (data-manifesto em src/lib/motion.ts). Sem animação, a frase aparece no estado final.
export function Manifesto() {
  return (
    <section data-manifesto aria-labelledby="manifesto-titulo" className="relative bg-ink">
      <div data-manifesto-palco className="relative isolate flex min-h-[100svh] items-end overflow-hidden py-24 md:items-center">
        <div className="absolute inset-0 -z-10">
          <Image
            src={palco}
            alt="Hermano no palco, em preto e branco"
            fill
            sizes="100vw"
            data-manifesto-foto
            className="object-cover object-[68%_center] opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/70 md:bg-gradient-to-r md:from-ink md:via-ink/70 md:to-transparent" />
        </div>

        <div className="container-site">
          <h2
            id="manifesto-titulo"
            className="font-expanded text-[clamp(2.5rem,9vw,8.2rem)] font-bold uppercase leading-[0.92] tracking-tight text-white"
          >
            <span className="block">{manifesto.nao}</span>
            <span data-fuga className="relative inline-block opacity-40">
              {manifesto.fuga}
              <span
                data-fuga-risco
                aria-hidden="true"
                className="absolute -inset-x-[3%] top-[48%] h-[0.08em] origin-left rounded-full bg-brasa"
              />
            </span>
            <span className="block">
              <span className="inline-block overflow-hidden pb-[0.06em] align-bottom">
                <span data-metodo-palavra className="inline-block">
                  {manifesto.e}
                </span>
              </span>{" "}
              <span className="inline-block overflow-hidden pb-[0.06em] align-bottom">
                <span data-metodo-palavra className="texto-ouro brilho inline-block">
                  {manifesto.metodo}
                </span>
              </span>
            </span>
          </h2>
          <p data-manifesto-texto className="mt-8 max-w-xl text-lg leading-relaxed text-fog md:text-xl">
            {manifesto.texto}
          </p>
        </div>
      </div>
    </section>
  );
}
