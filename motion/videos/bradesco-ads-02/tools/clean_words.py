#!/usr/bin/env python3
"""
Palavras da legenda do "Ads 02 Bradesco": texto e tempos do whisper medium (tools/transcript-medium.json), com a
correção de grafia conferida à mão. O vídeo já vem com cortes secos, então os tempos entram como estão.

  python3 -I tools/clean_words.py   -> tools/words.json  [{word, start, end}]
"""
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
W = json.load(open(os.path.join(ROOT, "tools", "transcript-medium.json")))
W = W["words"] if isinstance(W, dict) else W
FIX_AT = {101: "preencha"}
out = [dict(word=FIX_AT.get(i, w["text"]), start=round(w["start"], 3), end=round(w["end"], 3)) for i, w in enumerate(W)]
json.dump(out, open(os.path.join(ROOT, "tools", "words.json"), "w"), ensure_ascii=False, indent=0)
print(" ".join(o["word"] for o in out))
