"use client";

import { type FormEvent, type ReactNode, useRef, useState } from "react";
import {
  type LeadErros,
  formatarWhatsapp,
  leadQualificado,
  opcoesConheceu,
  opcoesFaturamento,
  opcoesTrafego,
  validarLead,
} from "@/lib/lead";
import { lerRastreio, track } from "@/lib/tracking";
import { Seta } from "./ui";

type Estado = "ocioso" | "enviando" | "erro";

const campoBase =
  "w-full rounded-xl border bg-white/[0.04] px-4 py-3.5 text-[0.95rem] text-white placeholder:text-white/35 outline-none transition focus:border-laranja focus:bg-white/[0.07] focus:ring-4 focus:ring-laranja/15";

function Campo({
  nome,
  rotulo,
  erro,
  children,
}: {
  nome: string;
  rotulo: string;
  erro?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`f-${nome}`} className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-mute">
        {rotulo}
      </label>
      {children}
      {erro && (
        <p id={`f-${nome}-erro`} className="text-sm text-laranja-claro">
          {erro}
        </p>
      )}
    </div>
  );
}

export function LeadForm() {
  const [erros, setErros] = useState<LeadErros>({});
  const [estado, setEstado] = useState<Estado>("ocioso");
  const [mensagem, setMensagem] = useState("");
  const [whats, setWhats] = useState("");
  const inicio = useRef<number>(0);
  const comecou = useRef(false);

  const marcarInicio = () => {
    if (!inicio.current) inicio.current = Date.now();
    if (!comecou.current) {
      comecou.current = true;
      track("form_inicio");
    }
  };

  const attrs = (nome: keyof LeadErros) => ({
    id: `f-${nome}`,
    name: nome,
    "aria-invalid": erros[nome] ? true : undefined,
    "aria-describedby": erros[nome] ? `f-${nome}-erro` : undefined,
    className: `${campoBase} ${erros[nome] ? "border-laranja" : "border-white/10"}`,
  });

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (estado === "enviando") return;
    const form = e.currentTarget;
    const dados = Object.fromEntries(new FormData(form)) as Record<string, string>;

    const { lead, erros: errosLocais } = validarLead(dados);
    setErros(errosLocais);
    if (!lead) {
      const primeiro = Object.keys(errosLocais)[0];
      form.querySelector<HTMLElement>(`#f-${primeiro}`)?.focus();
      track("form_erro_validacao", { campos: Object.keys(errosLocais).join(",") });
      return;
    }

    setEstado("enviando");
    setMensagem("");
    const rastreio = lerRastreio();
    try {
      const r = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dados,
          t: inicio.current ? Date.now() - inicio.current : 0,
          rastreio,
          pagina: rastreio._pagina || window.location.href,
          referrer: rastreio._referrer || document.referrer,
        }),
      });
      const resposta = (await r.json().catch(() => ({}))) as { ok?: boolean; qualificado?: boolean; erros?: LeadErros };
      if (r.status === 422 && resposta.erros) {
        setErros(resposta.erros);
        setEstado("ocioso");
        return;
      }
      if (!r.ok || !resposta.ok) {
        throw new Error(r.status === 429 ? "limite" : "falha");
      }

      const qualificado = resposta.qualificado ?? leadQualificado(lead);
      const destino = qualificado ? "/obrigado2" : "/obrigado1";
      let foi = false;
      const ir = () => {
        if (foi) return;
        foi = true;
        window.location.assign(destino);
      };
      // Dá tempo para o GTM disparar as tags do evento antes de trocar de página.
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "lead_enviado",
        lead_qualificado: qualificado,
        faturamento: lead.faturamento,
        conheceu: lead.conheceu,
        trafego: lead.trafego,
        eventCallback: ir,
        eventTimeout: 1500,
      });
      window.setTimeout(ir, 1600);
    } catch (err) {
      setEstado("erro");
      setMensagem(
        err instanceof Error && err.message === "limite"
          ? "Recebemos muitas tentativas deste dispositivo. Aguarde alguns minutos e tente de novo."
          : "Não conseguimos enviar agora. Verifique a conexão e tente de novo em instantes.",
      );
      track("form_erro_envio");
    }
  }

  return (
    <form noValidate onSubmit={enviar} onFocusCapture={marcarInicio} className="grid gap-5" aria-describedby="form-aviso">
      {/* Armadilha para robôs: invisível para pessoas e leitores de tela. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="f-website">Não preencha</label>
        <input id="f-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Campo nome="nome" rotulo="Nome completo" erro={erros.nome}>
        <input {...attrs("nome")} type="text" autoComplete="name" placeholder="Seu nome e sobrenome" maxLength={120} required />
      </Campo>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo nome="email" rotulo="E-mail corporativo" erro={erros.email}>
          <input {...attrs("email")} type="email" autoComplete="email" inputMode="email" placeholder="voce@corretora.com.br" maxLength={160} required />
        </Campo>
        <Campo nome="whatsapp" rotulo="WhatsApp" erro={erros.whatsapp}>
          <input
            {...attrs("whatsapp")}
            type="tel"
            autoComplete="tel-national"
            inputMode="tel"
            placeholder="(47) 99999-9999"
            value={whats}
            onChange={(e) => setWhats(formatarWhatsapp(e.target.value))}
            required
          />
        </Campo>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo nome="empresa" rotulo="Nome da corretora" erro={erros.empresa}>
          <input {...attrs("empresa")} type="text" autoComplete="organization" placeholder="Nome da corretora" maxLength={120} required />
        </Campo>
        <Campo nome="instagram" rotulo="Instagram da empresa" erro={erros.instagram}>
          <input {...attrs("instagram")} type="text" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="@suacorretora" maxLength={120} required />
        </Campo>
      </div>

      <Campo nome="conheceu" rotulo="Como conheceu a LAKS?" erro={erros.conheceu}>
        <Select attrs={attrs("conheceu")} opcoes={opcoesConheceu} />
      </Campo>
      <Campo nome="trafego" rotulo="Já investiu em tráfego pago?" erro={erros.trafego}>
        <Select attrs={attrs("trafego")} opcoes={opcoesTrafego} />
      </Campo>
      <Campo nome="faturamento" rotulo="Faturamento mensal da empresa" erro={erros.faturamento}>
        <Select attrs={attrs("faturamento")} opcoes={opcoesFaturamento} />
      </Campo>

      <button
        type="submit"
        disabled={estado === "enviando"}
        className="group mt-2 inline-flex items-center justify-center gap-3 rounded-full bg-laranja px-7 py-4 text-base font-semibold text-ink shadow-[0_10px_40px_-10px] shadow-laranja/70 transition hover:bg-laranja-claro disabled:cursor-wait disabled:opacity-70"
      >
        {estado === "enviando" ? "Enviando..." : "Quero acelerar minha corretora"}
        <span className="grid size-7 place-items-center rounded-full bg-black/15 transition group-hover:translate-x-1">
          <Seta />
        </span>
      </button>

      <p role="status" aria-live="polite" className={mensagem ? "rounded-xl border border-laranja/40 bg-laranja/10 p-4 text-sm text-fog" : "sr-only"}>
        {mensagem}
      </p>
      <p id="form-aviso" className="text-xs leading-relaxed text-mute">
        Ao enviar, você concorda em ser contatado pela LAKS e com a nossa{" "}
        <a href="/politica-de-privacidade" className="underline underline-offset-2 hover:text-white">
          política de privacidade
        </a>
        .
      </p>
    </form>
  );
}

function Select({ attrs, opcoes }: { attrs: Record<string, unknown>; opcoes: readonly string[] }) {
  return (
    <div className="relative">
      <select {...attrs} defaultValue="" required className={`${attrs.className as string} appearance-none pr-12`}>
        <option value="" disabled>
          Selecione
        </option>
        {opcoes.map((o) => (
          <option key={o} value={o} className="bg-graphite text-white">
            {o}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 20 20" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-mute" fill="none" aria-hidden="true">
        <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
