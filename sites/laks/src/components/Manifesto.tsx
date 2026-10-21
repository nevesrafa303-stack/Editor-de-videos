import { manifesto } from "@/content/site";
import { Eyebrow } from "./ui";

export function Manifesto() {
  const palavras = manifesto.antes.split(" ");
  return (
    <section aria-labelledby="manifesto-titulo" data-manifesto className="relative pb-24 pt-8 md:pb-40 md:pt-16">
      <div className="container-site">
        <Eyebrow numero="02">O jogo hoje</Eyebrow>
        <h2 id="manifesto-titulo" className="sr-only">
          O problema das corretoras com marketing digital
        </h2>
        <p className="font-expanded mt-10 max-w-[22ch] text-[clamp(1.6rem,3.9vw,3.6rem)] font-semibold leading-[1.12] tracking-tight text-white md:max-w-[26ch]">
          {palavras.map((p, i) => (
            <span key={i} className="manifesto-w">
              {p}
              {i < palavras.length - 1 ? " " : ""}
            </span>
          ))}
        </p>
        <p data-virada className="font-expanded mt-14 text-[clamp(1.6rem,3.9vw,3.6rem)] font-bold uppercase leading-[1.05] tracking-tight text-laranja md:mt-20">
          {manifesto.virada}
        </p>
      </div>
    </section>
  );
}
