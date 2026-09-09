// Utilitarios de texto PT-BR compartilhados pelo motor de decupagem.

export const norm = (s) =>
  s
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Frases de bastidor: metafala do apresentador, nunca entram no corte. */
export const BASTIDOR = [
  'deixa eu repetir', 'deixa eu comecar de novo', 'vou repetir',
  'ta muito lento', 'ta lento', 'ta rapido', 'vou mudar o texto',
  'espera ai', 'pera ai', 'perai', 'corta isso', 'corta essa',
  'errei', 'me perdi', 'esqueci', 'como e que era', 'qual era a frase',
  'vamos de novo', 'mais uma vez', 'ta gravando', 'ja ta gravando',
  'to gravando', 'da pra ouvir', 'testando', 'um dois tres',
  'nao gostei', 'melhor assim', 'agora vai',
  'desculpa', 'foi mal',
];

/** Interjeicoes/ruidos de boca — cortados quando isolados. */
export const RUIDOS = ['ah', 'eh', 'hum', 'hmm', 'ne', 'tipo', 'aham', 'uhum', 'ok'];

/** Verbos/substantivos de impacto tipicos de gancho em PT-BR. */
export const IMPACTO = new Set([
  'grita', 'gritar', 'humilha', 'humilhar', 'ameaca', 'ameacar', 'ignora',
  'demite', 'demitir', 'processa', 'processar', 'mente', 'mentir', 'engana',
  'perde', 'perder', 'destroi', 'destruir', 'quebra', 'falha', 'erro', 'erra',
  'nunca', 'jamais', 'sempre', 'proibido', 'ilegal', 'crime', 'golpe',
  'prejuizo', 'divida', 'multa', 'demissao', 'assedio', 'abuso', 'violencia',
  'urgente', 'atencao', 'cuidado', 'perigo', 'risco', 'armadilha',
  'segredo', 'verdade', 'mentira', 'dinheiro', 'grana', 'lucro', 'falencia',
  'ansiedade', 'depressao', 'burnout', 'panico', 'trauma', 'culpa', 'medo',
]);

/** Marcadores de ressalva/nuance — sinalizam a virada do argumento. */
export const RESSALVA = ['mas atencao', 'mas cuidado', 'porem', 'entretanto', 'so que', 'atencao'];

/** Marcadores de CTA. */
export const CTA = [
  'clica aqui', 'clique aqui', 'link na bio', 'link para agendamento',
  'salve este video', 'salva esse video', 'deixe sua opiniao', 'comenta aqui',
  'me segue', 'te espero do outro lado', 'chama no direct', 'manda um direct',
  'compartilha', 'agenda uma consulta', 'agende',
];

/** Marcadores de enumeracao falada — gatilho de B-roll / painel de lista. */
export const ENUMERACAO = [
  'primeiro', 'segundo', 'terceiro', 'quarto', 'quinto',
  'numero um', 'numero dois',
  'existem', 'sao tres', 'sao dois', 'tres coisas', 'duas coisas',
  'por exemplo', 'entre eles', 'tais como',
];

/** Marcadores de trecho conceitual — onde o motion graphics entra melhor. */
export const CONCEITUAL = [
  'significa', 'quer dizer', 'na pratica', 'ou seja', 'a diferenca',
  'a lei diz', 'o codigo', 'segundo a', 'de acordo com', 'em media',
  'a maioria', 'estatistica', 'dos casos', 'por cento', 'a regra e',
  'funciona assim', 'o processo', 'a primeira etapa',
];

/**
 * Comeco de imperativo (listas de comando: "NAO ASSINE...", "EVITE...").
 *
 * Duas vias, porque enumerar verbos nunca cobre o suficiente:
 *  a) negacao + verbo em -e/-a/-em/-am (forma imperativa negativa do PT-BR,
 *     que e o padrao dominante nesse tipo de video);
 *  b) lista explicita, para imperativos afirmativos ("evite", "guarde").
 * O verbo precisa de 3+ letras antes do sufixo, senao "nao e normal" casaria.
 */
const IMPERATIVO_NEGATIVO = /^(nao|nunca|jamais)\s+[a-z]{3,}(e|a|em|am)\b/;
const IMPERATIVO_AFIRMATIVO =
  /^(assine|assina|fale|fala|conte|conta|poste|posta|publique|mostre|mostra|aceite|aceita|apresente|apresenta|crie|cria|deixe|deixa|evite|evita|pare|procure|procura|guarde|guarda|registre|registra|anote|anota|busque|busca|exija|exige|peca|pede|lembre|lembra|anexe|salve|salva|grave|grava)\b/;

export const IMPERATIVO = {
  test: (n) => IMPERATIVO_NEGATIVO.test(n) || IMPERATIVO_AFIRMATIVO.test(n),
};

/**
 * Localiza um marcador de bastidor dentro do texto e devolve a posicao FINAL
 * dele (em indice de palavra). Serve para separar "deixa eu repetir" do take
 * bom que vem colado logo depois — takes colados sao a regra, nao a excecao.
 */
export const fimDoBastidor = (texto) => {
  const palavras = norm(texto).split(' ');
  let corte = -1;
  for (const b of BASTIDOR) {
    const alvo = b.split(' ');
    for (let i = 0; i + alvo.length <= palavras.length; i++) {
      if (alvo.every((w, k) => palavras[i + k] === w)) {
        corte = Math.max(corte, i + alvo.length);
      }
    }
  }
  return corte;
};

export const isBastidor = (texto) => {
  const n = norm(texto);
  if (!n) return true;
  if (BASTIDOR.some((b) => n.includes(b))) return true;
  const palavras = n.split(' ');
  if (palavras.length <= 3 && palavras.every((p) => RUIDOS.includes(p))) return true;
  return false;
};

/** Frase quebrada: termina em conectivo/preposicao — o resto sumiu no take. */
const PENDENTE = new Set([
  'e', 'ou', 'que', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos',
  'nas', 'para', 'pra', 'por', 'com', 'sem', 'um', 'uma', 'o', 'a', 'os',
  'as', 'ao', 'aos', 'se', 'mas', 'porque', 'quando', 'muito', 'mais',
  'menos', 'ja', 'ainda', 'sobre', 'entre', 'ate', 'desde',
]);

export const isQuebrada = (texto) => {
  const p = norm(texto).split(' ').filter(Boolean);
  if (p.length < 3) return true;
  return PENDENTE.has(p[p.length - 1]);
};

/** Similaridade de bag-of-words para detectar takes repetidos. */
export const similaridade = (a, b) => {
  const A = new Set(norm(a).split(' ').filter((w) => w.length > 2));
  const B = new Set(norm(b).split(' ').filter((w) => w.length > 2));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / Math.min(A.size, B.size);
};

export const contemAlgum = (texto, lista) => {
  const n = norm(texto);
  return lista.some((m) => n.includes(m));
};
