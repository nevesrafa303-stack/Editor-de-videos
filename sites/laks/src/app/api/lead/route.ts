import { leadQualificado, rastreioChaves, validarLead } from "@/lib/lead";

const MAX_BYTES = 8 * 1024;
const JANELA_MS = 10 * 60 * 1000;
const MAX_POR_JANELA = 5;
const TEMPO_MINIMO_MS = 2500;

// Limite por IP em memória: é por instância (best effort), suficiente contra repetição boba.
const tentativas = new Map<string, number[]>();

function excedeuLimite(ip: string) {
  const agora = Date.now();
  const recentes = (tentativas.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  recentes.push(agora);
  tentativas.set(ip, recentes);
  if (tentativas.size > 5000) {
    for (const [chave, lista] of tentativas) {
      if (lista.every((t) => agora - t >= JANELA_MS)) tentativas.delete(chave);
    }
  }
  return recentes.length > MAX_POR_JANELA;
}

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function hostDe(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function texto(v: unknown, max: number) {
  return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const origem = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origem && host && hostDe(origem) !== host) {
    return json({ ok: false, erro: "origem" }, 403);
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ ok: false, erro: "formato" }, 415);
  }

  const bruto = await request.text();
  if (bruto.length > MAX_BYTES) return json({ ok: false, erro: "tamanho" }, 413);

  let corpo: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(bruto);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    corpo = parsed as Record<string, unknown>;
  } catch {
    return json({ ok: false, erro: "formato" }, 400);
  }

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || request.headers.get("x-real-ip") || "anon";
  if (excedeuLimite(ip)) return json({ ok: false, erro: "limite" }, 429);

  const { lead, erros } = validarLead(corpo);
  if (!lead) return json({ ok: false, erro: "validacao", erros }, 422);

  const qualificado = leadQualificado(lead);

  // Robôs: campo escondido preenchido ou envio rápido demais. Responde como sucesso e descarta.
  const tempo = typeof corpo.t === "number" ? corpo.t : 0;
  if (texto(corpo.website, 200) || tempo < TEMPO_MINIMO_MS) return json({ ok: true, qualificado });

  const rastreioEntrada = (corpo.rastreio ?? {}) as Record<string, unknown>;
  const rastreio = Object.fromEntries(
    rastreioChaves.map((k) => [k, texto(rastreioEntrada[k], 300)]).filter(([, v]) => v),
  );

  const payload = {
    ...lead,
    qualificado,
    origem: "site",
    pagina: texto(corpo.pagina, 500),
    referrer: texto(corpo.referrer, 500),
    rastreio,
    recebido_em: new Date().toISOString(),
  };

  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (!webhook) {
    if (process.env.NODE_ENV === "production") {
      console.error("[lead] LEAD_WEBHOOK_URL não configurada; lead não entregue.");
      return json({ ok: false, erro: "indisponivel" }, 503);
    }
    console.info("[lead] (dev, sem webhook)", payload);
    return json({ ok: true, qualificado });
  }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.LEAD_WEBHOOK_TOKEN) headers.Authorization = `Bearer ${process.env.LEAD_WEBHOOK_TOKEN}`;
    const r = await fetch(webhook, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
  } catch (e) {
    console.error("[lead] falha ao entregar no webhook:", e instanceof Error ? e.message : e);
    return json({ ok: false, erro: "entrega" }, 502);
  }

  return json({ ok: true, qualificado });
}
