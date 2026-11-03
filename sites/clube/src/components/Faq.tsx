import { faq } from "@/content/site";
import { Cabecalho } from "./Cabecalho";

// Perguntas frequentes com <details>: abre e fecha com altura animada nos navegadores que suportam
// (globals.css) e funciona sem JavaScript. Coluna única, centralizada.
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-titulo" className="relative py-24 md:py-32">
      <div className="container-site">
        <Cabecalho id="faq-titulo" titulo={faq.titulo} />
        <div data-reveal="stagger" className="mx-auto mt-12 max-w-3xl border-t border-white/10 md:mt-14">
          {faq.itens.map((item) => (
            <details key={item.pergunta} name="faq" className="faq-item border-b border-white/10">
              <summary
                data-cursor="Abrir"
                className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left text-lg font-semibold text-white md:text-xl"
              >
                {item.pergunta}
                <span className="faq-sinal grid size-10 shrink-0 place-items-center rounded-full border border-white/15 text-ouro" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="pb-6 pr-14 leading-relaxed text-mute md:text-lg">{item.resposta}</p>
            </details>
          ))}
        </div>

        <div data-reveal className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-5 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <p className="font-expanded text-lg font-bold uppercase text-white">{faq.suporte.titulo}</p>
            <p className="mt-1 text-mute">{faq.suporte.texto}</p>
          </div>
          <a
            href={faq.suporte.link}
            target="_blank"
            rel="noopener"
            data-cta="suporte"
            data-cursor="WhatsApp"
            className="inline-flex shrink-0 items-center gap-2.5 rounded-full border border-verde/40 bg-verde/10 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-verde/20"
          >
            <svg viewBox="0 0 24 24" className="size-4 text-verde" fill="currentColor" aria-hidden="true">
              <path d="M12 2.2A9.7 9.7 0 0 0 3.7 16.9L2.3 21.8l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z" />
            </svg>
            {faq.suporte.botao}
            <span className="sr-only">(abre o WhatsApp em nova aba)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
