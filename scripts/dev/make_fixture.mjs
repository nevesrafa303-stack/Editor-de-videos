#!/usr/bin/env node
/**
 * FIXTURE DE DESENVOLVIMENTO — nao faz parte da entrega editorial.
 *
 * Gera um "bruto" sintetico (video 4K com rotation 90 + audio com energia nos
 * tempos de fala) e a transcricao correspondente, para provar o pipeline
 * inteiro sem depender de uma gravacao real. Cobre de proposito: conversa de
 * bastidor, take repetido, frase quebrada, gancho com palavras de impacto,
 * enumeracao, trecho conceitual, lista de comandos e CTA.
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const p = (...x) => path.join(raiz, ...x);
const ff = (a) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...a], {stdio: 'pipe'});

// [inicio, texto, wps] — wps = palavras por segundo (ritmo de fala)
const ROTEIRO = [
  [0.0,  'testando um dois tres ta gravando'],                                       // bastidor
  [2.6,  'o seu chefe grita com voce na frente de todo mundo'],                       // gancho (grita)
  [6.0,  'ele humilha ele ameaca e voce acha que e normal'],                          // gancho (humilha/ameaca)
  [10.2, 'isso nao e normal isso e assedio moral e a lei protege voce'],              // categorica
  [15.0, 'deixa eu repetir essa parte ficou muito lenta'],                            // bastidor
  [17.8, 'isso nao e normal isso e assedio moral e a lei protege voce sempre'],       // take repetido (melhor)
  [23.4, 'existem tres provas que o juiz sempre aceita no processo'],                 // enumeracao
  [27.6, 'mensagens de whatsapp, e-mails do trabalho, e o depoimento de colegas'],    // itens da lista
  [33.2, 'na pratica isso significa que a sua palavra deixa de ser a unica prova'],   // conceitual
  [39.0, 'e quando o processo comeca fica muito mais'],                               // frase quebrada
  [42.0, 'mas atencao existe um prazo e ele corre contra voce'],                      // ressalva
  [46.4, 'nao assine nenhum documento sem ler'],                                      // comando
  [49.6, 'nao apague as conversas do celular'],                                       // comando
  [52.8, 'nao converse sobre o caso publicamente'],                                   // comando
  [56.2, 'com essas provas em maos a indenizacao sai muito mais rapido'],             // beneficio
  [61.4, 'ah eh hum'],                                                                // ruido
  [63.0, 'se voce esta passando por isso salve este video e clica aqui embaixo'],     // CTA
  [68.4, 'o link para agendamento esta na bio e eu te espero do outro lado'],         // CTA
];

const WPS = 3.1;
const segments = [];
let idSeg = 0;

for (const [inicio, texto] of ROTEIRO) {
  const palavras = texto.split(/\s+/);
  const dur = palavras.length / WPS;
  const words = palavras.map((w, i) => ({
    word: w,
    start: Number((inicio + (i * dur) / palavras.length).toFixed(3)),
    end: Number((inicio + ((i + 1) * dur) / palavras.length - 0.02).toFixed(3)),
  }));
  segments.push({
    id: idSeg++,
    start: inicio,
    end: Number((inicio + dur).toFixed(3)),
    text: ` ${texto}`,
    words,
  });
}

const transcript = {text: ROTEIRO.map(([, t]) => t).join(' '), segments, language: 'pt'};
fs.mkdirSync(p('data'), {recursive: true});
fs.mkdirSync(p('assets/raw'), {recursive: true});
fs.writeFileSync(p('data/transcript.json'), JSON.stringify(transcript, null, 2));

const fim = segments[segments.length - 1].end + 1.5;
console.log(`roteiro sintetico: ${segments.length} falas, ${fim.toFixed(1)}s de bruto`);

// --- audio: rajadas com formantes nos tempos de fala, silencio entre elas ---
// Duas senoides (fundamental + formante) por fala dao energia realista para
// loudnorm/astats e deixam as bandas de SFX livres.
const trechos = segments.map((s) => {
  const dur = (s.end - s.start).toFixed(3);
  return (
    `sine=frequency=165:duration=${dur}:sample_rate=48000,` +
    `atempo=1,volume=0.5[v${s.id}a];` // placeholder substituido abaixo
  );
});
void trechos;

// Montagem mais simples e robusta: gera cada fala em arquivo e concatena com silencios.
fs.mkdirSync(p('build/fixture'), {recursive: true});
const partes = [];
let cursor = 0;
for (const s of segments) {
  const gap = s.start - cursor;
  if (gap > 0.01) {
    const sil = p('build/fixture', `sil_${s.id}.wav`);
    ff(['-f', 'lavfi', '-i', `anullsrc=r=48000:cl=mono:d=${gap.toFixed(3)}`, '-c:a', 'pcm_s16le', sil]);
    partes.push(sil);
  }
  const dur = (s.end - s.start).toFixed(3);
  const fala = p('build/fixture', `fala_${s.id}.wav`);
  ff([
    '-f', 'lavfi', '-i', `sine=frequency=165:duration=${dur}:sample_rate=48000`,
    '-f', 'lavfi', '-i', `sine=frequency=740:duration=${dur}:sample_rate=48000`,
    '-f', 'lavfi', '-i', `anoisesrc=color=pink:duration=${dur}:sample_rate=48000:amplitude=0.06`,
    '-filter_complex',
    // tremolo simula silabas; passa-banda de voz mantem as bandas de SFX limpas
    '[0:a]volume=0.55[a];[1:a]volume=0.22[b];[2:a]volume=0.5[c];' +
    '[a][b][c]amix=inputs=3:normalize=0,tremolo=f=5.2:d=0.7,' +
    'highpass=f=110,lowpass=f=3400,volume=0.62',
    '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', fala,
  ]);
  partes.push(fala);
  cursor = s.end;
}
const silFinal = p('build/fixture/sil_end.wav');
ff(['-f', 'lavfi', '-i', `anullsrc=r=48000:cl=mono:d=${(fim - cursor).toFixed(3)}`, '-c:a', 'pcm_s16le', silFinal]);
partes.push(silFinal);

const lista = p('build/fixture/concat.txt');
fs.writeFileSync(lista, partes.map((f) => `file '${f}'`).join('\n'));
ff(['-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', p('build/fixture/audio.wav')]);

// --- video: 2160x3840 "vertical de camera" gravado como 3840x2160 + rotation 90 ---
const RAW = p('assets/raw/bruto_fixture.mov');
ff([
  '-f', 'lavfi', '-i', `testsrc2=size=3840x2160:rate=30:duration=${fim.toFixed(2)}`,
  '-i', p('build/fixture/audio.wav'),
  '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '30', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '128k',
  '-metadata:s:v:0', 'rotate=90',
  '-shortest', RAW,
]);
// grava o displaymatrix de verdade (o -metadata rotate e legado);
// -display_rotation e opcao de ENTRADA e reescreve a side data no remux.
ff(['-display_rotation', '90', '-i', RAW, '-c', 'copy', p('assets/raw/bruto.mov')]);
fs.rmSync(RAW, {force: true});

console.log(`bruto sintetico: assets/raw/bruto.mov`);
console.log('transcricao: data/transcript.json');
