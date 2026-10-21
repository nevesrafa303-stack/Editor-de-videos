import { manifesto } from "@/content/site";

// Cena fixa: a tela segura enquanto as palavras acendem com a rolagem (ver src/lib/motion.ts).
export function Manifesto() {
  const palavras = manifesto.antes.split(" ");
  return (
    <section aria-labelledby="manifesto-titulo" data-manifesto className="relative">
      <div data-manifesto-pin className="container-site flex min-h-[100svh] flex-col justify-center py-24">
        <h2 id="manifesto-titulo" className="sr-only">
          O problema das corretoras com marketing digital
        </h2>
        <p className="font-expanded max-w-[20ch] text-[clamp(1.55rem,5.6vw,4rem)] font-semibold leading-[1.12] tracking-tight text-white md:max-w-[24ch]">
          {palavras.map((p, i) => (
            <span key={i} className="manifesto-w">
              {p}
              {i < palavras.length - 1 ? " " : ""}
            </span>
          ))}
        </p>
        <p
          data-virada
          className="font-expanded mt-10 max-w-[20ch] text-[clamp(1.55rem,5.6vw,4rem)] font-bold uppercase leading-[1.02] tracking-tight text-laranja md:mt-14"
        >
          {manifesto.virada}
        </p>
      </div>
    </section>
  );
}
