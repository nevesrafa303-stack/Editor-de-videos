#!/usr/bin/env python3
"""
Palavras da legenda do "Ads 01 · reajuste" (v2, corte só nas pausas): texto do whisper medium rodado no áudio JÁ CORTADO
(tools/transcript-medium.json), com as correções de grafia conferidas à mão e os tempos encaixados nas pausas
reais da fala.

O whisper escorrega perto das pausas e dos cortes (ex.: "dá pra sair dessa" começando 0,4 s antes do corte).
Por isso cada frase é encaixada, de forma linear, no trecho de fala real medido no áudio cortado
(silencedetect -42 dB, 0,07 s). As frases e os índices das palavras foram conferidos à mão.

  python3 -I tools/clean_words.py <voice_cut_raw.wav>   -> tools/words.json  [{word, start, end}]
"""
import json, os, re, subprocess, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
W = json.load(open(os.path.join(ROOT, "tools", "transcript-medium.json")))
W = W["words"] if isinstance(W, dict) else W
FIX_AT = {68: "Luiz,", 77: "vêm", 78: "junto.", 79: "Telemedicina", 125: "especialistas"}
SPLIT = {75: ("E", "os"), 84: ("e,", "em"), 135: ("E", "não")}   # "Eos" ; "e" -> "e, em" (vários planos) ; "Enão"
# (primeira palavra, última palavra) de cada trecho de fala, na ordem dos trechos medidos; as palavras 149-150
# ("e aí") são alucinação do whisper no silêncio do fim e ficam de fora
PHRASES = [(0, 9), (10, 15), (16, 23), (24, 33), (34, 35), (36, 43), (44, 46), (47, 50), (51, 65), (66, 66), (67, 68),
           (69, 70), (71, 71), (72, 74), (75, 78), (79, 83), (84, 89), (90, 94), (95, 101), (102, 121), (122, 125),
           (126, 129), (130, 131), (132, 134), (135, 138), (139, 144), (145, 148)]

log = subprocess.run(["ffmpeg", "-i", sys.argv[1], "-af", "silencedetect=noise=-42dB:d=0.07", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
speech = [(en[i], st[i + 1]) for i in range(len(en) - 1) if st[i + 1] - en[i] > 0.05]   # ignora estalos
assert len(speech) == len(PHRASES), (len(speech), speech)

out = []
for (a, b), (s0, s1) in zip(PHRASES, speech):
    w0, w1 = W[a]["start"], W[b]["end"]
    k = (s1 - s0) / (w1 - w0)
    m = lambda t: round(s0 + (t - w0) * k, 3)
    for i in range(a, b + 1):
        ws, we = m(W[i]["start"]), m(W[i]["end"])
        if i in SPLIT:
            x, y = SPLIT[i]
            mid = round((ws + we) / 2, 3)
            out += [dict(word=x, start=ws, end=mid), dict(word=y, start=mid, end=we)]
        else:
            out.append(dict(word=FIX_AT.get(i, W[i]["text"]), start=ws, end=we))
json.dump(out, open(os.path.join(ROOT, "tools", "words.json"), "w"), ensure_ascii=False, indent=0)
k = 0
for (s0, s1), (a, b) in zip(speech, PHRASES):
    n = b - a + 1 + sum(1 for i in SPLIT if a <= i <= b)
    print(f"{s0:6.2f}-{s1:6.2f}  " + " ".join(o["word"] for o in out[k:k + n]))
    k += n
