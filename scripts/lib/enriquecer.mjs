import {norm, IMPACTO, IMPERATIVO, ENUMERACAO, CONCEITUAL, contemAlgum} from './text.mjs';

/**
 * 4.5 — Keywords do GANCHO: palavras de impacto nos ~5s iniciais.
 * Aparecem uma a uma no timestamp exato da fala e EMPILHAM; somem juntas em
 * corte seco no fim do gancho.
 */
export function keywordsDoGancho(segs, {fps = 30, janela = 5.0, max = 3} = {}) {
  const limite = Math.round(janela * fps);
  const itens = [];
  for (const s of segs) {
    if (s.from > limite) break;
    for (const w of s.words) {
      if (!IMPACTO.has(norm(w.t))) continue;
      const at = Math.round((w.start + s.offset) * fps);
      if (at > limite) continue;
      itens.push({text: norm(w.t).toUpperCase(), at});
      if (itens.length >= max) break;
    }
    if (itens.length >= max) break;
  }
  if (itens.length < 2) return null; // 1 palavra sozinha nao vira empilhamento

  const from = itens[0].at;
  // some em corte seco no fim do segmento onde caiu a ultima palavra
  const segFim = segs.find((s) => itens[itens.length - 1].at < s.from + s.durationInFrames);
  const fim = segFim ? segFim.from + segFim.durationInFrames : limite;
  return {from, durationInFrames: Math.max(fps, fim - from), items: itens, mode: 'hook'};
}

/**
 * 4.5 — Listas de COMANDOS no meio do video: frases imperativas em sequencia,
 * empilhadas em CAPS. Maximo 2 grupos alem do gancho.
 */
export function gruposDeComandos(segs, {fps = 30, maxGrupos = 2} = {}) {
  const grupos = [];
  let corrente = [];

  const fechar = () => {
    if (corrente.length >= 2 && grupos.length < maxGrupos) {
      const from = corrente[0].from;
      const ultimo = corrente[corrente.length - 1];
      grupos.push({
        from,
        durationInFrames: ultimo.from + ultimo.durationInFrames - from,
        items: corrente.map((s) => ({
          text: frasesCurta(s.text),
          at: s.from + 2,
        })),
        mode: 'commands',
      });
    }
    corrente = [];
  };

  for (const s of segs) {
    if (IMPERATIVO.test(norm(s.text))) {
      const contiguo = !corrente.length || s.from === corrente[corrente.length - 1].from + corrente[corrente.length - 1].durationInFrames;
      if (!contiguo) fechar();
      corrente.push(s);
    } else {
      fechar();
    }
  }
  fechar();
  return grupos;
}

/**
 * Encurta a frase-comando para caber em UMA linha em CAPS.
 * Em 1080px de largura, ~28 caracteres e o limite pratico do tamanho usado —
 * acima disso a frase quebra e as linhas empilhadas se encostam.
 */
const frasesCurta = (t) => {
  const palavras = t.replace(/[.,;!?]+$/g, '').split(/\s+/);
  const out = [];
  let n = 0;
  for (const w of palavras) {
    if (out.length && n + 1 + w.length > 28) break;
    n += (out.length ? 1 : 0) + w.length;
    out.push(w);
  }
  // Cortar em preposicao/artigo deixa a frase pendurada ("NAO APAGUE AS
  // CONVERSAS DO"). Apara a cauda ate uma palavra que se sustente sozinha.
  const CAUDA = new Set([
    'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'a', 'o',
    'as', 'os', 'um', 'uma', 'ao', 'aos', 'para', 'pra', 'por', 'com', 'sem',
    'e', 'ou', 'que', 'se', 'sobre', 'entre', 'ate', 'sua', 'seu', 'meu',
  ]);
  while (out.length > 1 && CAUDA.has(norm(out[out.length - 1]))) out.pop();
  return out.join(' ').toLocaleUpperCase('pt-BR');
};

/**
 * 4.6 — B-roll / inserts. Hierarquia de fontes:
 *   1 arquivo do usuario  2 stock local  3 mockup de dispositivo  4 tipografia
 * Escolhe o trecho com enumeracao falada.
 */
export function montarInserts(segs, {fps = 30, brollDisponivel = [], max = 2} = {}) {
  const inserts = [];
  const usados = new Set();

  const candidatos = segs
    .map((s, i) => ({s, i}))
    .filter(({s}) => contemAlgum(s.text, ENUMERACAO) && s.durationInFrames >= fps * 2.5)
    .slice(0, max);

  for (const {s, i} of candidatos) {
    // cobre este segmento e o seguinte, ate ~9s
    let dur = s.durationInFrames;
    let j = i + 1;
    while (j < segs.length && dur < fps * 6) {
      dur += segs[j].durationInFrames;
      usados.add(j);
      j++;
    }
    dur = Math.min(dur, fps * 9);

    // A frase que ANUNCIA a lista ("existem tres provas que o juiz aceita")
    // nao e um item — e a chamada. Os itens estao nos segmentos SEGUINTES.
    // So caimos de volta no segmento da chamada se ele for a lista inteira.
    const depois = extrairItens(segs.slice(i + 1, j), fps);
    const itens = (depois.length >= 2 ? depois : extrairItens(segs.slice(i, j), fps)).slice(0, 5);
    if (itens.length < 2) continue;

    // O insert nao pode entrar antes do conteudo dele: um painel vazio no ar
    // por 1s le como bug. Ancora a entrada logo antes do primeiro item.
    const entrada = Math.max(s.from, itens[0].at - 4);
    const fimInsert = Math.min(s.from + dur, segs[j - 1].from + segs[j - 1].durationInFrames);
    const duracao = Math.max(fps, fimInsert - entrada);

    const arquivo = brollDisponivel[inserts.length];
    inserts.push(
      arquivo
        ? {
            kind: 'broll-file',
            layout: 'fullscreen',
            from: entrada,
            durationInFrames: duracao,
            items: [],
            src: arquivo,
          }
        : {
            // sem arquivo do usuario -> painel de lista lower-half:
            // mantem o rosto visivel, que e o formato mais forte das referencias
            kind: 'list-panel',
            layout: 'lower-panel',
            from: entrada,
            durationInFrames: duracao,
            items: itens,
          },
    );
  }
  return inserts;
}

/** Quebra a fala em itens de lista, um por marcador/pausa longa. */
function extrairItens(segs, fps) {
  const itens = [];
  for (const s of segs) {
    let buf = [];
    let ini = null;
    for (let i = 0; i < s.words.length; i++) {
      const w = s.words[i];
      if (ini === null) ini = w.start;
      buf.push(w.t);
      const prox = s.words[i + 1];
      const gap = prox ? prox.start - w.end : Infinity;
      const corta = gap > 0.3 || /[,.;]$/.test(w.t) || buf.length >= 6;
      if (corta && buf.length >= 2) {
        itens.push({
          text: buf.join(' ').replace(/[.,;]+$/g, ''),
          at: Math.round((ini + s.offset) * fps),
        });
        buf = [];
        ini = null;
      }
    }
    if (buf.length >= 2 && ini !== null) {
      itens.push({
        text: buf.join(' ').replace(/[.,;]+$/g, ''),
        at: Math.round((ini + s.offset) * fps),
      });
    }
  }
  return itens;
}

/**
 * 4.7 — Motion graphics OBRIGATORIO: 3-5s no MEIO (nunca gancho nem CTA).
 * Escolhe o trecho mais conceitual do terco central.
 */
export function montarMotion(segs, {fps = 30, ocupados = [], total = 0} = {}) {
  const colide = (from, dur) =>
    ocupados.some((o) => from < o.from + o.durationInFrames && o.from < from + dur);

  const meioIni = total * 0.2;
  const meioFim = total * 0.82;

  const score = (s) => {
    let sc = contemAlgum(s.text, CONCEITUAL) ? 3 : 0;
    if (/\d/.test(s.text)) sc += 2;           // estatistica -> contador
    if (/\b(nao e|nao sao|diferente|versus|ao inves)\b/.test(norm(s.text))) sc += 2;
    return sc;
  };

  const cand = segs
    .filter((s) => s.from >= meioIni && s.from + s.durationInFrames <= meioFim)
    .map((s) => ({s, sc: score(s)}))
    .filter(({sc}) => sc > 0)
    .sort((a, b) => b.sc - a.sc);

  const escolhido = cand.find(({s}) => !colide(s.from, s.durationInFrames))
    // fallback: sem trecho conceitual, usa o segmento central que nao colide
    ?? {s: segs.filter((s) => s.from >= meioIni && s.from < meioFim && !colide(s.from, s.durationInFrames))
             .sort((a, b) => b.durationInFrames - a.durationInFrames)[0], sc: 0};

  const s = escolhido?.s;
  if (!s) return [];

  const numeros = s.text.match(/\d+/g);

  // Formato escolhido pelo conteudo do trecho
  // O contador nao depende de palavra: pode comecar junto com o segmento.
  const durSeg = Math.min(Math.max(s.durationInFrames, fps * 3), fps * 5);

  if (numeros && numeros.length) {
    return [{
      kind: 'counter',
      from: s.from,
      durationInFrames: durSeg,
      items: [],
      counterTo: Number(numeros[0]),
      counterSuffix: /%|por cento/.test(s.text) ? '%' : '',
      headline: s.text.replace(/^\W+/, '').split(/\s+/).slice(0, 6).join(' '),
    }];
  }

  // Nos formatos guiados por palavra, o insert entra junto com a primeira
  // palavra — nao antes dela, senao fica um fundo vazio no ar.
  const comItens = (kind, itens, extra = {}) => {
    const entrada = Math.max(s.from, itens.length ? itens[0].at - 4 : s.from);
    const fim = Math.min(s.from + durSeg, s.from + s.durationInFrames);
    return [{
      kind,
      from: entrada,
      durationInFrames: Math.max(fps * 3, fim - entrada),
      items: itens,
      ...extra,
    }];
  };

  if (/\b(nao e|nao sao|diferente|versus|ao inves)\b/.test(norm(s.text))) {
    return comItens('two-columns', palavrasChave(s, fps, 6), {labels: ['nao e', 'e']});
  }

  return comItens('kinetic', palavrasChave(s, fps, 3));
}

/**
 * Palavras-chave do segmento, com o frame exato em que sao faladas.
 *
 * Escolher por passo fixo pega o que calhar ("pratica", "palavra"); o que faz
 * sentido na tela sao as palavras com CARGA — fora da lista de funcao, longas,
 * e com preferencia para as de impacto. A ordem de exibicao continua sendo a
 * ordem da fala, senao o motion dessincroniza da narracao.
 */
const FUNCAO = new Set([
  'que', 'para', 'pela', 'pelo', 'como', 'quando', 'porque', 'entao', 'assim',
  'isso', 'esse', 'essa', 'este', 'esta', 'aquilo', 'muito', 'mais', 'menos',
  'todo', 'toda', 'todos', 'todas', 'seus', 'suas', 'dele', 'dela', 'voce',
  'sobre', 'entre', 'ainda', 'depois', 'antes', 'sempre', 'nunca', 'onde',
  'tambem', 'apenas', 'sendo', 'estar', 'ficar', 'deixa', 'coisa', 'coisas',
]);

function palavrasChave(s, fps, max) {
  const candidatos = s.words
    .map((w, i) => ({w, i, n: norm(w.t)}))
    .filter(({n}) => n.length > 4 && !FUNCAO.has(n));

  const pontuar = ({n}) => (IMPACTO.has(n) ? 10 : 0) + n.length;

  const escolhidas = [...candidatos]
    .sort((a, b) => pontuar(b) - pontuar(a))
    .slice(0, max)
    .sort((a, b) => a.i - b.i);

  return escolhidas.map(({w}, k) => ({
    text: w.t.replace(/[.,;!?]+$/g, ''),
    at: Math.round((w.start + s.offset) * fps),
    // a ultima a entrar leva a corDestaque, como nas referencias
    accent: k === escolhidas.length - 1,
  }));
}

/** 4.8 — Card Q&A quando a abertura responde uma pergunta de seguidor. */
export function montarQaCard(segs, {fps = 30, pergunta = null, header = 'DEIXE SUAS DUVIDAS'} = {}) {
  if (!pergunta) {
    // detecta pergunta citada nas primeiras falas
    const s = segs.slice(0, 3).find((x) => /\?/.test(x.text) || /\b(me perguntou|perguntaram|mandou no direct|recebi uma pergunta)\b/.test(norm(x.text)));
    if (!s) return null;
    pergunta = s.text.replace(/^.*?(perguntou|perguntaram|direct)[:,]?\s*/i, '').trim();
    if (pergunta.length < 12) return null;
  }
  const dur = Math.round(fps * 3);
  return {from: 0, durationInFrames: dur, header, question: pergunta};
}

/**
 * SFX (Etapa 3.4) — REGRA OBRIGATORIA: todo texto que aparece na tela entra com
 * som no frame exato. Os ganhos vem calibrados por medicao (06_sfx.mjs).
 */
export function agendarSfx({keywordGroups, inserts, motions, segs, qaCard, ganhos, fps = 30}) {
  const ev = [];
  const push = (kind, at) => {
    if (at < 0) return;
    // dedup: nunca dois SFX iguais no mesmo frame
    if (ev.some((e) => e.kind === kind && Math.abs(e.at - at) < 2)) return;
    ev.push({kind, at, gain: ganhos[kind]});
  };

  // riser sutil sob o gancho, crescendo ate a virada
  const gancho = keywordGroups.find((g) => g.mode === 'hook');
  if (gancho) push('riser', Math.max(0, gancho.from - Math.round(fps * 0.6)));

  // hit por keyword / comando
  for (const g of keywordGroups) for (const it of g.items) push('hit', it.at);

  // whoosh na entrada de cada insert e motion; pop por item
  for (const ins of [...inserts, ...motions]) {
    push('whoosh', ins.from);
    for (const it of ins.items || []) push('pop', it.at);
  }

  // whoosh nos zooms de enfase
  for (const s of segs) if (s.emphasis) push('whoosh', s.from);

  // card Q&A entra com pop
  if (qaCard) push('pop', qaCard.from + 1);

  return ev.sort((a, b) => a.at - b.at);
}

/** Flash branco de saida de cada insert/motion (4.6/4.7). */
export const flashesDeSaida = (inserts, motions, total) =>
  [...inserts, ...motions]
    .map((x) => x.from + x.durationInFrames - 2)
    .filter((f) => f > 0 && f < total - 3)
    .sort((a, b) => a - b);

/** ETAPA 0 — deduz o nicho pelo vocabulario da transcricao. */
export function detectarPreset(textoCompleto) {
  const n = norm(textoCompleto);
  const conta = (lista) => lista.reduce((s, w) => s + (n.split(w).length - 1), 0);

  const juridicoMedico = conta([
    'lei', 'juiz', 'processo', 'direito', 'advogad', 'justica', 'indenizacao',
    'clt', 'contrato', 'tribunal', 'medic', 'paciente', 'diagnostico',
    'tratamento', 'cirurgia', 'investimento', 'imposto', 'renda', 'juros',
  ]);
  const terapeutico = conta([
    'ansiedade', 'terapia', 'psicolog', 'emocional', 'sentimento', 'acolh',
    'autoestima', 'relacionamento', 'sofrimento', 'cuidar de voce', 'saude mental',
    'crianca', 'aprendizagem', 'aluno',
  ]);
  const editorial = conta([
    'marca', 'conteudo', 'audiencia', 'engajamento', 'gravar', 'edicao',
    'camera', 'criador', 'seguidores', 'reels', 'campanha', 'cliente', 'projeto',
  ]);

  if (terapeutico > juridicoMedico && terapeutico > editorial) return 'acolhedor';
  if (editorial > juridicoMedico && editorial > terapeutico) return 'editorial';
  return 'autoridade';
}
