import Image from "next/image";
import { evento, informacoes } from "@/content/site";
import palco from "@/assets/img/palco-placas.webp";
import { Contagem } from "./Contagem";
import { Simbolo } from "./Logo";

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

// "O que você precisa saber" como um painel de embarque: os valores embaralham até formar o texto
// quando entram na tela (data-embaralhar em src/lib/motion.ts).
export function Informacoes() {
  return (
    <section id="informacoes" aria-labelledby="info-titulo" className="relative py-24 md:py-36">
      <div className="container-site grid items-center gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <div>
          <h2
            id="info-titulo"
            data-split
            className="font-expanded text-[clamp(1.9rem,4.2vw,3.6rem)] font-bold uppercase leading-[0.98] tracking-tight text-white"
          >
            {informacoes.titulo}
          </h2>

          <div data-reveal className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-graphite">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-ink/60 px-5 py-4 md:px-7">
              <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-fog">
                <Simbolo id="quadro-simbolo" className="size-5" />
                {evento.nome}
              </p>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ouro">
                <span className="relative flex size-2" aria-hidden="true">
                  <span className="absolute inset-0 animate-ping rounded-full bg-brasa/70 motion-reduce:hidden" />
                  <span className="relative size-2 rounded-full bg-brasa" />
                </span>
                Últimas vagas
              </p>
            </div>
            <dl className="divide-y divide-white/10">
              {informacoes.campos.map((c) => (
                <div key={c.rotulo} className="grid gap-1 px-5 py-4 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:items-baseline sm:gap-6 md:px-7 md:py-5">
                  <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-mute">{c.rotulo}</dt>
                  <dd data-embaralhar className="quadro-valor font-expanded text-base font-bold uppercase leading-snug text-white md:text-xl">
                    {c.valor}
                  </dd>
                </div>
              ))}
            </dl>
            <div data-contagem={evento.inicio} hidden className="border-t border-white/10 px-5 py-4 md:px-7">
              <p data-contagem-texto className="font-expanded text-sm font-bold uppercase text-ouro" />
              <Contagem />
            </div>
          </div>

          <div data-reveal className="mt-6 flex flex-wrap gap-3">
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

        <figure data-reveal className="relative">
          <div className="overflow-hidden rounded-[28px]">
            <Image
              src={palco}
              alt="Mentorados da edição anterior no palco, segurando as placas de faturamento"
              sizes="(min-width: 1024px) 38vw, 92vw"
              data-parallax="10"
              className="h-auto w-full scale-110 object-cover"
            />
          </div>
          <figcaption className="mt-4 text-sm text-mute">Edição anterior: mentorados no palco com as placas de faturamento.</figcaption>
        </figure>
      </div>
    </section>
  );
}
