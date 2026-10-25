import { estrutura } from "@/content/site";
import { Aplicar } from "./ui";

// "As agências não travam por falta de lead. Elas travam por falta de estrutura.": com a rolagem,
// a primeira frase apaga palavra por palavra e a segunda acende em dourado (data-preencher).
export function Estrutura() {
  const palavras = (frase: string, classe: string, attr: string) =>
    frase.split(" ").map((p, i, arr) => (
      <span key={i}>
        <span {...{ [attr]: "" }} className={`inline-block ${classe}`}>
          {p}
        </span>
        {i < arr.length - 1 ? " " : ""}
      </span>
    ));

  return (
    <section aria-labelledby="estrutura-titulo" className="relative overflow-clip border-y border-white/10 bg-carbon py-24 md:py-36">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-1/3 size-[36rem] rounded-full bg-brasa/10 blur-[120px]" />
      <div className="container-site relative">
        <h2
          id="estrutura-titulo"
          data-preencher
          className="font-expanded max-w-[20ch] text-[clamp(1.9rem,5.4vw,4.8rem)] font-bold uppercase leading-[1] tracking-tight"
        >
          <span className="block text-white">{palavras(estrutura.antes, "", "data-antes")}</span>
          <span className="mt-3 block">{palavras(estrutura.depois, "texto-ouro", "data-depois")}</span>
        </h2>

        <p data-reveal className="mt-14 text-sm font-semibold uppercase tracking-[0.2em] text-mute">
          {estrutura.intro}
        </p>
        <ol data-reveal="stagger" className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {estrutura.sintomas.map((s, i) => (
            <li key={s} className="flex flex-col justify-between gap-6 rounded-2xl border border-white/10 bg-ink/60 p-5 sm:min-h-40 sm:p-6">
              <span className="font-expanded text-sm font-bold text-brasa">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-lg font-semibold leading-snug text-white">{s}</span>
            </li>
          ))}
        </ol>

        <div data-reveal className="mt-14 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <p className="font-expanded max-w-xl text-xl font-bold uppercase leading-tight text-white md:text-2xl">{estrutura.fecho}</p>
          <Aplicar local="estrutura" className="w-full shrink-0 sm:w-auto" />
        </div>
      </div>
    </section>
  );
}
