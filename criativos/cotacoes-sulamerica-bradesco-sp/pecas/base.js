// Comum às peças: formato (feed ou story, pelo #hash), texto legal por cotação, logos, ícones e window.__ready para o render.
// <body data-operadora="sula|bradesco">. Conteúdo fixo deste arquivo (sem entrada externa).

// Observações do CLAUDE.md, texto exato.
export const OBS = {
  valor: 'Valores sujeitos à faixa etária e região.',
  referenciais: 'Valores referenciais sujeitos às regras da operadora.',
  perfil: 'Os valores podem variar conforme perfil do beneficiário.',
  cobertura: 'Cobertura e rede sujeitas à modalidade contratada.',
  elegibilidade: 'Consulte condições e elegibilidade.',
  analise: 'Condições sujeitas à análise comercial.',
  rede: 'A rede credenciada pode variar conforme plano contratado.',
  hospital: 'Consulte a disponibilidade da rede hospitalar.',
  imagem: 'Imagem meramente ilustrativa.',
};

// Cotações enviadas pelo cliente em 04/11/2026 (3 vidas, São Paulo, enfermaria, sem coparticipação).
const COTACAO = {
  sula: {
    base: '*Valor mensal para 3 vidas (1 de até 18 anos e 2 de 34 a 38 anos), plano SulAmérica Direto Nacional, enfermaria, ' +
      'sem coparticipação, São Paulo (SP): R$ 1.556,49 + IOF de 2,38% (R$ 37,05). Cotação válida até 19/12/2026.',
    rede: 'Hospitais citados como exemplos da rede de referência do Direto Nacional em SP (BP: internação e pronto-socorro; ' +
      'São Luiz Jabaquara: internação).',
    ans: 'Sul América Companhia de Seguro Saúde · ANS nº 006246.',
  },
  bradesco: {
    base: '*Parcela mensal para 3 vidas (sócios e diretores), plano Bradesco Saúde Efetivo Plus, enfermaria, sem coparticipação, ' +
      'São Paulo (SP), conforme cotação de 04/11/2026: R$ 2.307,10 + IOF de 2,38%.',
    rede: 'Hospitais citados com acomodação em enfermaria, conforme material oficial do Efetivo Plus (versão agosto/2026).',
    ans: 'Bradesco Saúde S.A. · ANS nº 005711.',
  },
};

const traco = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
export const ICONES = {
  seta: `<svg viewBox="0 0 24 24" ${traco} stroke-width="2.8"><path d="M7 17L17 7M9 7h8v8"/></svg>`,
  maleta: `<svg viewBox="0 0 24 24" ${traco} stroke-width="2.2"><rect x="3" y="7.5" width="18" height="12.5" rx="2"/><path d="M9 7.5V5.8A1.6 1.6 0 0 1 10.6 4.2h2.8A1.6 1.6 0 0 1 15 5.8v1.7M3 12.8h18"/></svg>`,
  check: `<svg viewBox="0 0 24 24" ${traco} stroke-width="3"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
};

export async function montar() {
  document.body.classList.add(location.hash === '#story' ? 'story' : 'feed');
  const c = COTACAO[document.body.dataset.operadora];
  const legal = [c.base, c.rede, OBS.referenciais, OBS.perfil, OBS.cobertura, OBS.elegibilidade, OBS.analise, OBS.rede, OBS.hospital,
    OBS.imagem, c.ans].join(' ');
  document.querySelectorAll('.legal').forEach(el => { el.textContent = legal; });
  document.querySelectorAll('.nota-preco').forEach(el => { el.textContent = OBS.valor; });
  // ícones e logos: SVG fixos deste projeto (sem entrada externa)
  document.querySelectorAll('[data-icone]').forEach(el => { el.classList.add('icone'); el.insertAdjacentHTML('beforeend', ICONES[el.dataset.icone]); });
  for (const el of document.querySelectorAll('.logo[data-marca]')) {
    const m = el.dataset.marca;
    if (m === 'bradesco') el.innerHTML = await (await fetch('../assets/marca/bradesco-saude.svg')).text();
    else el.innerHTML = `<img alt="SulAmérica" src="../assets/marca/${m === 'sula' ? 'sulamerica' : 'sulamerica-branco'}.png">`;
  }
  document.body.offsetHeight;
  await Promise.all(['900 40px Mont', '800 40px Mont', '400 20px Poppins', '500 20px Poppins', '600 20px Poppins', '700 20px Poppins',
    '800 20px Poppins'].map(f => document.fonts.load(f)));
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  window.__ready = true;
}
