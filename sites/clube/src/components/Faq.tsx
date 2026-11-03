import { faq } from "@/content/site";
import { Cabecalho } from "./Cabecalho";

// Perguntas frequentes com <details>: abre e fecha com altura animada nos navegadores que suportam
// (globals.css) e funciona sem JavaScript. Desktop: título e suporte numa coluna que acompanha a rolagem,
// perguntas numeradas na outra.
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-titulo" className="relative py-24 md:py-32">
      <div className="container-site grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Cabecalho id="faq-titulo" titulo={faq.titulo} esquerda compacto />
          <div data-reveal className="mt-10 hidden rounded-[24px] border border-white/10 bg-graphite p-6 lg:block">
            <p className="font-expanded text-lg font-bold uppercase text-white">{faq.suporte.titulo}</p>
            <p className="mt-2 text-mute">{faq.suporte.texto}</p>
            <SuporteBotao className="mt-6" />
          </div>
        </div>
        <div>
          <div data-reveal="stagger" className="border-t border-white/10">
            {faq.itens.map((item, i) => (
              <details key={item.pergunta} name="faq" className="faq-item border-b border-white/10">
                <summary
                  data-cursor="Abrir"
                  className="flex cursor-pointer list-none items-center gap-5 py-6 text-left text-lg font-semibold text-white md:gap-6 md:text-xl"
                >
                  <span aria-hidden="true" className="font-expanded w-7 shrink-0 text-sm font-bold text-ouro">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1">{item.pergunta}</span>
                  <span
                    className="faq-sinal grid size-10 shrink-0 place-items-center rounded-full border border-white/15 text-ouro"
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="pb-7 pl-12 pr-14 leading-relaxed text-mute md:pl-[3.25rem] md:text-lg">{item.resposta}</p>
              </details>
            ))}
          </div>

          <div data-reveal className="mt-12 flex flex-col items-start gap-5 lg:hidden">
            <div>
              <p className="font-expanded text-lg font-bold uppercase text-white">{faq.suporte.titulo}</p>
              <p className="mt-1 text-mute">{faq.suporte.texto}</p>
            </div>
            <SuporteBotao />
          </div>
        </div>
      </div>
    </section>
  );
}

function SuporteBotao({ className = "" }: { className?: string }) {
  return (
    <a
      href={faq.suporte.link}
      target="_blank"
      rel="noopener"
      data-cta="suporte"
      data-cursor="WhatsApp"
      className={`inline-flex shrink-0 items-center gap-2.5 rounded-full border border-verde/40 bg-verde/10 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-verde/20 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-4 text-verde" fill="currentColor" aria-hidden="true">
        <path d="M12 2.2A9.7 9.7 0 0 0 3.7 16.9L2.3 21.8l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z" />
      </svg>
      {faq.suporte.botao}
      <span className="sr-only">(abre o WhatsApp em nova aba)</span>
    </a>
  );
}
