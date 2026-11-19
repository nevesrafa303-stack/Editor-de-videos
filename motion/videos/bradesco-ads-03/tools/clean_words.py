#!/usr/bin/env python3
"""
Palavras da legenda do "Ads 03 Bradesco": texto e tempos do whisper medium (tools/transcript-medium.json), com as
correções conferidas à mão. O vídeo já vem com cortes secos, então os tempos entram como estão.

  python3 -I tools/clean_words.py   -> tools/words.json  [{word, start, end}]
"""
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
W = json.load(open(os.path.join(ROOT, "tools", "transcript-medium.json")))
W = W["words"] if isinstance(W, dict) else W
SPLIT = {86: ("E", "olha,")}  # "Eolha," -> "E" + "olha,"
out = []
for i, w in enumerate(W):
    if i in SPLIT:
        a, b = SPLIT[i]
        mid = round(w["start"] + (w["end"] - w["start"]) * 0.25, 3)
        out.append(dict(word=a, start=round(w["start"], 3), end=mid))
        out.append(dict(word=b, start=mid, end=round(w["end"], 3)))
        continue
    out.append(dict(word=w["text"], start=round(w["start"], 3), end=round(w["end"], 3)))
json.dump(out, open(os.path.join(ROOT, "tools", "words.json"), "w"), ensure_ascii=False, indent=0)
print(" ".join(o["word"] for o in out))
