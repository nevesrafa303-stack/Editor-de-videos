#!/usr/bin/env node
/**
 * ETAPA 3.4 — Paleta de SFX sintetizada + CALIBRAGEM POR MEDICAO.
 *
 * Regra que o QC ensinou: calibrar e provar tem de medir A MESMA COISA.
 * Por isso banda, janela e alvo vem de scripts/lib/sfx_spec.mjs, e o alvo e
 * RELATIVO a voz ja tratada — "perceptivel mas abaixo da voz" so tem sentido
 * medido contra a voz daquele video.
 *
 * Precisa de public/audio_final.wav (Etapa 3) — rode DEPOIS de 05_audio.mjs.
 * Saida: public/sfx/*.wav + data/sfx_gains.json (lido por 04_build_edl.mjs).
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {SFX, RECEITAS, SR} from './lib/sfx_spec.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (...x) => path.join(raiz, ...x);
const ff = (args) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], {stdio: 'pipe'});

/** RMS (dBFS) de um arquivo, opcionalmente numa janela e/ou numa banda. */
function rms(arquivo, {ss = 0, t = null, lo = null, hi = null} = {}) {
  const filtros = [];
  if (lo !== null) filtros.push(`highpass=f=${lo}`);
  if (hi !== null) filtros.push(`lowpass=f=${hi}`);
  filtros.push('astats=metadata=1:reset=0');

  const args = ['-v', 'info', '-ss', String(ss), '-i', arquivo];
  if (t !== null) args.push('-t', String(t));
  args.push('-af', filtros.join(','), '-f', 'null', '-');

  const r = spawnSync('ffmpeg', args, {encoding: 'utf8'});
  const m = `${r.stderr ?? ''}`.match(/RMS level dB:\s*(-?[\d.]+|-inf)/g);
  if (!m || !m.length) return -120;
  const v = m[m.length - 1].match(/(-?[\d.]+|-inf)/)[0];
  return v === '-inf' ? -120 : Number(v);
}

function pico(arquivo) {
  const r = spawnSync(
    'ffmpeg',
    ['-v', 'info', '-i', arquivo, '-af', 'astats=metadata=1:reset=0', '-f', 'null', '-'],
    {encoding: 'utf8'},
  );
  const m = `${r.stderr ?? ''}`.match(/Peak level dB:\s*(-?[\d.]+|-inf)/g);
  if (!m || !m.length) return 0;
  const v = m[m.length - 1].match(/(-?[\d.]+|-inf)/)[0];
  return v === '-inf' ? -120 : Number(v);
}

const VOZ = p('public/audio_final.wav');
if (!fs.existsSync(VOZ)) {
  console.error(
    'ERRO: public/audio_final.wav ausente.\n' +
      'A calibragem e relativa a voz tratada — rode scripts/05_audio.mjs primeiro.',
  );
  process.exit(1);
}

fs.mkdirSync(p('public/sfx'), {recursive: true});
fs.mkdirSync(p('data'), {recursive: true});

const vozLarga = rms(VOZ);
console.log(`voz tratada: ${vozLarga.toFixed(2)} dBFS RMS (banda larga)\n`);

const ganhos = {};
const medicoes = {};

for (const [nome, receita] of Object.entries(RECEITAS)) {
  const spec = SFX[nome];
  const destino = p('public/sfx', `${nome}.wav`);
  ff([...receita, '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_s16le', destino]);

  // Medidas NA MESMA BANDA E JANELA que o QC vai usar depois.
  const sfxBanda = rms(destino, {...spec.janela, ...spec.banda});
  const vozBanda = rms(VOZ, {...spec.banda});

  // Alvo: ficar `margemDb` acima da voz naquela banda.
  const alvo = vozBanda + spec.margemDb;
  let ganho = Math.pow(10, (alvo - sfxBanda) / 20);
  const razoes = [];

  // Teto 1 — em banda larga o efeito tem de ficar abaixo da voz.
  const sfxLarga = rms(destino);
  const tetoVoz = Math.pow(10, (vozLarga + spec.tetoRelativoDb - sfxLarga) / 20);
  if (ganho > tetoVoz) {
    ganho = tetoVoz;
    razoes.push('teto relativo a voz');
  }

  // Teto 2 — o pico do efeito nao pode chegar perto de 0 dBFS.
  const pk = pico(destino);
  const tetoPico = Math.pow(10, (-3 - pk) / 20);
  if (ganho > tetoPico) {
    ganho = tetoPico;
    razoes.push('teto de pico');
  }

  ganho = Number(ganho.toFixed(3));
  const contribuicao = sfxBanda + 20 * Math.log10(ganho);
  const margemReal = contribuicao - vozBanda;

  ganhos[nome] = ganho;
  medicoes[nome] = {
    banda: spec.banda,
    janela: spec.janela,
    sfxNaBandaDbfs: Number(sfxBanda.toFixed(2)),
    vozNaBandaDbfs: Number(vozBanda.toFixed(2)),
    picoDbfs: Number(pk.toFixed(2)),
    ganhoLinear: ganho,
    contribuicaoNaBandaDbfs: Number(contribuicao.toFixed(2)),
    margemSobreVozDb: Number(margemReal.toFixed(2)),
    limitadoPor: razoes,
  };

  const aviso = margemReal < 6 ? '  <<< ABAIXO DE +6 dB, O QC VAI REPROVAR' : '';
  console.log(
    `${nome.padEnd(7)} banda ${String(spec.banda.lo).padStart(4)}-${String(spec.banda.hi).padEnd(4)}Hz  ` +
      `sfx ${sfxBanda.toFixed(1)}  voz ${vozBanda.toFixed(1)}  -> ganho ${String(ganho).padStart(7)}  ` +
      `= voz ${margemReal >= 0 ? '+' : ''}${margemReal.toFixed(1)} dB` +
      `${razoes.length ? ` [${razoes.join(', ')}]` : ''}${aviso}`,
  );
}

fs.writeFileSync(p('data/sfx_gains.json'), JSON.stringify(ganhos, null, 2));
fs.writeFileSync(p('data/sfx_medicoes.json'), JSON.stringify(medicoes, null, 2));

const fracos = Object.entries(medicoes).filter(([, m]) => m.margemSobreVozDb < 6);
if (fracos.length) {
  console.error(
    `\nAVISO: ${fracos.map(([n]) => n).join(', ')} nao alcanca(m) +6 dB sobre a voz.\n` +
      'Os tetos de seguranca limitaram o ganho. Reveja a receita do efeito em\n' +
      'scripts/lib/sfx_spec.mjs (banda ou conteudo espectral) antes de renderizar.',
  );
}
console.log('\ngravado: data/sfx_gains.json e public/sfx/*.wav');
