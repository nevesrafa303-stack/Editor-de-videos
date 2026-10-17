#!/usr/bin/env node
// open_gaps.mjs — depois do carve: nos intervalos sem fala maiores que 1 s a trilha
// volta ao volume e ao timbre cheios (o carve solta devagar e deixava um "buraco"
// na revelação do logo). Lê os tempos de fala dos word_timestamps da HeyGen.
//
//   node tools/open_gaps.mjs   (reescreve o data-automation do #el-bgm em index.html)

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(ROOT, "index.html");
let html = readFileSync(file, "utf8");

const decode = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
const encode = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

// fala real de cada locução: do primeiro ao último word_timestamp (sem <start>/<end>)
const speech = [];
for (const m of html.matchAll(/<audio id="el-vo\d-voice"[^>]*src="assets\/voice\/(\d+)\.wav" data-start="([\d.]+)"/g)) {
  const words = JSON.parse(readFileSync(join(ROOT, `assets/voice/${m[1]}.json`), "utf8")).response.word_timestamps.filter(
    (w) => !w.word.startsWith("<"),
  );
  const at = Number(m[2]);
  speech.push([at + words[0].start, at + words[words.length - 1].end]);
}
speech.sort((a, b) => a[0] - b[0]);
const gaps = [];
for (let i = 1; i < speech.length; i++) {
  const [g0, g1] = [speech[i - 1][1] + 0.05, speech[i][0] - 0.1];
  if (g1 - g0 > 1.0) gaps.push([g0, g1]);
}

const re = /(<audio id="el-bgm"[^>]*data-automation=")([^"]*)(")/;
const m = html.match(re);
if (!m) throw new Error("el-bgm sem data-automation: rode o carve antes");
const auto = JSON.parse(decode(m[2]));
const interp = (pts, t) => {
  if (t <= pts[0].t) return pts[0].v;
  for (let i = 1; i < pts.length; i++)
    if (t <= pts[i].t) {
      const a = pts[i - 1], b = pts[i];
      return a.v + ((b.v - a.v) * (t - a.t)) / (b.t - a.t || 1);
    }
  return pts[pts.length - 1].v;
};
const r3 = (x) => Math.round(x * 1000) / 1000;
for (const lane of auto.lanes) {
  let pts = lane.points;
  for (const [g0, g1] of gaps) {
    const v0 = interp(pts, g0), v1 = interp(pts, g1);
    pts = [
      ...pts.filter((p) => p.t < g0),
      { t: r3(g0), v: v0 },
      { t: r3(Math.min(g0 + 0.3, (g0 + g1) / 2)), v: 0 },
      { t: r3(Math.max(g1 - 0.25, (g0 + g1) / 2)), v: 0 },
      { t: r3(g1), v: v1 },
      ...pts.filter((p) => p.t > g1),
    ];
  }
  lane.points = pts;
}
html = html.replace(re, `$1${encode(JSON.stringify(auto))}$3`);
writeFileSync(file, html);
console.log(`trilha aberta nos intervalos sem fala: ${gaps.map(([a, b]) => `${a.toFixed(2)}–${b.toFixed(2)} s`).join(", ") || "nenhum"}`);
