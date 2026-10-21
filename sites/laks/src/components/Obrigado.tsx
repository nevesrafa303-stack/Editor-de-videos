import Link from "next/link";
import { depoimentos, empresa } from "@/content/site";
import { Footer } from "./Footer";
import { Logo } from "./Logo";
import { ObrigadoEvento } from "./ObrigadoEvento";
import { Cta } from "./ui";
import { VideoCard } from "./VideoCard";

const passos = [
  {
    titulo: "Fique de olho no WhatsApp",
    texto: "Entraremos em contato em até 24h (1 dia útil) pelo WhatsApp, com DDD 47 ou 48, e por ligação.",
  },
  {
    titulo: "Confira o seu número",
    texto: "Certifique-se de que cadastrou o número corretamente. É por ele que o especialista vai falar com você.",
  },
  {
    titulo: "Horário de atendimento",
    texto: `${empresa.horario}.`,
  },
];

const instagram = empresa.redes.find((r) => r.nome === "Instagram")!.url;

export function Obrigado({ qualificado }: { qualificado: boolean }) {
  const videos = depoimentos.videos.filter((v) => v.id === "mybro-silvio-toni" || v.id === "malta-nardelli");
  return (
    <>
      <header className="container-site flex h-20 items-center">
        <Link href="/" aria-label="LAKS Company, página inicial" className="text-fog">
          <Logo className="h-6 w-auto" />
        </Link>
      </header>
      <main id="conteudo" className="container-site pb-24 pt-10 md:pt-16">
        <ObrigadoEvento qualificado={qualificado} />
        <div className="grid gap-16 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-laranja/40 bg-laranja/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-laranja">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Cadastro recebido
            </p>
            <h1 className="font-expanded mt-6 text-[clamp(2.2rem,5.4vw,4.6rem)] font-bold uppercase leading-[0.95] tracking-tight text-white">
              Obrigado! <span className="text-laranja">Bora acelerar.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-mute">
              Recebemos o seu cadastro para uma reunião com o nosso time de especialistas. Veja como funcionam os próximos passos.
            </p>
            <ol className="mt-10 grid gap-4">
              {passos.map((p, i) => (
                <li key={p.titulo} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <span className="font-expanded grid size-10 shrink-0 place-items-center rounded-full bg-laranja text-sm font-bold text-ink">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{p.titulo}</p>
                    <p className="mt-1 text-mute">{p.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Cta href={instagram} target="_blank" rel="noopener noreferrer" className="mt-10" data-cta="obrigado-instagram">
              Seguir a LAKS no Instagram
            </Cta>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-mute">Enquanto isso, ouça quem já acelera com a LAKS</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {videos.map((v) => (
                <VideoCard key={v.id} {...v} />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer ancoras={false} />
    </>
  );
}
