"use client";

import { useEffect, useState } from "react";
import { rastreioChaves } from "@/lib/lead";
import {
  CONSENT_OPEN_EVENT,
  type Consentimento,
  guardarRastreio,
  lerConsentimento,
  salvarConsentimento,
  track,
} from "@/lib/tracking";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;
const temRastreio = Boolean(GTM_ID || PIXEL_ID || CLARITY_ID);

// O GTM espera o objeto `arguments` (não um array), como no snippet oficial do gtag.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function gtag(..._args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

function injetar(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function carregarGtm(id: string) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  injetar(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`);
}

function carregarPixel(id: string) {
  if (window.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) (fbq.callMethod as (...a: unknown[]) => void)(...args);
    else fbq.queue!.push(args);
  } as NonNullable<Window["fbq"]>;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;
  injetar("https://connect.facebook.net/en_US/fbevents.js");
  fbq("init", id);
  fbq("track", "PageView");
}

function carregarClarity(id: string) {
  if (window.clarity) return;
  const clarity = function (...args: unknown[]) {
    (clarity.q = clarity.q || []).push(args);
  } as NonNullable<Window["clarity"]>;
  window.clarity = clarity;
  injetar(`https://www.clarity.ms/tag/${encodeURIComponent(id)}`);
}

function aplicar(c: Consentimento) {
  const estado = c === "aceito" ? "granted" : "denied";
  gtag("consent", "update", {
    ad_storage: estado,
    ad_user_data: estado,
    ad_personalization: estado,
    analytics_storage: estado,
  });
  if (c === "aceito") {
    if (PIXEL_ID) carregarPixel(PIXEL_ID);
    if (CLARITY_ID) carregarClarity(CLARITY_ID);
  }
}

export function Tracking() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    guardarRastreio(rastreioChaves);
    const onClick = (e: MouseEvent) => {
      const cta = (e.target as Element | null)?.closest<HTMLElement>("[data-cta]");
      if (cta) track("cta_clique", { local: cta.dataset.cta });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!temRastreio) return;

    gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      wait_for_update: 500,
    });
    const salvo = lerConsentimento();
    if (salvo) aplicar(salvo);
    if (GTM_ID) carregarGtm(GTM_ID);
    // Mostrar o aviso depois da primeira pintura: não compete com o hero.
    const t = salvo ? undefined : window.setTimeout(() => setAberto(true), 1200);

    const abrir = () => setAberto(true);
    window.addEventListener(CONSENT_OPEN_EVENT, abrir);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener(CONSENT_OPEN_EVENT, abrir);
    };
  }, []);

  if (!temRastreio || !aberto) return null;

  const escolher = (c: Consentimento) => {
    salvarConsentimento(c);
    aplicar(c);
    setAberto(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-xl rounded-2xl border border-white/10 bg-graphite/95 p-4 text-sm text-mute shadow-2xl shadow-black/60 backdrop-blur md:bottom-5 md:left-5 md:right-auto md:mx-0 md:max-w-[25rem] md:p-5"
    >
      <p>
        Usamos cookies para medir e melhorar nossos anúncios. Você escolhe se aceita.{" "}
        <a href="/politica-de-privacidade" className="text-fog underline underline-offset-2 hover:text-white">
          Política de privacidade
        </a>
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => escolher("recusado")}
          className="flex-1 rounded-full border border-white/15 px-4 py-2.5 font-semibold text-fog transition hover:border-white/40"
        >
          Recusar
        </button>
        <button
          type="button"
          onClick={() => escolher("aceito")}
          className="flex-1 rounded-full bg-laranja px-4 py-2.5 font-semibold text-ink transition hover:bg-laranja-claro"
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
