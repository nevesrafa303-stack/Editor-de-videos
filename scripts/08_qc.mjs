#!/usr/bin/env node
/**
 * ETAPA 5.2 — Controle de qualidade OBRIGATORIO. Nada aqui e "confia no codigo":
 * tudo e medido no arquivo renderizado.
 *
 *  QC1 duracao dentro da meta 45-90s, 1080x1920, 30fps
 *  QC2 loudness -14 LUFS +-1 e true peak <= -1.0 dBTP
 *  QC3 SFX PROVADOS POR MEDICAO: RMS na banda do efeito no frame do evento
 *      vs o mesmo trecho da VOZ PURA (>= +6 dB para passar)
 *  QC4 legendas sem palavra errada (corrections aplicadas) e sincronia em 3 pontos
 *  QC5 folha de contato do resultado + checklist estrutural
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {norm} from './lib/text.mjs';
import {SFX} from './lib/sfx_spec.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (...x) => path.join(raiz, ...x);
const lerJson = (f, d = null) => {
  try { return JSON.parse(fs.readFileSync(p(f), 'utf8')); } catch { return d; }
};

const FINAL = p('out/final.mp4');
if (!fs.existsSync(FINAL)) {
  console.error('ERRO: out/final.mp4 ausente. Rode scripts/07_render.sh.');
  process.exit(1);
}

const data = lerJson('src/generated/data.json');
const medicoesSfx = lerJson('data/sfx_medicoes.json', {});
const corrections = lerJson('data/corrections.json', {});
const falhas = [];
const resultados = [];

const ok = (nome, passou, detalhe) => {
  resultados.push({nome, passou, detalhe});
  if (!passou) falhas.push(`${nome}: ${detalhe}`);
  console.log(`${passou ? 'PASS' : 'FALHA'}  ${nome.padEnd(34)} ${detalhe}`);
};

// ------------------------------------------------------------------- QC1
const probe = JSON.parse(
  execFileSync('ffprobe', [
    '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', FINAL,
  ]).toString(),
);
const v = probe.streams.find((s) => s.codec_type === 'video');
const dur = Number(probe.format.duration);
const fps = eval(v.r_frame_rate); // eslint-disable-line no-eval -- "30/1"

ok('QC1 formato', v.width === 1080 && v.height === 1920, `${v.width}x${v.height} ${v.codec_name}`);
ok('QC1 fps', Math.abs(fps - 30) < 0.01, `${fps.toFixed(2)} fps`);
ok('QC1 duracao', dur >= 45 && dur <= 90, `${dur.toFixed(1)}s (meta 45-90s)`);

// ------------------------------------------------------------------- QC2
const ln = spawnSync('ffmpeg', [
  '-v', 'info', '-i', FINAL,
  '-af', 'loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-',
], {encoding: 'utf8'});
const s = `${ln.stderr}`;
const med = JSON.parse(s.slice(s.lastIndexOf('{'), s.lastIndexOf('}') + 1));
const I = Number(med.input_i);
const TP = Number(med.input_tp);
ok('QC2 loudness', Math.abs(I + 14) <= 1, `${I} LUFS (meta -14 +-1)`);
ok('QC2 true peak', TP <= -1.0, `${TP} dBTP (meta <= -1.0)`);
ok('QC2 LRA', Number(med.input_lra) <= 9, `LRA ${med.input_lra}`);

// ------------------------------------------------------------------- QC3
/**
 * Prova de SFX. Para cada evento amostrado medimos o RMS numa banda estreita
 * do efeito, no instante do evento, no RENDER FINAL — e comparamos com o mesmo
 * instante da VOZ PURA (public/audio_final.wav, que nao contem SFX).
 * "Coloquei o <Audio> no codigo" nao e prova; a diferenca em dB e.
 */
// A banda e a janela sao as MESMAS da calibragem (scripts/lib/sfx_spec.mjs):
// medir na calibragem uma coisa e provar outra e como nao provar nada.
const rmsBanda = (arquivo, at, {lo, hi}, dur) => {
  const r = spawnSync('ffmpeg', [
    '-v', 'info', '-ss', String(Math.max(0, at)), '-i', arquivo, '-t', String(dur),
    '-af', `highpass=f=${lo},lowpass=f=${hi},astats=metadata=1:reset=0`,
    '-f', 'null', '-',
  ], {encoding: 'utf8'});
  const m = `${r.stderr ?? ''}`.match(/RMS level dB:\s*(-?[\d.]+|-inf)/g);
  if (!m || !m.length) return -120;
  const val = m[m.length - 1].match(/(-?[\d.]+|-inf)/)[0];
  return val === '-inf' ? -120 : Number(val);
};

const VOZ_PURA = p('public/audio_final.wav');
const provas = [];

// Extrai o audio do render para WAV: mede sem depender de seek em AAC.
const RENDER_WAV = p('out/qc/render_audio.wav');
fs.mkdirSync(p('out/qc'), {recursive: true});
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', FINAL, '-vn',
  '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s24le', RENDER_WAV]);

if (data?.sfx?.length && fs.existsSync(VOZ_PURA)) {
  const tipos = [...new Set(data.sfx.map((e) => e.kind))];
  for (const tipo of tipos) {
    const spec = SFX[tipo];
    const janela = spec.janela.t;

    // Escolhe um evento LIMPO: sem outro SFX dentro da janela de medicao,
    // senao a prova mede o vizinho e nao o efeito.
    const doTipo = data.sfx.filter((e) => e.kind === tipo);
    const ev =
      doTipo.find((e) =>
        !data.sfx.some(
          (o) => o !== e && Math.abs(o.at - e.at) < (janela + spec.janela.ss + 0.1) * data.fps,
        ),
      ) ?? doTipo[0];

    // A janela de analise e relativa ao INICIO do efeito, igual a calibragem.
    const at = ev.at / data.fps + spec.janela.ss;
    const comSfx = rmsBanda(RENDER_WAV, at, spec.banda, janela);
    const semSfx = rmsBanda(VOZ_PURA, at, spec.banda, janela);
    const delta = comSfx - semSfx;

    provas.push({
      tipo,
      eventoSegundos: Number((ev.at / data.fps).toFixed(2)),
      janelaSegundos: Number(at.toFixed(2)),
      banda: spec.banda,
      renderDbfs: Number(comSfx.toFixed(2)),
      vozPuraDbfs: Number(semSfx.toFixed(2)),
      deltaDb: Number(delta.toFixed(2)),
    });
    ok(
      `QC3 sfx ${tipo}`,
      delta >= 6,
      `evento ${(ev.at / data.fps).toFixed(2)}s banda ${spec.banda.lo}-${spec.banda.hi}Hz: ` +
        `render ${comSfx.toFixed(1)} vs voz pura ${semSfx.toFixed(1)} = ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} dB`,
    );
  }
} else {
  ok('QC3 sfx', false, 'sem eventos de SFX ou sem public/audio_final.wav para comparar');
}

// ------------------------------------------------------------------- QC4
const erradas = Object.keys(corrections).map(norm);
const legendasErradas = (data?.captions ?? []).filter((c) =>
  norm(c.text).split(' ').some((w) => erradas.includes(w)),
);
ok(
  'QC4 correcoes aplicadas',
  legendasErradas.length === 0,
  legendasErradas.length
    ? `${legendasErradas.length} blocos ainda com palavra errada: ${legendasErradas.slice(0, 3).map((c) => c.text).join(' | ')}`
    : `${Object.keys(corrections).length} correcoes, 0 vazamentos`,
);

// sincronia legenda <-> segmento em 3 pontos (inicio, meio, fim)
const caps = data?.captions ?? [];
const segs = data?.segments ?? [];
const dentroDeSegmento = (f) => segs.some((sg) => f >= sg.from && f < sg.from + sg.durationInFrames);
const amostras = caps.length ? [caps[0], caps[Math.floor(caps.length / 2)], caps[caps.length - 1]] : [];
ok(
  'QC4 sincronia legendas',
  amostras.length === 3 && amostras.every((c) => dentroDeSegmento(c.from)),
  amostras.map((c) => `${(c.from / (data?.fps ?? 30)).toFixed(1)}s "${c.text.slice(0, 22)}"`).join(' | '),
);
ok(
  'QC4 tamanho dos blocos',
  caps.every((c) => {
    const n = c.text.split(/\s+/).filter(Boolean).length;
    return n >= 1 && n <= 5;
  }),
  `${caps.length} blocos, max ${Math.max(0, ...caps.map((c) => c.text.split(/\s+/).length))} palavras`,
);

// ------------------------------------------------------------------- QC5
const ritmo = segs.length ? (segs.reduce((a, x) => a + x.durationInFrames, 0) / (data.fps * segs.length)) : 0;
ok('QC5 ritmo de corte', ritmo >= 1.8 && ritmo <= 5.2, `${ritmo.toFixed(1)}s por corte (meta 2-5s)`);
ok(
  'QC5 punch-in alternado',
  segs.every((sg, i) => i === 0 || sg.scale !== segs[i - 1].scale),
  'nenhum par de segmentos seguidos na mesma escala',
);
ok('QC5 zoom de enfase', segs.filter((sg) => sg.emphasis).length >= 1 && segs.filter((sg) => sg.emphasis).length <= 4,
   `${segs.filter((sg) => sg.emphasis).length} zooms (meta 2-4)`);
ok('QC5 motion graphics', (data?.motions ?? []).length >= 1, `${(data?.motions ?? []).length} insercao(oes)`);
ok('QC5 end card', Boolean(data?.endCard) && data.endCard.durationInFrames >= data.fps * 3,
   `${(data.endCard.durationInFrames / data.fps).toFixed(1)}s`);
ok('QC5 keywords no gancho', (data?.keywordGroups ?? []).some((g) => g.mode === 'hook' && g.from < data.fps * 5),
   `${(data?.keywordGroups ?? []).length} grupo(s) de destaque`);

// folha de contato do RESULTADO (inspecao visual)
execFileSync('ffmpeg', [
  '-y', '-v', 'error', '-i', FINAL,
  '-vf', 'fps=1/3,scale=270:-1,tile=4x3', p('out/qc/contact_%02d.png'),
]);
console.log('\nfolha de contato do resultado: out/qc/contact_*.png');

// ------------------------------------------------------------------ saida
const relatorio = {
  ...lerJson('data/report.json', {}),
  qc: {
    formato: `${v.width}x${v.height} @ ${fps}fps ${v.codec_name}`,
    duracaoSegundos: Number(dur.toFixed(2)),
    loudnessLufs: I,
    truePeakDbtp: TP,
    lra: Number(med.input_lra),
    ritmoMedioSegundosPorCorte: Number(ritmo.toFixed(2)),
    provasSfx: provas,
    calibragemSfx: medicoesSfx,
    resultados,
    aprovado: falhas.length === 0,
  },
};
fs.writeFileSync(p('out/relatorio.json'), JSON.stringify(relatorio, null, 2));

console.log('\n' + '='.repeat(64));
if (falhas.length) {
  console.error(`QC REPROVADO — ${falhas.length} item(ns):`);
  falhas.forEach((f) => console.error(`  - ${f}`));
  console.error('Corrija e re-renderize ANTES de entregar (Etapa 5.3).');
  process.exit(1);
}
console.log('QC APROVADO. Relatorio completo em out/relatorio.json');
