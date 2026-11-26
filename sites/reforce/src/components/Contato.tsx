import Image from "next/image";
import { contato, marca } from "@/content/site";
import { imagens } from "@/lib/imagens";
import { Kicker, SetaDiagonal } from "./ui";

// Formulário que monta a mensagem para o time comercial e envia pelo WhatsApp ou por e-mail
// (o site não guarda nem envia dados para servidor próprio). Lógica em lib/interacoes.ts.
export function Contato() {
  const telefone = marca.telefone;
  return (
    <section id="contato" className="relative overflow-hidden bg-[radial-gradient(110%_80%_at_80%_0%,#06363d_0%,#021c20_50%,#011417_85%)] py-24 md:py-32">
      <Image
        src={imagens["rede-brasil"]}
        alt=""
        aria-hidden="true"
        sizes="50vw"
        className="pointer-events-none absolute -right-20 top-0 w-[44rem] max-w-none opacity-25"
      />
      <div className="container-site relative grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="min-w-0">
          <Kicker>{contato.kicker}</Kicker>
          <h2 data-split className="font-display texto-metal mt-6 text-[clamp(2.4rem,5.4vw,4.6rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
            {contato.titulo}
          </h2>
          <p data-reveal className="mt-6 max-w-md text-lg leading-relaxed text-mute">
            {contato.texto}
          </p>

          <ul className="mt-10 grid gap-3">
            <li>
              <a href={`mailto:${marca.email}`} className="cartao group flex items-center gap-4 p-4 transition hover:border-menta/50">
                <span className="selo-seta size-11">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2.5" />
                    <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-xs uppercase tracking-wider text-mute">E-mail comercial</span>
                  <span className="block truncate font-medium text-white">{marca.email}</span>
                </span>
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/${marca.whatsapp}`}
                target="_blank"
                rel="noopener"
                className="cartao group flex items-center gap-4 p-4 transition hover:border-menta/50"
              >
                <span className="selo-seta size-11">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.1 6.1l1.4-2.3L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-wider text-mute">Telefone e WhatsApp</span>
                  <span className="block font-medium text-white">{telefone}</span>
                  <span className="sr-only">(abre em nova aba)</span>
                </span>
              </a>
            </li>
            <li className="cartao flex items-center gap-4 p-4">
              <span className="selo-seta size-11">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
              </span>
              <span>
                <span className="block text-xs uppercase tracking-wider text-mute">Escritórios</span>
                <span className="block font-medium text-white">
                  {marca.escritorios.map((e) => `${e.cidade} – ${e.uf} (${e.tipo.toLowerCase()})`).join(" · ")}
                </span>
              </span>
            </li>
          </ul>
        </div>

        <form data-diagnostico className="cartao relative min-w-0 p-6 sm:p-9" aria-labelledby="form-titulo">
          <div className="flex items-center justify-between gap-4">
            <h3 id="form-titulo" className="font-display text-2xl font-medium text-white">
              Diagnóstico rápido
            </h3>
            <p className="text-xs text-mute">
              <span data-form-passos>0</span>/3 respondidas
            </p>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden="true">
            <span data-form-barra className="bg-degrade block h-full w-full origin-left scale-x-0 rounded-full transition-transform duration-500" />
          </div>

          <fieldset className="mt-8">
            <legend className="font-display text-sm font-semibold text-white">1. O que você precisa?</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {contato.demandas.map((d) => (
                <label key={d} className="chip-opcao relative">
                  <input type="checkbox" name="demanda" value={d} />
                  <span>
                    <span className="marca-chip" aria-hidden="true" />
                    {d}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="f-segmento" className="font-display text-sm font-semibold text-white">
                2. Segmento
              </label>
              <select id="f-segmento" name="segmento" className="campo mt-2" defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {contato.segmentos.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-momento" className="font-display text-sm font-semibold text-white">
                3. Momento do projeto
              </label>
              <select id="f-momento" name="momento" className="campo mt-2" defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {contato.momentos.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="f-nome" className="text-sm font-medium text-nevoa">
                Nome <span className="text-laranja">*</span>
              </label>
              <input id="f-nome" name="nome" required autoComplete="name" className="campo mt-2" data-error="f-nome-erro" />
              <p id="f-nome-erro" className="campo-erro mt-1.5 items-center gap-1.5 text-xs text-[#ffab91]">
                <span aria-hidden="true">⚠</span> Erro: informe seu nome.
              </p>
            </div>
            <div>
              <label htmlFor="f-empresa" className="text-sm font-medium text-nevoa">
                Empresa <span className="text-laranja">*</span>
              </label>
              <input id="f-empresa" name="empresa" required autoComplete="organization" className="campo mt-2" data-error="f-empresa-erro" />
              <p id="f-empresa-erro" className="campo-erro mt-1.5 items-center gap-1.5 text-xs text-[#ffab91]">
                <span aria-hidden="true">⚠</span> Erro: informe a empresa.
              </p>
            </div>
            <div>
              <label htmlFor="f-cargo" className="text-sm font-medium text-nevoa">
                Cargo
              </label>
              <input id="f-cargo" name="cargo" autoComplete="organization-title" className="campo mt-2" />
            </div>
            <div>
              <label htmlFor="f-email" className="text-sm font-medium text-nevoa">
                E-mail corporativo <span className="text-laranja">*</span>
              </label>
              <input
                id="f-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                className="campo mt-2"
                data-error="f-email-erro"
                aria-invalid="false"
              />
              <p id="f-email-erro" className="campo-erro mt-1.5 items-center gap-1.5 text-xs text-[#ffab91]">
                <span aria-hidden="true">⚠</span> Erro: use o formato voce@empresa.com.br.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <label htmlFor="f-mensagem" className="text-sm font-medium text-nevoa">
              Conte rapidamente o desafio (opcional)
            </label>
            <textarea id="f-mensagem" name="mensagem" rows={3} className="campo mt-2 resize-y" placeholder="Ex.: parada geral em março, 20 dias, três contratadas…" />
          </div>

          <details className="group mt-6 rounded-2xl border border-white/[0.08] bg-abismo/40 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm text-mute">
              Ver a mensagem que será enviada
              <span className="transition group-open:rotate-180" aria-hidden="true">
                ▾
              </span>
            </summary>
            <pre data-form-previa className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-nevoa/90">
              Preencha o formulário para ver a mensagem.
            </pre>
          </details>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button type="submit" data-enviar="whatsapp" className="botao-marca justify-center sm:flex-1">
              <span className="seta-circulo" aria-hidden="true">
                <SetaDiagonal className="size-4" />
              </span>
              Enviar pelo WhatsApp
            </button>
            <button type="submit" data-enviar="email" className="botao-contorno justify-center sm:flex-1">
              Enviar por e-mail
            </button>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-mute">
            Os dados vão direto do seu aparelho para o WhatsApp ou o e-mail da Reforce; o site não os armazena. Veja a{" "}
            <a href="/politica-de-privacidade" className="underline decoration-white/30 underline-offset-2 hover:text-white">
              política de privacidade
            </a>
            .
          </p>
          <p data-form-aviso role="status" aria-live="polite" className="sr-only" />
        </form>
      </div>
    </section>
  );
}
