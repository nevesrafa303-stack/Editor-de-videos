#!/usr/bin/env node
/**
 * ETAPA 3 — Tratamento de audio.
 *  1) corte/concat sample-accurate dos trechos da EDL
 *  2) voz: highpass 80Hz, de-esser leve, compressor, loudnorm -14 LUFS (2 passadas)
 *  3) trilha de fundo ~20 dB abaixo da voz, subindo no end card
 * Saida: public/audio_final.wav (consumido pelo <Audio> do Remotion)
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (...x) => path.join(raiz, ...x);
const ff = (args) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], {stdio: 'pipe'});
const SR = 48000;

const plano = JSON.parse(fs.readFileSync(p('data/audio_plan.json'), 'utf8'));
const VOZ = p('build/voice_raw.wav');
if (!fs.existsSync(VOZ)) {
  console.error('ERRO: build/voice_raw.wav ausente. Rode scripts/01_analyze.sh.');
  process.exit(1);
}

fs.mkdirSync(p('build/audio'), {recursive: true});
fs.mkdirSync(p('public'), {recursive: true});

// ------------------------------------------------- 1) corte sample-accurate
// -ss ANTES de -i faria seek por keyframe; em WAV PCM o corte e exato, mas
// usamos atrim (por amostra) para nao depender disso.
const partes = [];
plano.cuts.forEach((c, i) => {
  const out = p('build/audio', `cut_${String(i).padStart(3, '0')}.wav`);
  ff([
    '-i', VOZ,
    '-af', `atrim=start=${c.start}:end=${c.end},asetpts=N/SR/TB`,
    '-ar', String(SR), '-ac', '1', '-c:a', 'pcm_s24le', out,
  ]);
  partes.push(out);
});

const lista = p('build/audio/concat.txt');
fs.writeFileSync(lista, partes.map((f) => `file '${f}'`).join('\n'));
ff(['-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', p('build/audio/voz_cortada.wav')]);

const durFala = Number(
  execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0',
    p('build/audio/voz_cortada.wav'),
  ]).toString().trim(),
);
console.log(`voz cortada: ${plano.cuts.length} trechos, ${durFala.toFixed(2)}s`);

// --------------------------------------------------------- 2) cadeia de voz
// de-esser leve: reduz 5-8kHz sem tirar o brilho da consoante
const CADEIA_VOZ = [
  'highpass=f=80',
  'equalizer=f=6500:width_type=o:width=1.2:g=-3',
  'acompressor=threshold=-18dB:ratio=3:attack=5:release=120:makeup=2',
].join(',');

ff([
  '-i', p('build/audio/voz_cortada.wav'),
  '-af', CADEIA_VOZ,
  '-ar', String(SR), '-ac', '1', '-c:a', 'pcm_s24le', p('build/audio/voz_tratada.wav'),
]);

// loudnorm em 2 passadas: passada 1 mede, passada 2 aplica com os valores medidos.
const medir = spawnSync('ffmpeg', [
  '-v', 'info', '-i', p('build/audio/voz_tratada.wav'),
  '-af', 'loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json',
  '-f', 'null', '-',
], {encoding: 'utf8'});
const jsonMedido = JSON.parse(
  `${medir.stderr}`.slice(`${medir.stderr}`.lastIndexOf('{'), `${medir.stderr}`.lastIndexOf('}') + 1),
);
console.log(
  `loudnorm passada 1: I=${jsonMedido.input_i} LUFS  TP=${jsonMedido.input_tp}  LRA=${jsonMedido.input_lra}`,
);

const loudnorm2 =
  `loudnorm=I=-14:TP=-1.5:LRA=7:` +
  `measured_I=${jsonMedido.input_i}:measured_TP=${jsonMedido.input_tp}:` +
  `measured_LRA=${jsonMedido.input_lra}:measured_thresh=${jsonMedido.input_thresh}:` +
  `offset=${jsonMedido.target_offset}:linear=true:print_format=summary`;

ff([
  '-i', p('build/audio/voz_tratada.wav'),
  '-af', loudnorm2,
  '-ar', String(SR), '-ac', '2', '-c:a', 'pcm_s24le', p('build/audio/voz_final.wav'),
]);

// --------------------------------------------------------------- 3) trilha
const musicas = fs.existsSync(p('assets/music'))
  ? fs.readdirSync(p('assets/music')).filter((f) => /\.(mp3|wav|m4a|aac|ogg)$/i.test(f))
  : [];

const durTotal = durFala + plano.endCardSeconds;
const inicioEndCard = durFala;

if (!musicas.length) {
  // Sem trilha: apenas estende com silencio para cobrir o end card.
  ff([
    '-i', p('build/audio/voz_final.wav'),
    '-af', `apad=whole_dur=${durTotal.toFixed(3)},afade=t=out:st=${(durTotal - 0.5).toFixed(3)}:d=0.5`,
    '-ar', String(SR), '-ac', '2', '-c:a', 'pcm_s24le', p('public/audio_final.wav'),
  ]);
  console.warn(
    'AVISO: nenhuma trilha em assets/music/. Seguindo sem musica — registrar como pendencia no relatorio.',
  );
} else {
  const trilha = p('assets/music', musicas[0]);
  console.log(`trilha: ${musicas[0]}`);
  // -20 dB abaixo da voz durante a fala; sobe ~8 dB no end card (sem fala).
  const VOL_FALA = Math.pow(10, -20 / 20).toFixed(4);
  const VOL_END = Math.pow(10, -12 / 20).toFixed(4);
  ff([
    '-i', p('build/audio/voz_final.wav'),
    '-stream_loop', '-1', '-i', trilha,
    '-filter_complex',
    `[0:a]apad=whole_dur=${durTotal.toFixed(3)}[voz];` +
    `[1:a]atrim=0:${durTotal.toFixed(3)},asetpts=N/SR/TB,` +
    `volume='if(lt(t,${inicioEndCard.toFixed(3)}),${VOL_FALA},${VOL_END})':eval=frame,` +
    `afade=t=in:st=0:d=1.2,afade=t=out:st=${(durTotal - 1.2).toFixed(3)}:d=1.2[mus];` +
    `[voz][mus]amix=inputs=2:duration=first:normalize=0,` +
    `afade=t=out:st=${(durTotal - 0.5).toFixed(3)}:d=0.5[out]`,
    '-map', '[out]', '-ar', String(SR), '-ac', '2', '-c:a', 'pcm_s24le',
    p('public/audio_final.wav'),
  ]);
}

// verificacao final da faixa (a mix com SFX e medida de novo no QC)
const vf = spawnSync('ffmpeg', [
  '-v', 'info', '-i', p('public/audio_final.wav'),
  '-af', 'loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-',
], {encoding: 'utf8'});
const m2 = JSON.parse(
  `${vf.stderr}`.slice(`${vf.stderr}`.lastIndexOf('{'), `${vf.stderr}`.lastIndexOf('}') + 1),
);
console.log(`public/audio_final.wav: I=${m2.input_i} LUFS  TP=${m2.input_tp} dBTP  LRA=${m2.input_lra}`);
fs.writeFileSync(
  p('data/audio_medicoes.json'),
  JSON.stringify({vozPre: jsonMedido, faixaFinal: m2, trilha: musicas[0] ?? null, durTotal}, null, 2),
);
