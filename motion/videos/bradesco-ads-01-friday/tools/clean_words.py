#!/usr/bin/env python3
"""
Palavras da legenda do "Ads 01 Friday Bradesco": texto e tempos do whisper medium (tools/transcript-medium.json),
com as correções de grafia conferidas à mão. O vídeo já vem com cortes secos (sem pausas longas), então os tempos
do whisper entram como estão.

  python3 -I tools/clean_words.py   -> tools/words.json  [{word, start, end}]
"""
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
W = json.load(open(os.path.join(ROOT, "tools", "transcript-medium.json")))
W = W["words"] if isinstance(W, dict) else W
FIX_AT = {48: "sócia", 49: "e", 98: "conhecer", 109: "preencha"}
DROP = {51}  # "mais de duas pessoas" -> "mais duas pessoas" (o "de" é do whisper)
out = []
for i, w in enumerate(W):
    if i in DROP:
        out[-1]["end"] = round(w["end"], 3)
        continue
    out.append(dict(word=FIX_AT.get(i, w["text"]), start=round(w["start"], 3), end=round(w["end"], 3)))
json.dump(out, open(os.path.join(ROOT, "tools", "words.json"), "w"), ensure_ascii=False, indent=0)
print(" ".join(o["word"] for o in out))
