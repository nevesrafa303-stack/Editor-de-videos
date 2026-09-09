#!/usr/bin/env node
/**
 * ETAPA 2 — DECUPAGEM -> EDL -> data.ts do Remotion.
 *
 * Entradas:  data/transcript.json  (Whisper word timestamps)
 *            data/corrections.json (opcional — Etapa 1.6)
 *            data/overrides.json   (opcional — decisoes editoriais manuais)
 *            data/probe_summary.json
 * Saidas:    data/edl.json          (EDL legivel, para revisao humana)
 *            data/audio_plan.json   (trechos para o corte de audio da Etapa 3)
 *            src/generated/data.json (consumido pela composicao)
 *            data/report.json       (mini-relatorio da Etapa 5.4)
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  flattenWords, buildUtterances, decupar, classificar, ajustarDuracao,
  montarSegmentos, aplicarEnquadramento, montarLegendas, HANDLE,
} from './lib/decupagem.mjs';
import {
  keywordsDoGancho, gruposDeComandos, montarInserts, montarMotion,
  montarQaCard, agendarSfx, flashesDeSaida, detectarPreset,
} from './lib/enriquecer.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (...x) => path.join(raiz, ...x);
const lerJson = (f, fallback = null) => {
  try {
    return JSON.parse(fs.readFileSync(p(f), 'utf8'));
  } catch {
    return fallback;
  }
};

const FPS = 30;
const W = 1080;
const H = 1920;
const END_CARD_S = 3.5;

const log = [];

// ---------------------------------------------------------------- entradas
const transcript = lerJson('data/transcript.json');
if (!transcript) {
  console.error(
    'ERRO: data/transcript.json ausente. Rode scripts/01_analyze.sh e scripts/02_transcribe.sh.',
  );
  process.exit(1);
}
const corrections = lerJson('data/corrections.json', {});
const overrides = lerJson('data/overrides.json', {});
const ganhos = lerJson('data/sfx_gains.json', {hit: 1, whoosh: 1, pop: 1, riser: 1});

// ------------------------------------------------------- 1) palavras + 2) falas
const words = flattenWords(transcript, corrections);
const nCorrigidas = words.filter((w) => w.corrigido).length;
log.push(`${words.length} palavras com timestamp; ${nCorrigidas} corrigidas`);

const utterances = buildUtterances(words);

// -------------------------------------------------------------- 3) decupagem
const silences = lerJson('data/silences.json', []);
const {falas, descartados} = decupar(utterances, {log, silences});
const classificadas = classificar(falas);

const alvoMax = overrides.duracaoMaxSegundos ?? 90;
const {falas: enxutas, cortadas} = ajustarDuracao(classificadas, {alvoMax, log});

// Override manual: o editor pode fixar a EDL a mao em data/overrides.json
const finais = overrides.edl
  ? aplicarEdlManual(overrides.edl, words)
  : enxutas;

// -------------------------------------------------- 5) segmentos + 6) enquadramento
let segs = montarSegmentos(finais, {fps: FPS});
segs = aplicarEnquadramento(segs, {fps: FPS, maxEnfase: overrides.maxEnfase ?? 4});

const framesFala = segs.reduce((s, x) => s + x.durationInFrames, 0);
const endCardFrames = Math.round(END_CARD_S * FPS);
const total = framesFala + endCardFrames;

// ----------------------------------------------------------------- 7) legendas
const textoCompleto = segs.map((s) => s.text).join(' ');
const preset = overrides.themePreset ?? detectarPreset(textoCompleto);
const captions = montarLegendas(segs, {
  fps: FPS,
  corDestaqueInline: preset === 'editorial',
});

// ------------------------------------------------------- 8) camadas de enfase
const gancho = keywordsDoGancho(segs, {fps: FPS});
const comandos = gruposDeComandos(segs, {fps: FPS});
const keywordGroups = [gancho, ...comandos].filter(Boolean);

const brollDisponivel = fs.existsSync(p('public/broll'))
  ? fs.readdirSync(p('public/broll')).filter((f) => /\.(mp4|mov|webm)$/i.test(f)).map((f) => `broll/${f}`)
  : [];

const inserts = montarInserts(segs, {fps: FPS, brollDisponivel});
const motions = montarMotion(segs, {
  fps: FPS,
  ocupados: [...inserts, ...keywordGroups],
  total: framesFala,
});
const qaCard = montarQaCard(segs, {fps: FPS, pergunta: overrides.perguntaQa ?? null});

const sfx = agendarSfx({keywordGroups, inserts, motions, segs, qaCard, ganhos, fps: FPS});
const flashes = flashesDeSaida(inserts, motions, framesFala);

// -------------------------------------------------------------------- saidas
const assinatura = {
  nome: overrides.nome ?? 'SEU NOME',
  titulo: overrides.titulo ?? 'ESPECIALISTA',
  logoSrc: fs.existsSync(p('public/logo.png')) ? 'logo.png' : (overrides.logoSrc ?? null),
};

const data = {
  fps: FPS,
  width: W,
  height: H,
  durationInFrames: total,
  videoSrc: 'mezzanine.mp4',
  audioSrc: fs.existsSync(p('public/audio_final.wav')) ? 'audio_final.wav' : null,
  musicSrc: null,
  segments: segs.map(({words: _w, papeis: _p, index: _i, offset: _o, ...s}) => s),
  captions,
  keywordGroups,
  inserts,
  motions,
  qaCard,
  endCard: {from: framesFala, durationInFrames: endCardFrames},
  sfx,
  flashes,
  themePreset: preset,
  assinatura,
};

fs.mkdirSync(p('src/generated'), {recursive: true});
fs.writeFileSync(p('src/generated/data.json'), JSON.stringify(data, null, 2));

// EDL legivel para revisao humana
const edl = segs.map((s) => ({
  n: s.index,
  origem: `${s.srcStart.toFixed(2)}s -> ${s.srcEnd.toFixed(2)}s`,
  final: `${(s.from / FPS).toFixed(2)}s (+${(s.durationInFrames / FPS).toFixed(2)}s)`,
  escala: s.emphasis ? `${s.scale} (ENFASE)` : s.scale,
  papeis: s.papeis.join(','),
  texto: s.text,
}));
fs.writeFileSync(p('data/edl.json'), JSON.stringify(edl, null, 2));

// Plano de audio para a Etapa 3 (corte sample-accurate no FFmpeg)
fs.writeFileSync(
  p('data/audio_plan.json'),
  JSON.stringify(
    {
      fps: FPS,
      endCardSeconds: END_CARD_S,
      cuts: segs.map((s) => ({start: s.srcStart, end: s.srcEnd})),
    },
    null,
    2,
  ),
);

const relatorio = {
  brutoSegundos: lerJson('data/probe_summary.json', {})?.duration ?? null,
  finalSegundos: Number((total / FPS).toFixed(2)),
  cortes: segs.length,
  zoomsDeEnfase: segs.filter((s) => s.emphasis).length,
  blocosDeLegenda: captions.length,
  keywords: keywordGroups.reduce((n, g) => n + g.items.length, 0),
  inserts: inserts.map((i) => ({kind: i.kind, layout: i.layout, at: (i.from / FPS).toFixed(1) + 's'})),
  motion: motions.map((m) => ({kind: m.kind, at: (m.from / FPS).toFixed(1) + 's'})),
  qaCard: Boolean(qaCard),
  eventosSfx: sfx.length,
  themePreset: preset,
  correcoesAplicadas: nCorrigidas,
  takesDescartados: descartados,
  cortadasPorDuracao: cortadas,
  log,
};
fs.writeFileSync(p('data/report.json'), JSON.stringify(relatorio, null, 2));

// -------------------------------------------------------------------- console
console.log(log.join('\n'));
console.log(
  `\nEDL: ${segs.length} cortes | ${(total / FPS).toFixed(1)}s final ` +
    `| ritmo medio ${(framesFala / FPS / segs.length).toFixed(1)}s/corte`,
);
console.log(`theme: ${preset} | keywords: ${relatorio.keywords} | inserts: ${inserts.length} | motion: ${motions.length}`);
console.log(`SFX agendados: ${sfx.length}`);

const ritmo = framesFala / FPS / segs.length;
if (ritmo < 1.8 || ritmo > 5.2) console.warn(`AVISO: ritmo medio ${ritmo.toFixed(1)}s fora da meta 2-5s`);
if (total / FPS < 45 || total / FPS > 90) console.warn(`AVISO: duracao ${(total / FPS).toFixed(1)}s fora da meta 45-90s`);
if (!motions.length) console.warn('AVISO: nenhum motion graphics — a Etapa 4.7 exige pelo menos um.');

// ------------------------------------------------------------------ helpers
/** overrides.edl = [{start, end}] em segundos do bruto; reanexa as words. */
function aplicarEdlManual(lista, todas) {
  return lista.map((r) => {
    const ws = todas.filter((w) => w.start >= r.start - HANDLE && w.end <= r.end + HANDLE);
    return {
      words: ws,
      start: ws.length ? ws[0].start : r.start,
      end: ws.length ? ws[ws.length - 1].end : r.end,
      text: ws.map((w) => w.t).join(' '),
      papeis: r.papeis ?? ['desenvolvimento'],
      pos: 0,
    };
  });
}
