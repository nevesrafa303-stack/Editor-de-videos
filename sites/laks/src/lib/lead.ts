// Campos e regras do formulário de diagnóstico, compartilhados entre o navegador e a API.
// Os rótulos e opções são os mesmos do site anterior, para não quebrar relatórios do CRM.

export const opcoesConheceu = ["Indicação", "Anúncios", "Instagram", "Facebook", "Linkedin", "Google"] as const;

export const opcoesTrafego = [
  "Já contratei uma agência no passado",
  "Nunca fiz Anúncios",
  "Já fiz anúncios por conta própria",
  "Estou com uma agência, porém insatisfeito",
] as const;

export const opcoesFaturamento = [
  "Abaixo de R$10 mil",
  "R$10 mil a R$20 mil",
  "R$20 mil a R$ 50 mil",
  "R$50 mil a R$100 mil",
  "R$100 mil a R$500 mil",
  "R$500 mil a R$ 1 milhão",
  "Acima de R$ 1 milhão",
] as const;

// Abaixo disso o lead vai para /obrigado1; os demais para /obrigado2 (mesma regra do site anterior,
// que alimenta as conversões personalizadas das campanhas).
export const faturamentoNaoQualificado: readonly string[] = ["Abaixo de R$10 mil"];

export const rastreioChaves = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
] as const;

export type Lead = {
  nome: string;
  email: string;
  whatsapp: string;
  empresa: string;
  instagram: string;
  conheceu: (typeof opcoesConheceu)[number];
  trafego: (typeof opcoesTrafego)[number];
  faturamento: (typeof opcoesFaturamento)[number];
};

export type LeadErros = Partial<Record<keyof Lead, string>>;

// Tira caracteres de controle e < > (o CRM ou o e-mail de notificação podem renderizar HTML).
const limpar = (v: unknown, max: number) =>
  typeof v === "string"
    ? v.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
    : "";

export const soDigitos = (v: string) => v.replace(/\D/g, "");

export function formatarWhatsapp(v: string) {
  const d = soDigitos(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function normalizarInstagram(v: string) {
  const m = v.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  const user = (m ? m[1] : v).replace(/^@+/, "").trim();
  return user ? `@${user}` : "";
}

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export function validarLead(entrada: Record<string, unknown>): { lead?: Lead; erros: LeadErros } {
  const erros: LeadErros = {};
  const nome = limpar(entrada.nome, 120);
  const email = limpar(entrada.email, 160).toLowerCase();
  const whatsappDigitos = soDigitos(limpar(entrada.whatsapp, 30)).replace(/^55(?=\d{10,11}$)/, "");
  const empresa = limpar(entrada.empresa, 120);
  const instagram = normalizarInstagram(limpar(entrada.instagram, 120));
  const conheceu = limpar(entrada.conheceu, 60);
  const trafego = limpar(entrada.trafego, 80);
  const faturamento = limpar(entrada.faturamento, 40);

  if (nome.length < 3 || !nome.includes(" ")) erros.nome = "Informe nome e sobrenome.";
  if (!emailOk(email)) erros.email = "Informe um e-mail válido.";
  if (!/^[1-9]{2}9?\d{8}$/.test(whatsappDigitos)) erros.whatsapp = "Informe o WhatsApp com DDD.";
  if (empresa.length < 2) erros.empresa = "Informe o nome da corretora.";
  if (!/^@[A-Za-z0-9._]{1,30}$/.test(instagram)) erros.instagram = "Informe o @ da corretora.";
  if (!(opcoesConheceu as readonly string[]).includes(conheceu)) erros.conheceu = "Escolha uma opção.";
  if (!(opcoesTrafego as readonly string[]).includes(trafego)) erros.trafego = "Escolha uma opção.";
  if (!(opcoesFaturamento as readonly string[]).includes(faturamento)) erros.faturamento = "Escolha uma opção.";

  if (Object.keys(erros).length) return { erros };
  return {
    erros,
    lead: {
      nome,
      email,
      whatsapp: `+55${whatsappDigitos}`,
      empresa,
      instagram,
      conheceu: conheceu as Lead["conheceu"],
      trafego: trafego as Lead["trafego"],
      faturamento: faturamento as Lead["faturamento"],
    },
  };
}

export const leadQualificado = (lead: Pick<Lead, "faturamento">) =>
  !faturamentoNaoQualificado.includes(lead.faturamento);
