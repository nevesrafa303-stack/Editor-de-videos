// Comum às peças: nota curta do *, logos, ícones e window.__ready para o render.
// <body data-operadora="sula|bradesco">. Conteúdo fixo deste arquivo (sem entrada externa).

// Observações do CLAUDE.md, texto exato. Pedido do cliente (08/11/2026): pouca informação, como nas referências —
// a nota do * e só as observações essenciais (preço, CNPJ/MEI, rede e foto).
export const OBS = {
  valor: 'Valores sujeitos à faixa etária e região.',
  elegibilidade: 'Consulte condições e elegibilidade.',
  rede: 'A rede credenciada pode variar conforme plano contratado.',
  imagem: 'Imagem meramente ilustrativa.',
};

const NOTA = {
  sula: '*Valor referente a 3 vidas (2 de 34 a 38 anos e 1 de 0 a 18 anos), Direto Nacional, enfermaria.',
  bradesco: '*Valor referente a 3 vidas (sócios e diretores), Efetivo Plus, enfermaria.',
};

const traco = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
export const ICONES = {
  seta: `<svg viewBox="0 0 24 24" ${traco} stroke-width="2.8"><path d="M7 17L17 7M9 7h8v8"/></svg>`,
  maleta: `<svg viewBox="0 0 24 24" ${traco} stroke-width="2.2"><rect x="3" y="7.5" width="18" height="12.5" rx="2"/><path d="M9 7.5V5.8A1.6 1.6 0 0 1 10.6 4.2h2.8A1.6 1.6 0 0 1 15 5.8v1.7M3 12.8h18"/></svg>`,
};

export async function montar() {
  const op = document.body.dataset.operadora;
  document.querySelectorAll('.nota').forEach(el => {
    el.textContent = [NOTA[op], OBS.elegibilidade, OBS.rede, OBS.imagem].join(' ');
  });
  document.querySelectorAll('.nota-preco').forEach(el => { el.textContent = OBS.valor; });
  // ícones e logos: SVG/PNG fixos deste projeto (sem entrada externa)
  document.querySelectorAll('[data-icone]').forEach(el => { el.classList.add('icone'); el.insertAdjacentHTML('beforeend', ICONES[el.dataset.icone]); });
  for (const el of document.querySelectorAll('.logo[data-marca]')) {
    const m = el.dataset.marca;
    if (m === 'bradesco') el.innerHTML = await (await fetch('../assets/marca/bradesco-saude.svg')).text();
    else el.innerHTML = `<img alt="SulAmérica" src="../assets/marca/${m === 'sula' ? 'sulamerica' : 'sulamerica-branco'}.png">`;
  }
  document.body.offsetHeight;
  await Promise.all(['400 20px Poppins', '500 20px Poppins', '600 20px Poppins', '700 20px Poppins', '800 20px Poppins', '800 20px Mont',
    '900 20px Mont'].map(f => document.fonts.load(f)));
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  window.__ready = true;
}
