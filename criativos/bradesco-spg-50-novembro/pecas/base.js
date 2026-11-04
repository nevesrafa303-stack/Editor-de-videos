// Comum às peças: formato pelo hash (#story ou #feed), logo oficial inline, ícones, observações legais e
// window.__ready para o render. Conteúdo fixo deste arquivo (sem entrada externa).

// Observações do CLAUDE.md (texto exato), condição da oferta e registro ANS da operadora.
// A observação de valor vai logo abaixo do 50% (.nota-preco); as demais, no rodapé (.legal).
export const NOTA_PRECO = 'Valores sujeitos à faixa etária e região.';
export const LEGAL = [
  '*Condição válida para cálculos realizados de 03 a 30/11/2026.',
  'Valores referenciais sujeitos às regras da operadora.',
  'A rede credenciada pode variar conforme plano contratado.',
  'Cobertura e rede sujeitas à modalidade contratada.',
  'Consulte condições e elegibilidade.',
  'Condições sujeitas à análise comercial.',
  'Oferta sujeita à disponibilidade comercial.',
  'Imagem meramente ilustrativa.',
  'Bradesco Saúde S.A. · ANS nº 005711.',
];

const traco = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
export const ICONES = {
  calendario: `<svg viewBox="0 0 24 24" ${traco} stroke-width="1.9"><rect x="3.2" y="4.6" width="17.6" height="16" rx="2.6"/><path d="M3.2 9.4h17.6M8 2.8v3.6M16 2.8v3.6"/><path d="M7.4 13.2h1.4M11.3 13.2h1.4M15.2 13.2h1.4M7.4 16.8h1.4M11.3 16.8h1.4" stroke-width="2.2"/></svg>`,
  empresa: `<svg viewBox="0 0 24 24" ${traco} stroke-width="1.8"><path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h7A1.5 1.5 0 0 1 14 5.5V21M14 10h4.5a1.5 1.5 0 0 1 1.5 1.5V21M2.5 21h19"/><path d="M7.5 8h3M7.5 11.5h3M7.5 15h3M16.5 14h.5M16.5 17.5h.5"/></svg>`,
  rede: `<svg viewBox="0 0 24 24" ${traco} stroke-width="1.8"><path d="M12 21.2s-7.2-6.1-7.2-11.6a7.2 7.2 0 0 1 14.4 0c0 5.5-7.2 11.6-7.2 11.6z"/><path d="M12 6.6v6M9 9.6h6" stroke-width="2.1"/></svg>`,
  reembolso: `<svg viewBox="0 0 24 24" ${traco} stroke-width="1.8"><path d="M5.5 3h13v18l-2.2-1.5-2.1 1.5-2.2-1.5-2.2 1.5-2.1-1.5L5.5 21z"/><path d="M9 8.2h6M9 11.8h6M9 15.4h3.5"/></svg>`,
  brasil: `<svg viewBox="0 0 24 24" ${traco} stroke-width="1.8"><circle cx="12" cy="12" r="8.8"/><path d="M3.2 12h17.6M12 3.2c2.4 2.4 3.6 5.3 3.6 8.8s-1.2 6.4-3.6 8.8c-2.4-2.4-3.6-5.3-3.6-8.8S9.6 5.6 12 3.2z"/></svg>`,
  grupo: `<svg viewBox="0 0 24 24" ${traco} stroke-width="1.8"><circle cx="12" cy="7.6" r="3"/><circle cx="5.4" cy="9.4" r="2.3"/><circle cx="18.6" cy="9.4" r="2.3"/><path d="M6.8 19.5v-1.2a5.2 5.2 0 0 1 10.4 0v1.2M1.8 18.6v-.7a3.6 3.6 0 0 1 4.9-3.4M22.2 18.6v-.7a3.6 3.6 0 0 0-4.9-3.4"/></svg>`,
  relogio: `<svg viewBox="0 0 24 24" ${traco} stroke-width="2.4"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></svg>`,
  conversa: `<svg viewBox="0 0 24 24" ${traco} stroke-width="2"><path d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2z"/><path d="M9.1 8.6c.3-.6.8-.6 1.1 0l.6 1.4c.1.3 0 .6-.2.8l-.5.5c.5 1.2 1.4 2.1 2.6 2.6l.5-.5c.2-.2.5-.3.8-.2l1.4.6c.6.3.6.8 0 1.1-.9.6-1.9.7-3 .2a8 8 0 0 1-3.7-3.7c-.5-1.1-.4-2.1.4-2.8z" fill="currentColor" stroke-width="1"/></svg>`,
  seta: `<svg viewBox="0 0 24 24" ${traco} stroke-width="3"><path d="M9 5l7 7-7 7"/></svg>`,
  check: `<svg viewBox="0 0 24 24" ${traco} stroke-width="3"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
};

export async function montar() {
  document.body.classList.add(location.hash.slice(1) || 'story');
  document.querySelectorAll('.legal').forEach(el => { el.textContent = LEGAL.join(' '); });
  document.querySelectorAll('.nota-preco').forEach(el => { el.textContent = NOTA_PRECO; });
  document.querySelectorAll('[data-icone]').forEach(el => {
    el.classList.add('icone');
    el.insertAdjacentHTML('beforeend', ICONES[el.dataset.icone]);
  });
  const svg = await (await fetch('../assets/marca/bradesco-saude.svg')).text();
  document.querySelectorAll('.logo').forEach(el => { el.innerHTML = svg; });
  document.body.offsetHeight;
  await Promise.all(['900 40px Mont', '800 40px Mont', '400 20px Poppins', '500 20px Poppins', '600 20px Poppins',
    '700 20px Poppins', '800 20px Poppins'].map(f => document.fonts.load(f)));
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  window.__ready = true;
}
