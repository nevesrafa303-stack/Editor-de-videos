// Comum às peças: formato pelo hash (#story ou #feed), logo da Amil inline (cor por currentColor),
// textos fixos da oferta e do rodapé legal, e window.__ready para o render.

// Oferta — tudo da peça de outubro; só o prazo mudou (prorrogada para novembro).
export const OFERTA = {
  reais: '1.123',
  centavos: '17',
  vidas: 'Plano para 3 vidas com coparticipação',
  prazo: 'até 30 de novembro',
};

// Observações do CLAUDE.md (texto exato) + perfil da simulação da peça + registro ANS.
export const NOTA_PRECO = 'Valores sujeitos à faixa etária e região.';
const LEGAL = [
  '*Valor referente a uma vida de 18 anos, um adulto de 33 anos e mais um até 38 anos.',
  'Valores referenciais sujeitos às regras da operadora.',
  'Cobertura e rede sujeitas à modalidade contratada.',
  'Consulte condições e elegibilidade.',
  'Oferta sujeita à disponibilidade comercial.',
];
const IMAGEM = 'Imagem meramente ilustrativa.';
const ANS = 'Amil · ANS nº 326305.';

const SETA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>';

export async function montar() {
  document.body.classList.add(location.hash.slice(1) || 'story');
  const temFoto = document.body.dataset.foto === 'sim';
  document.querySelectorAll('.legal').forEach(el => {
    el.textContent = [...LEGAL, ...(temFoto ? [IMAGEM] : []), ANS].join(' ');
  });
  document.querySelectorAll('.nota-preco').forEach(el => { el.textContent = NOTA_PRECO; });
  // conteúdo fixo deste arquivo (sem entrada externa)
  document.querySelectorAll('[data-preco]').forEach(el => {
    el.innerHTML = `<span class="rs">R$</span>${OFERTA.reais}<span class="cent">,${OFERTA.centavos}*</span>`;
  });
  document.querySelectorAll('.cta').forEach(el => el.insertAdjacentHTML('beforeend', SETA));
  const svg = await (await fetch('../assets/amil-logo.svg')).text();
  document.querySelectorAll('.logo').forEach(el => { el.innerHTML = svg; });
  document.body.offsetHeight;
  await Promise.all(['900 40px Mont', '800 40px Mont', '400 20px Poppins', '500 20px Poppins', '600 20px Poppins', '700 20px Poppins', '800 20px Poppins']
    .map(f => document.fonts.load(f)));
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  window.__ready = true;
}
