// Comum às peças: formato (feed ou story, pelo #hash), texto legal por hospital, ícones e window.__ready para o render.
// <body data-hosp="vns|sl">. Conteúdo fixo deste arquivo (sem entrada externa).

// Observações do CLAUDE.md, texto exato.
const OBS = {
  rede: 'Consulte a disponibilidade da rede hospitalar.',
  varia: 'A rede credenciada pode variar conforme plano contratado.',
  cobertura: 'Cobertura e rede sujeitas à modalidade contratada.',
  elegibilidade: 'Consulte condições e elegibilidade.',
  analise: 'Condições sujeitas à análise comercial.',
  faixa: 'Valores sujeitos à faixa etária e região.',
  perfil: 'Os valores podem variar conforme perfil do beneficiário.',
  imagem: 'Imagem meramente ilustrativa.',
};
const PUBLICO = 'Exclusivo para CNPJ/MEI, a partir de 3 vidas, na capital de São Paulo.';

const HOSP = {
  vns: "Hospital Vila Nova Star (Rede D'Or), São Paulo (SP), citado como exemplo de rede; a disponibilidade varia conforme " +
    'operadora, plano e acomodação. Diferenciais conforme o site oficial do hospital (rededorsaoluiz.com.br/star/vilanovastar, 11/2026).',
  sl: "Hospital São Luiz Itaim (Rede D'Or), São Paulo (SP), citado como exemplo de rede; a disponibilidade varia conforme operadora, " +
    'plano e acomodação. ¹Datafolha "O Melhor de São Paulo" 2026 (classes A e B da capital), divulgado pela Rede D\'Or em 22/06/2026.',
};

const traco = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
export const ICONES = {
  seta: `<svg viewBox="0 0 24 24" ${traco} stroke-width="2.8"><path d="M7 17L17 7M9 7h8v8"/></svg>`,
  maleta: `<svg viewBox="0 0 24 24" ${traco} stroke-width="2.2"><rect x="3" y="7.5" width="18" height="12.5" rx="2"/><path d="M9 7.5V5.8A1.6 1.6 0 0 1 10.6 4.2h2.8A1.6 1.6 0 0 1 15 5.8v1.7M3 12.8h18"/></svg>`,
  check: `<svg viewBox="0 0 24 24" ${traco} stroke-width="3"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
  hospital: `<svg viewBox="0 0 24 24" ${traco} stroke-width="1.9"><path d="M4 21V6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5V21M2.5 21h19"/><path d="M12 8.2v5M9.5 10.7h5" stroke-width="2.2"/><path d="M10 21v-4h4v4"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" ${traco} stroke-width="2"><path d="M12 21.2s-7-6-7-11.4a7 7 0 0 1 14 0c0 5.4-7 11.4-7 11.4z"/><circle cx="12" cy="9.8" r="2.6"/></svg>`,
};

export async function montar() {
  document.body.classList.add(location.hash === '#story' ? 'story' : 'feed');
  const h = document.body.dataset.hosp;
  const legal = [HOSP[h], PUBLICO, OBS.rede, OBS.varia, OBS.cobertura, OBS.elegibilidade, OBS.analise, OBS.faixa, OBS.perfil, OBS.imagem].join(' ');
  document.querySelectorAll('.legal').forEach(el => { el.textContent = legal; });
  document.querySelectorAll('[data-icone]').forEach(el => { el.classList.add('icone'); el.insertAdjacentHTML('beforeend', ICONES[el.dataset.icone]); });
  document.body.offsetHeight;
  await Promise.all(['900 40px Mont', '800 40px Mont', '400 20px Poppins', '500 20px Poppins', '600 20px Poppins', '700 20px Poppins',
    '800 20px Poppins'].map(f => document.fonts.load(f)));
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  window.__ready = true;
}
