import Image from "next/image";
import { quemSomos } from "@/content/site";
import banner from "@/assets/img/fundador-escritorio-banner.webp";
import polaroid from "@/assets/img/equipe-polaroid-balneario.webp";
import seloMeta from "@/assets/img/selo-meta-business-partners.webp";
import { Eyebrow } from "./ui";

export function QuemSomos() {
  const legenda = [quemSomos.fundador.nome, quemSomos.fundador.cargo].filter(Boolean).join(", ");
  return (
    <section id="quemsomos" aria-labelledby="quem-titulo" className="relative">
      <div className="relative isolate flex min-h-[88svh] items-end overflow-hidden md:items-center">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Image
            src={banner}
            alt=""
            fill
            sizes="100vw"
            data-parallax="10"
            className="scale-110 object-cover object-[68%_30%] md:object-[60%_30%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/30 md:bg-gradient-to-r md:from-ink md:via-ink/70 md:to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
        </div>
        <div className="container-site pb-16 pt-40 md:py-28">
          <div data-reveal className="max-w-xl">
            <Eyebrow numero="05">Quem somos</Eyebrow>
            <h2 id="quem-titulo" className="font-expanded mt-6 text-[clamp(2.2rem,5.4vw,5rem)] font-bold uppercase leading-[0.95] tracking-tight text-white">
              {quemSomos.lema}
            </h2>
            <p className="mt-6 leading-relaxed text-fog/85 md:text-lg">{quemSomos.texto}</p>
            {legenda && <p className="mt-8 text-xs uppercase tracking-[0.2em] text-mute">Na foto: {legenda}</p>}
          </div>
        </div>
      </div>

      <div className="container-site grid items-center gap-16 py-20 md:grid-cols-2 md:py-32">
        <div className="relative mx-auto w-full max-w-[24rem] md:max-w-[26rem]">
          <span aria-hidden="true" className="absolute -inset-10 -z-10 rounded-full bg-laranja/20 blur-3xl" />
          <div data-polaroid className="origin-top">
            <Image
              src={polaroid}
              alt="Time da LAKS de camisa laranja reunido na sede em Balneário Camboriú"
              sizes="(min-width: 768px) 26rem, 90vw"
              className="h-auto w-full rotate-[-3deg] drop-shadow-[0_40px_50px_rgba(0,0,0,.7)]"
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-mute">Nosso propósito</p>
          <p className="font-expanded mt-6 text-[clamp(1.9rem,8.6vw,3.4rem)] font-black uppercase leading-[0.92] tracking-tight md:text-[clamp(2rem,4.2vw,4.1rem)]">
            {quemSomos.proposito.map((p, i) => (
              <span key={p} data-proposito className={`block ${i === quemSomos.proposito.length - 1 ? "text-laranja" : "text-white"}`}>
                {p}
              </span>
            ))}
          </p>
          <p className="mt-6 text-lg text-mute">{quemSomos.propositoComplemento}</p>

          <dl className="mt-12 grid grid-cols-2 gap-6 border-t border-white/10 pt-8">
            <div>
              <dt className="text-sm text-mute">Especialistas no time</dt>
              <dd className="font-expanded mt-1 text-3xl font-bold text-white">70+</dd>
            </div>
            <div>
              <dt className="text-sm text-mute">Sede física</dt>
              <dd className="mt-1 font-semibold text-white">Balneário Camboriú, SC</dd>
            </div>
          </dl>
          <Image src={seloMeta} alt="Meta Business Partners" sizes="180px" className="mt-10 h-10 w-auto opacity-80" />
        </div>
      </div>
    </section>
  );
}
