import { paraQuem } from "@/content/site";
import { Aplicar } from "./ui";

function Marca({ sim }: { sim: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`marca mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${sim ? "bg-ouro/15 text-ouro" : "bg-white/[0.06] text-mute"}`}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none">
        <path
          d={sim ? "M5 12.5l4.5 4.5L19 7.5" : "M7 7l10 10M17 7 7 17"}
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

// Duas colunas: quem deve aplicar e quem não deve. Cada item é "marcado" quando chega ao meio da tela.
export function ParaQuem() {
  const coluna = (sim: boolean) => {
    const c = sim ? paraQuem.sim : paraQuem.nao;
    return (
      <div
        className={`rounded-3xl border p-6 md:p-10 ${
          sim ? "border-ouro/20 bg-gradient-to-b from-ouro/[0.07] to-transparent" : "border-white/10 bg-white/[0.02]"
        }`}
      >
        <h3 className={`font-expanded text-xl font-bold uppercase md:text-2xl ${sim ? "text-white" : "text-fog"}`}>{c.titulo}</h3>
        <ul className="mt-6 divide-y divide-white/10">
          {c.itens.map((item) => (
            <li
              key={item}
              data-check
              className={`flex items-start gap-4 py-4 leading-snug md:text-lg ${sim ? "text-fog" : "text-mute"}`}
            >
              <Marca sim={sim} />
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <section id="para-quem" aria-labelledby="paraquem-titulo" className="py-24 md:py-36">
      <div className="container-site">
        <h2
          id="paraquem-titulo"
          data-split
          className="font-expanded text-[clamp(2rem,5vw,4rem)] font-bold uppercase leading-[0.96] tracking-tight text-white"
        >
          {paraQuem.titulo}
        </h2>
        <div className="mt-10 grid items-start gap-5 md:mt-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-6">
          {coluna(true)}
          {coluna(false)}
        </div>
        <div data-reveal className="mt-12 flex justify-center">
          <Aplicar local="para-quem" className="w-full sm:w-auto" />
        </div>
      </div>
    </section>
  );
}
