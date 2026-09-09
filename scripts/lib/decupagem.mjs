import {
  norm, isBastidor, isQuebrada, similaridade, contemAlgum, fimDoBastidor,
  IMPACTO, RESSALVA, CTA, ENUMERACAO, CONCEITUAL, IMPERATIVO, RUIDOS,
} from './text.mjs';

/** Pausa acima da qual consideramos fim de frase / ar morto a apertar. */
export const PAUSA_MAX = 0.4;
/** Folga de ~3 frames a 30fps em cada ponta, para nao cortar ataque/cauda. */
export const HANDLE = 0.1;

/** 1) Achata os words do Whisper e aplica as correcoes da Etapa 1.6. */
export function flattenWords(transcript, corrections) {
  const mapa = new Map(
    Object.entries(corrections || {}).map(([k, v]) => [norm(k), v]),
  );
  const out = [];
  for (const seg of transcript.segments) {
    for (const w of seg.words || []) {
      const bruto = (w.word ?? w.text ?? '').trim();
      if (!bruto) continue;
      const corrigido = mapa.get(norm(bruto));
      out.push({
        t: corrigido ?? bruto,
        start: Number(w.start),
        end: Number(w.end),
        corrigido: corrigido !== undefined,
      });
    }
  }
  return out.filter((w) => Number.isFinite(w.start) && Number.isFinite(w.end) && w.end > w.start);
}

/**
 * 2) Agrupa palavras em FALAS (utterances): quebra em pausa > PAUSA_MAX ou em
 * pontuacao final. Cada fala e a unidade de decisao editorial.
 */
export function buildUtterances(words) {
  const out = [];
  let atual = [];
  const flush = () => {
    if (!atual.length) return;
    out.push({
      words: atual,
      start: atual[0].start,
      end: atual[atual.length - 1].end,
      text: atual.map((w) => w.t).join(' ').replace(/\s+([,.!?])/g, '$1'),
    });
    atual = [];
  };
  for (let i = 0; i < words.length; i++) {
    atual.push(words[i]);
    const prox = words[i + 1];
    const gap = prox ? prox.start - words[i].end : Infinity;
    const fechaFrase = /[.!?]$/.test(words[i].t);
    if (gap > PAUSA_MAX || (fechaFrase && gap > 0.15)) flush();
  }
  flush();
  return out;
}

/**
 * 3) DECUPAGEM: remove bastidor, ruido isolado, frases quebradas e takes
 * repetidos (mantendo o melhor take = o ultimo, normalmente o mais fluido).
 */
/**
 * Onde termina a metafala e comeca o take refeito.
 *
 * O marcador de bastidor ("deixa eu repetir") raramente e a ultima palavra do
 * lixo — vem uma cauda ("...essa parte ficou lenta") antes do take valer. Por
 * isso o corte real e procurado a partir do marcador, na ordem:
 *   1. fronteira de silencio de Etapa 1.5 (o sinal mais confiavel)
 *   2. maior pausa entre palavras na janela seguinte
 *   3. o proprio fim do marcador
 * Devolve o indice da palavra onde o take bom comeca, ou -1.
 */
function pontoDeRetake(u, silences = []) {
  const marcador = fimDoBastidor(u.text);
  if (marcador <= 0 || marcador >= u.words.length) return marcador;

  const t0 = u.words[marcador - 1].end;

  // 1) fronteira de silencio logo apos o marcador
  const sil = silences
    .filter((x) => x.end != null && x.start >= t0 - 0.05 && x.start <= t0 + 6)
    .sort((a, b) => a.start - b.start)[0];
  if (sil) {
    const i = u.words.findIndex((w) => w.start >= sil.end - 0.05);
    if (i > marcador) return i;
  }

  // 2) maior pausa nas ~10 palavras seguintes
  const fim = Math.min(u.words.length - 1, marcador + 10);
  let melhor = -1;
  let maior = 0;
  for (let i = marcador; i < fim; i++) {
    const gap = u.words[i + 1].start - u.words[i].end;
    if (gap > maior) {
      maior = gap;
      melhor = i + 1;
    }
  }
  if (melhor > marcador && maior >= 0.12) return melhor;

  // 3) fallback: corta no fim do marcador
  return marcador;
}

export function decupar(utterances, {log = [], silences = []} = {}) {
  const descartados = [];

  // 3a-0) TAKES COLADOS: quando o bastidor esta grudado no take bom
  // ("deixa eu repetir" + o take refeito, sem pausa entre eles), separar em vez
  // de jogar fora — senao o melhor take vai junto com a metafala.
  const separados = [];
  for (const u of utterances) {
    const corte = pontoDeRetake(u, silences);
    const sobra = corte > 0 ? u.words.slice(corte) : null;
    if (sobra && sobra.length >= 4) {
      descartados.push({
        motivo: 'bastidor (separado do take colado)',
        start: Number(u.start.toFixed(2)),
        end: Number(u.words[corte - 1].end.toFixed(2)),
        texto: u.words.slice(0, corte).map((w) => w.t).join(' '),
      });
      separados.push({
        words: sobra,
        start: sobra[0].start,
        end: sobra[sobra.length - 1].end,
        text: sobra.map((w) => w.t).join(' ').replace(/\s+([,.!?])/g, '$1'),
      });
    } else {
      separados.push(u);
    }
  }

  // 3a) bastidor / ruido / frase quebrada
  let vivos = separados.filter((u) => {
    if (isBastidor(u.text)) {
      descartados.push({motivo: 'bastidor', ...resumo(u)});
      return false;
    }
    if (isQuebrada(u.text)) {
      descartados.push({motivo: 'frase quebrada/incompleta', ...resumo(u)});
      return false;
    }
    const p = norm(u.text).split(' ').filter(Boolean);
    if (p.length && p.every((x) => RUIDOS.includes(x))) {
      descartados.push({motivo: 'ruido isolado', ...resumo(u)});
      return false;
    }
    return true;
  });

  // 3b) takes repetidos: compara cada fala com as proximas 6; se similar,
  // guarda a MELHOR (mais palavras; empate -> a ultima, take mais fluido).
  const remover = new Set();
  for (let i = 0; i < vivos.length; i++) {
    if (remover.has(i)) continue;
    for (let j = i + 1; j < Math.min(i + 7, vivos.length); j++) {
      if (remover.has(j)) continue;
      if (similaridade(vivos[i].text, vivos[j].text) >= 0.7) {
        const ni = vivos[i].words.length;
        const nj = vivos[j].words.length;
        const perdedor = nj >= ni ? i : j; // empate -> fica o ultimo
        const vencedor = perdedor === i ? j : i;
        remover.add(perdedor);
        descartados.push({
          motivo: `take repetido (ficou o take em ${vivos[vencedor].start.toFixed(2)}s)`,
          ...resumo(vivos[perdedor]),
        });
        if (perdedor === i) break;
      }
    }
  }
  vivos = vivos.filter((_, i) => !remover.has(i));

  log.push(`decupagem: ${utterances.length} falas -> ${vivos.length} (${descartados.length} descartes/separacoes)`);
  return {falas: vivos, descartados};
}

const resumo = (u) => ({
  start: Number(u.start.toFixed(2)),
  end: Number(u.end.toFixed(2)),
  texto: u.text,
});

/** Classifica o papel narrativo de cada fala (para priorizar no corte de duracao). */
export function classificar(falas) {
  const n = falas.length;
  return falas.map((u, i) => {
    const pos = i / Math.max(n - 1, 1);
    const papeis = [];
    if (pos <= 0.12) papeis.push('gancho');
    if (contemAlgum(u.text, RESSALVA)) papeis.push('ressalva');
    if (contemAlgum(u.text, CTA)) papeis.push('cta');
    if (contemAlgum(u.text, ENUMERACAO)) papeis.push('enumeracao');
    if (contemAlgum(u.text, CONCEITUAL)) papeis.push('conceitual');
    if (IMPERATIVO.test(norm(u.text))) papeis.push('comando');
    if (/[?]$/.test(u.text.trim())) papeis.push('pergunta');
    // afirmacao categorica: negacao absoluta ou verbo de obrigacao
    if (/\b(nunca|jamais|sempre|nenhum|nenhuma|tem que|precisa|obrigat)/.test(norm(u.text))) {
      papeis.push('categorica');
    }
    if (!papeis.length) papeis.push('desenvolvimento');
    return {...u, papeis, pos};
  });
}

/**
 * 4) Aperta para a meta de duracao (45-90s). Remove primeiro as falas de
 * 'desenvolvimento' mais longas e menos densas, nunca gancho/ressalva/CTA.
 */
export function ajustarDuracao(falas, {alvoMax = 90, log = []} = {}) {
  const dur = (fs) => fs.reduce((s, u) => s + (u.end - u.start + 2 * HANDLE), 0);
  let atuais = [...falas];
  const cortadas = [];
  const protegidos = new Set(['gancho', 'ressalva', 'cta', 'categorica']);

  while (dur(atuais) > alvoMax && atuais.length > 4) {
    const candidatos = atuais
      .map((u, i) => ({u, i}))
      .filter(({u}) => !u.papeis.some((p) => protegidos.has(p)));
    if (!candidatos.length) break;
    // menor densidade de informacao = menos palavras por segundo
    candidatos.sort(
      (a, b) =>
        a.u.words.length / (a.u.end - a.u.start) - b.u.words.length / (b.u.end - b.u.start),
    );
    const {i, u} = candidatos[0];
    cortadas.push({motivo: 'aperto de duracao', ...resumo(u)});
    atuais.splice(i, 1);
  }
  log.push(`duracao apos aperto: ${dur(atuais).toFixed(1)}s (${cortadas.length} falas cortadas)`);
  return {falas: atuais, cortadas};
}

/**
 * 5) Falas -> SEGMENTOS com ritmo de 2-5s.
 *  - falas curtas contiguas na fonte sao unidas (evita corte a cada 1s)
 *  - falas > 5s viram cortes secos "contiguos" (sem remover audio), so para
 *    manter o ritmo visual
 */
export function montarSegmentos(falas, {fps = 30, alvoMin = 2.0, alvoMax = 5.0} = {}) {
  // 5a) unir falas curtas e contiguas
  const unidas = [];
  for (const u of falas) {
    const ant = unidas[unidas.length - 1];
    const contiguo = ant && u.start - ant.end < 0.55;
    const curto = ant && ant.end - ant.start < alvoMin;
    if (ant && contiguo && curto) {
      ant.end = u.end;
      ant.words = ant.words.concat(u.words);
      ant.text = `${ant.text} ${u.text}`;
      ant.papeis = [...new Set([...ant.papeis, ...u.papeis])];
    } else {
      unidas.push({...u, words: [...u.words], papeis: [...u.papeis]});
    }
  }

  // 5b) dividir os longos em cortes secos contiguos, na fronteira de palavra
  const segs = [];
  for (const u of unidas) {
    const dur = u.end - u.start;
    if (dur <= alvoMax) {
      segs.push(u);
      continue;
    }
    const partes = Math.ceil(dur / (alvoMax * 0.82));
    const alvo = dur / partes;
    let buf = [];
    let ini = u.words[0].start;
    for (let i = 0; i < u.words.length; i++) {
      buf.push(u.words[i]);
      const fim = u.words[i].end;
      const ultimo = i === u.words.length - 1;
      if (fim - ini >= alvo || ultimo) {
        segs.push({
          words: buf,
          start: ini,
          end: fim,
          text: buf.map((w) => w.t).join(' '),
          papeis: u.papeis,
          pos: u.pos,
          contiguoAnterior: segs.length > 0 && buf[0] !== u.words[0],
        });
        buf = [];
        ini = u.words[i + 1] ? u.words[i + 1].start : fim;
      }
    }
  }

  // 5c) handles + tempo na timeline final
  let cursor = 0;
  return segs.map((s, i) => {
    // corte "contiguo" nao ganha handle no ponto de emenda (nao ha audio removido)
    const preHandle = s.contiguoAnterior ? 0 : HANDLE;
    const srcStart = Math.max(0, s.start - preHandle);
    const srcEnd = s.end + HANDLE;
    const durFrames = Math.max(1, Math.round((srcEnd - srcStart) * fps));
    const seg = {
      index: i,
      srcStart: Number(srcStart.toFixed(3)),
      srcEnd: Number(srcEnd.toFixed(3)),
      from: cursor,
      durationInFrames: durFrames,
      text: s.text,
      papeis: s.papeis,
      // deslocamento entre tempo de fonte e tempo final, para reposicionar words
      offset: Number((cursor / fps - srcStart).toFixed(4)),
      words: s.words,
    };
    cursor += durFrames;
    return seg;
  });
}

/**
 * 6) 4.3 — punch-in alternado, micro-translate, creep e zoom de enfase.
 * Nunca dois segmentos seguidos na mesma escala.
 */
export function aplicarEnquadramento(segs, {fps = 30, maxEnfase = 4} = {}) {
  // candidatos a zoom de enfase: afirmacao categorica / ressalva / gancho forte
  const scoreEnfase = (s) => {
    let sc = 0;
    if (s.papeis.includes('categorica')) sc += 3;
    if (s.papeis.includes('ressalva')) sc += 2;
    if (s.papeis.includes('conceitual')) sc += 1;
    const n = norm(s.text);
    sc += n.split(' ').filter((w) => IMPACTO.has(w)).length;
    // segmentos muito curtos nao seguram um zoom dedicado
    if (s.durationInFrames < fps * 1.2) sc -= 3;
    return sc;
  };

  const enfase = new Set(
    segs
      .map((s, i) => ({i, sc: scoreEnfase(s)}))
      .filter(({sc}) => sc >= 3)
      .sort((a, b) => b.sc - a.sc)
      .slice(0, maxEnfase)
      .map(({i}) => i),
  );

  // Dois zooms de enfase colados matam o efeito: o segundo do par vira normal.
  for (const i of [...enfase].sort((a, b) => a - b)) {
    if (enfase.has(i - 1)) enfase.delete(i);
  }

  let alto = false;
  return segs.map((s, i) => {
    if (enfase.has(i)) {
      // apos a enfase (1.28) o proximo tem de sair dela: forca 1.0
      alto = true;
      return {
        ...s,
        scale: 1.28,
        translateX: 0,
        creep: s.durationInFrames > fps * 6 ? 0.02 : 0,
        emphasis: true,
      };
    }
    alto = !alto;
    const scale = alto ? 1.18 : 1.0;
    // micro-variacao de posicao: +-1.5% a 2.5%, sinal alternando
    const mag = 0.015 + ((i % 3) * 0.005);
    const translateX = (i % 2 === 0 ? 1 : -1) * (alto ? mag : mag * 0.6);
    return {
      ...s,
      scale,
      translateX: Number(translateX.toFixed(4)),
      creep: s.durationInFrames > fps * 6 ? 0.025 : 0,
      emphasis: false,
    };
  });
}

/** 7) 4.4 — words -> blocos de legenda de 2-5 palavras por grupo natural. */
export function montarLegendas(segs, {fps = 30, corDestaqueInline = false} = {}) {
  const blocos = [];
  for (const s of segs) {
    let buf = [];
    const flush = () => {
      if (!buf.length) return;
      const from = Math.round((buf[0].start + s.offset) * fps);
      const to = Math.round((buf[buf.length - 1].end + s.offset) * fps);
      // uma palavra critica do bloco recebe corDestaque (theme editorial)
      let hi = null;
      if (corDestaqueInline) {
        const idx = buf.findIndex((w) => IMPACTO.has(norm(w.t)));
        hi = idx >= 0 ? idx : null;
      }
      blocos.push({
        from: Math.max(0, from),
        durationInFrames: Math.max(4, to - from),
        text: buf.map((w) => w.t).join(' ').replace(/\s+([,.!?])/g, '$1'),
        highlightIndex: hi,
      });
      buf = [];
    };
    for (let i = 0; i < s.words.length; i++) {
      buf.push(s.words[i]);
      const prox = s.words[i + 1];
      const gap = prox ? prox.start - s.words[i].end : Infinity;
      const fechou = /[.,!?;:]$/.test(s.words[i].t);
      if (buf.length >= 5 || (buf.length >= 2 && (gap > 0.22 || fechou)) || !prox) flush();
    }
    flush();
  }
  // clamp: um bloco nunca invade o proximo
  for (let i = 0; i < blocos.length - 1; i++) {
    const max = blocos[i + 1].from - blocos[i].from;
    if (max > 0) blocos[i].durationInFrames = Math.min(blocos[i].durationInFrames, max);
  }
  return blocos;
}
