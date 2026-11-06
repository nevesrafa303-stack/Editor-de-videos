// Comum às 9 peças: logos, ícones, rodapé legal por operadora e window.__ready para o render.
// <body data-operadora="amil|bradesco|sula" data-hospital="sim" data-foto="sim">
// Conteúdo fixo deste arquivo (sem entrada externa).

// Observações do CLAUDE.md, texto exato.
const OBS = {
  valor: 'Valores sujeitos à faixa etária e região.',
  referenciais: 'Valores referenciais sujeitos às regras da operadora.',
  perfil: 'Os valores podem variar conforme perfil do beneficiário.',
  cobertura: 'Cobertura e rede sujeitas à modalidade contratada.',
  elegibilidade: 'Consulte condições e elegibilidade.',
  analise: 'Condições sujeitas à análise comercial.',
  oferta: 'Oferta sujeita à disponibilidade comercial.',
  rede: 'A rede credenciada pode variar conforme plano contratado.',
  hospital: 'Consulte a disponibilidade da rede hospitalar.',
  imagem: 'Imagem meramente ilustrativa.',
};

// Dados de cada cotação (enviadas em 04/11/2026). Todas para 3 vidas em São Paulo (SP), acomodação enfermaria.
export const COTACAO = {
  amil: {
    plano: 'Amil Prata QC Copart TP',
    total: '1.445,99', promo: '723,00',
    porVida: [['até 18', '314,55'], ['19 a 23', '368,02'], ['24 a 28', '448,99'], ['29 a 33', '538,79'], ['34 a 38', '565,72'],
      ['39 a 43', '622,30'], ['44 a 48', '777,88'], ['49 a 53', '855,66'], ['54 a 58', '1.069,58'], ['59 ou mais', '1.871,77']],
    base: '*Valor mensal para 3 vidas (1 de até 18 anos e 2 de 34 a 38 anos), plano Amil Prata QC Copart TP, enfermaria, ' +
      'coparticipação apenas em terapias, São Paulo (SP). 50% de desconto na 1ª e na 2ª mensalidade para contratos de ' +
      'novembro/2026; a partir da 3ª, R$ 1.445,99.',
    obs: ['referenciais', 'perfil', 'cobertura', 'elegibilidade', 'analise', 'oferta'],
    ans: 'Amil · ANS nº 326305.',
  },
  bradesco: {
    plano: 'Bradesco Saúde Efetivo Plus',
    total: '2.362,01',
    base: '*Parcela mensal para 3 vidas (sócios e diretores), plano Bradesco Saúde Efetivo Plus, enfermaria, sem coparticipação, ' +
      'São Paulo (SP), conforme cotação de 04/11/2026.',
    obs: ['referenciais', 'perfil', 'cobertura', 'elegibilidade', 'analise'],
    ans: 'Bradesco Saúde S.A. · ANS nº 005711.',
  },
  sula: {
    plano: 'SulAmérica Direto Nacional',
    total: '1.593,54', premio: '1.556,49', iof: '37,05',
    porVida: [['0 a 18', '332,45'], ['19 a 23', '415,56'], ['24 a 28', '515,29'], ['29 a 33', '571,98'], ['34 a 38', '612,02'],
      ['39 a 43', '709,95'], ['44 a 48', '848,67'], ['49 a 53', '994,65'], ['54 a 58', '1.184,14'], ['59 ou mais', '1.994,69']],
    base: '*Valor mensal para 3 vidas (1 de até 18 anos e 2 de 34 a 38 anos), plano SulAmérica Direto Nacional, enfermaria, ' +
      'sem coparticipação, São Paulo (SP): R$ 1.556,49 + IOF de 2,38% (R$ 37,05). Cotação válida até 19/12/2026.',
    obs: ['referenciais', 'perfil', 'cobertura', 'elegibilidade', 'analise'],
    ans: 'Sul América Companhia de Seguro Saúde · ANS nº 006246.',
  },
};

const traco = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
export const ICONES = {
  formulario: `<svg viewBox="0 0 24 24" ${traco} stroke-width="2"><rect x="4.5" y="4" width="15" height="17" rx="2"/><path d="M9 4V2.8h6V4"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4"/></svg>`,
  maleta: `<svg viewBox="0 0 24 24" ${traco} stroke-width="2.2"><rect x="3" y="7.5" width="18" height="12.5" rx="2"/><path d="M9 7.5V5.8A1.6 1.6 0 0 1 10.6 4.2h2.8A1.6 1.6 0 0 1 15 5.8v1.7M3 12.8h18"/></svg>`,
  conversa: `<svg viewBox="0 0 24 24" ${traco} stroke-width="2"><path d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2z"/><path d="M9.1 8.6c.3-.6.8-.6 1.1 0l.6 1.4c.1.3 0 .6-.2.8l-.5.5c.5 1.2 1.4 2.1 2.6 2.6l.5-.5c.2-.2.5-.3.8-.2l1.4.6c.6.3.6.8 0 1.1-.9.6-1.9.7-3 .2a8 8 0 0 1-3.7-3.7c-.5-1.1-.4-2.1.4-2.8z" fill="currentColor" stroke-width="1"/></svg>`,
  check: `<svg viewBox="0 0 24 24" ${traco} stroke-width="3"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
  hospital: `<svg viewBox="0 0 24 24" ${traco} stroke-width="1.9"><path d="M4 21V6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5V21M2.5 21h19"/><path d="M12 8.2v5M9.5 10.7h5" stroke-width="2.2"/><path d="M10 21v-4h4v4"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" ${traco} stroke-width="2"><path d="M12 21.2s-7-6-7-11.4a7 7 0 0 1 14 0c0 5.4-7 11.4-7 11.4z"/><circle cx="12" cy="9.8" r="2.6"/></svg>`,
  grupo: `<svg viewBox="0 0 24 24" ${traco} stroke-width="1.8"><circle cx="12" cy="7.6" r="3"/><circle cx="5.4" cy="9.4" r="2.3"/><circle cx="18.6" cy="9.4" r="2.3"/><path d="M6.8 19.5v-1.2a5.2 5.2 0 0 1 10.4 0v1.2M1.8 18.6v-.7a3.6 3.6 0 0 1 4.9-3.4M22.2 18.6v-.7a3.6 3.6 0 0 0-4.9-3.4"/></svg>`,
};

export async function montar() {
  document.body.classList.add('story');
  const op = document.body.dataset.operadora;
  const c = COTACAO[op];
  const hosp = document.body.dataset.hospital === 'sim', foto = hosp || document.body.dataset.foto === 'sim';
  const obs = [...c.obs, ...(hosp ? ['rede', 'hospital'] : []), ...(foto ? ['imagem'] : [])].map(k => OBS[k]);
  document.querySelectorAll('.legal').forEach(el => { el.textContent = [c.base, ...obs, c.ans].join(' '); });
  document.querySelectorAll('.nota-preco').forEach(el => { el.textContent = OBS.valor; });
  document.querySelectorAll('[data-icone]').forEach(el => { el.classList.add('icone'); el.insertAdjacentHTML('beforeend', ICONES[el.dataset.icone]); });
  for (const el of document.querySelectorAll('.logo[data-marca]')) {
    const m = el.dataset.marca;
    if (m === 'sula' || m === 'sula-branco') {
      el.innerHTML = `<img alt="SulAmérica" src="../assets/marca/${m === 'sula' ? 'sulamerica' : 'sulamerica-branco'}.png">`;
    } else {
      el.innerHTML = await (await fetch(`../assets/marca/${m === 'amil' ? 'amil' : 'bradesco-saude'}.svg`)).text();
    }
  }
  document.body.offsetHeight;
  await Promise.all(['900 40px Mont', '800 40px Mont', '400 20px Poppins', '500 20px Poppins', '600 20px Poppins', '700 20px Poppins',
    '800 20px Poppins', '500 20px Gabarito', '700 20px Gabarito', '900 20px Gabarito', '400 20px Courier', '700 20px Courier',
    '700 20px Caveat'].map(f => document.fonts.load(f)));
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  window.__ready = true;
}
