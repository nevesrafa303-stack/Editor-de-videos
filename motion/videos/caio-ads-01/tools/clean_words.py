#!/usr/bin/env python3
"""
Palavras da legenda: texto do whisper medium (tools/transcript-medium.json) com correções de grafia e tempos
alinhados às pausas reais da fala.

O whisper escorrega até ~0,45 s perto das pausas (ex.: "e caso" caindo dentro do silêncio depois de "rede").
Por isso cada frase falada é encaixada, de forma linear, no trecho de fala real entre duas pausas medidas no
áudio (silencedetect -35 dB, 0,4 s). As 8 frases e os índices das palavras foram conferidos à mão.

  python3 -I tools/clean_words.py   -> tools/words.json  [{word, start, end}]
"""
import json, os, re, subprocess
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
W = json.load(open(os.path.join(ROOT, "tools", "transcript-medium.json")))
W = W["words"] if isinstance(W, dict) else W
FIX = {"Círio,": "Sírio,", "Laboratórios": "laboratórios", "preenche": "preencha", "rede": "rede"}
FIX_AT = {41: "rede."}                      # fim da frase "…cobertura nessa rede."
PHRASES = [(0, 12), (13, 41), (42, 58), (59, 72), (73, 83), (84, 94), (95, 98), (99, 111)]

log = subprocess.run(["ffmpeg", "-i", os.path.join(ROOT, "assets", "video", "caio.mp4"), "-vn", "-af",
                      "silencedetect=noise=-35dB:d=0.4", "-f", "null", "-"], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
assert len(st) == len(en) == len(PHRASES) + 1, (st, en)
speech = [(en[i], st[i + 1]) for i in range(len(PHRASES))]

out = []
for (a, b), (s0, s1) in zip(PHRASES, speech):
    w0, w1 = W[a]["start"], W[b]["end"]
    k = (s1 - s0) / (w1 - w0)
    for i in range(a, b + 1):
        t = FIX_AT.get(i, FIX.get(W[i]["text"], W[i]["text"]))
        out.append(dict(word=t, start=round(s0 + (W[i]["start"] - w0) * k, 3), end=round(s0 + (W[i]["end"] - w0) * k, 3)))
json.dump(out, open(os.path.join(ROOT, "tools", "words.json"), "w"), ensure_ascii=False, indent=0)
for (s0, s1), (a, b) in zip(speech, PHRASES):
    print(f"{s0:6.2f}-{s1:6.2f}  " + " ".join(o["word"] for o in out[a:b + 1]))
