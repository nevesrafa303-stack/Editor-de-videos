import { evento, informacoes } from "@/content/site";
import { Cabecalho } from "./Cabecalho";
import { Contagem } from "./Contagem";
import { Logo, Simbolo } from "./Logo";

// Convite para a agenda (.ics) gerado no build, com os dados do evento.
function convite() {
  const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Clube das Agencias//Imersao//PT-BR",
    "BEGIN:VEVENT",
    `UID:imersao-cda-${evento.inicio.slice(0, 10)}@clubedasagencias.com.br`,
    `DTSTAMP:${utc(evento.inicio)}`,
    `DTSTART:${utc(evento.inicio)}`,
    `DTEND:${utc(evento.fim)}`,
    `SUMMARY:${evento.nome}`,
    `LOCATION:${evento.local}\\, ${evento.cidade}`,
    `DESCRIPTION:${evento.horario}. Credenciamento ${evento.credenciamento.toLowerCase()}.`,
    "URL:https://clubedasagencias.com.br",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(linhas.join("\r\n"))}`;
}

// Código de barras decorativo, sempre igual para o mesmo texto.
function CodigoBarras({ semente, className = "" }: { semente: string; className?: string }) {
  let h = 2166136261;
  for (const c of semente) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const barras: { x: number; w: number }[] = [];
  let x = 0;
  while (x < 116) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const w = 1 + (Math.abs(h) % 3);
    barras.push({ x, w });
    x += w + 1 + ((Math.abs(h) >>> 4) % 3);
  }
  return (
    <svg viewBox="0 0 120 36" preserveAspectRatio="none" className={className} aria-hidden="true">
      {barras.map((b) => (
        <rect key={b.x} x={b.x} y="0" width={b.w} height="36" fill="currentColor" />
      ))}
    </svg>
  );
}

// "O que você precisa saber" como o próprio ingresso do evento: corpo com as informações e canhoto destacável.
// Inclina com o mouse e os valores embaralham até formar o texto (src/lib/motion.ts).
export function Informacoes() {
  const [data, horario, credenciamento, local, paraQuem] = informacoes.campos;
  return (
    <section id="informacoes" aria-labelledby="info-titulo" className="relative overflow-clip border-y border-white/10 bg-carbon py-24 md:py-32">
      <div className="container-site">
        <Cabecalho id="info-titulo" titulo={informacoes.titulo} />

        <div data-reveal className="mx-auto mt-12 max-w-5xl [perspective:1600px] md:mt-16">
          <article
            data-bilhete
            className="bilhete relative grid overflow-hidden rounded-[28px] bg-papel text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)] md:grid-cols-[minmax(0,1fr)_16rem]"
            style={{ ["--corte" as string]: "calc(100% - 16rem)", ["--corte-y" as string]: "calc(100% - 13.5rem)" }}
          >
            <div className="p-7 md:p-10">
              <div className="flex items-center justify-between gap-4">
                <Logo className="h-9 w-auto text-ink md:h-11" />
                <p className="rounded-full border border-ink/20 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink/70">
                  Presencial
                </p>
              </div>
              <dl className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 md:mt-10">
                {[data, horario, credenciamento, local].map((c) => (
                  <div key={c.rotulo} className="border-t border-ink/15 pt-3">
                    <dt className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-ink/60">{c.rotulo}</dt>
                    <dd data-embaralhar className="font-expanded mt-1.5 text-base font-bold uppercase leading-snug md:text-lg">
                      {c.valor}
                    </dd>
                  </div>
                ))}
                <div className="border-t border-ink/15 pt-3 sm:col-span-2">
                  <dt className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-ink/60">{paraQuem.rotulo}</dt>
                  <dd className="mt-1.5 text-base font-semibold leading-snug md:text-lg">{paraQuem.valor}</dd>
                </div>
              </dl>
            </div>

            <aside className="relative flex flex-col items-center justify-between gap-5 border-t-2 border-dashed border-ink/25 bg-[#e8e5df] p-7 text-center md:border-l-2 md:border-t-0 md:p-8">
              <Simbolo id="bilhete-simbolo" className="size-12" />
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-ink/60">Imersão</p>
                <p className="font-expanded mt-1 text-3xl font-black uppercase leading-none">{evento.datasCurtas}</p>
                <p className="mt-2 text-sm font-semibold text-ink/70">{evento.cidade}</p>
                <div data-contagem={evento.inicio} hidden className="mt-3">
                  <p data-contagem-texto className="font-expanded text-xs font-bold uppercase text-brasa" />
                  <Contagem />
                </div>
              </div>
              <CodigoBarras semente={evento.nome} className="h-10 w-36 text-ink" />
            </aside>
            <span aria-hidden="true" className="ingresso-brilho pointer-events-none absolute inset-0" />
          </article>
        </div>

        <div data-reveal className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href={convite()}
            download="imersao-clube-das-agencias.ics"
            data-cta="agenda"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-ouro/60"
          >
            <svg viewBox="0 0 24 24" className="size-4 text-ouro" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
              <path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5" />
            </svg>
            Adicionar à agenda
          </a>
          <a
            href={evento.mapa}
            target="_blank"
            rel="noopener"
            data-cta="mapa"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-ouro/60"
          >
            <svg viewBox="0 0 24 24" className="size-4 text-ouro" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
              <circle cx="12" cy="10" r="2.3" />
            </svg>
            Ver no mapa
            <span className="sr-only">(abre em nova aba)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
