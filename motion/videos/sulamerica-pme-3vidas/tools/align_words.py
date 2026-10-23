#!/usr/bin/env python3
"""
Tempos por palavra da tomada do CTA de formulário (assets/voice/takes/cta-formulario.mp3), gravada
quando os créditos do ElevenLabs já não cobriam o Scribe.

  python -I tools/align_words.py   -> assets/voice/takes/cta-formulario.words.json

As frases que também existem na locução original (mesma voz; tempos do Scribe em
assets/voice/takes/vo-2A.words.json) são alinhadas à original por DTW sobre MFCC e herdam os tempos palavra a
palavra: "Quer saber se você pode contratar?", "…que eu te ajudo a ver as condições pra você e pra
sua família." e "Não deixa pra pensar na saúde só quando precisar, tá?". O resto ("Preenche o
formulário" e "Toca no botão aqui embaixo e faz a sua cotação!") foi marcado à mão no envelope de
energia, pelos fechamentos das consoantes (o /k/ de "aqui" e de "cotação", o /f/ de "faz"…).
"""
import json
import os
import subprocess

import numpy as np
from scipy.fft import dct

SR = 16000
HOP = 0.01
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
NEW = os.path.join(ROOT, "assets/voice/takes/cta-formulario.mp3")
OLD = os.path.join(ROOT, "assets/voice/vo.raw.mp3")
OLD_WORDS = json.load(open(os.path.join(ROOT, "assets/voice/takes/vo-2A.words.json")))

# (palavras da original a herdar [i0, i1], janela na original, janela na nova, início livre na nova?)
SHARED = [
    ((77, 82), (31.08, 32.62), (0.0, 1.85), False),    # Quer saber se você pode contratar?
    ((87, 100), (33.88, 36.80), (3.10, 6.40), True),   # que eu te ajudo … pra sua família.
    ((101, 110), (37.12, 39.78), (6.74, 9.78), False),  # Não deixa pra pensar … tá?
]
# marcado à mão: (palavra, início, fim)
MANUAL = [
    ("Preenche", 2.20, 2.54), ("o", 2.57, 2.64), ("formulário", 2.65, 3.14),
    ("Toca", 10.08, 10.29), ("no", 10.30, 10.39), ("botão", 10.40, 10.69), ("aqui", 10.70, 10.90),
    ("embaixo", 10.92, 11.29), ("e", 11.30, 11.42), ("faz", 11.44, 11.62), ("a", 11.64, 11.70),
    ("sua", 11.72, 11.86), ("cotação", 11.88, 12.42),
]


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def mel_fb(nfft, nmel=26, fmin=80, fmax=7600):
    m = lambda f: 2595 * np.log10(1 + f / 700)
    im = lambda v: 700 * (10 ** (v / 2595) - 1)
    pts = im(np.linspace(m(fmin), m(fmax), nmel + 2))
    bins = np.floor((nfft + 1) * pts / SR).astype(int)
    fb = np.zeros((nmel, nfft // 2 + 1))
    for i in range(nmel):
        a, b, c = bins[i], bins[i + 1], bins[i + 2]
        fb[i, a:b] = (np.arange(a, b) - a) / max(1, b - a)
        fb[i, b:c] = (c - np.arange(b, c)) / max(1, c - b)
    return fb


def mfcc(x):
    win, hop, nfft = int(0.025 * SR), int(HOP * SR), 512
    fb = mel_fb(nfft)
    frames = np.array([x[i:i + win] * np.hamming(win) for i in range(0, len(x) - win, hop)])
    spec = np.abs(np.fft.rfft(frames, nfft)) ** 2
    c = dct(np.log(spec @ fb.T + 1e-10), type=2, axis=1, norm="ortho")[:, 1:14]
    return (c - c.mean(0)) / (c.std(0) + 1e-9)


def dtw(a, b, free_start):
    """caminho de a (original) em b (nova); free_start: a pode começar em qualquer ponto de b"""
    cost = np.linalg.norm(a[:, None, :] - b[None, :, :], axis=2)
    n, m = cost.shape
    acc = np.full((n + 1, m + 1), np.inf)
    acc[0, 0] = 0
    if free_start:
        acc[0, :] = 0
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            acc[i, j] = cost[i - 1, j - 1] + min(acc[i - 1, j], acc[i, j - 1], acc[i - 1, j - 1])
    i, j = n, m
    path = [(i - 1, j - 1)]
    while i > 1 or (j > 1 and not free_start):
        steps = [(acc[i - 1, j - 1], i - 1, j - 1), (acc[i - 1, j], i - 1, j), (acc[i, j - 1], i, j - 1)]
        _, i, j = min(steps)
        if i < 1 or j < 1:
            break
        path.append((i - 1, j - 1))
    return path[::-1]


def main():
    old, new = load(OLD), load(NEW)
    out = [dict(text=w, type="word", start=a, end=b) for w, a, b in MANUAL]
    for (i0, i1), (oa, ob), (na, nb), free in SHARED:
        A = mfcc(old[int(oa * SR):int(ob * SR)])
        B = mfcc(new[int(na * SR):int(nb * SR)])
        path = dtw(A, B, free)
        fwd = {}
        for pi, pj in path:
            fwd.setdefault(pi, pj)

        def map_t(t):
            fi = int(round((t - oa) / HOP))
            fi = min(max(fi, path[0][0]), path[-1][0])
            while fi not in fwd:
                fi -= 1
            return round(na + fwd[fi] * HOP, 3)

        for w in OLD_WORDS[i0:i1 + 1]:
            out.append(dict(text=w["word"], type="word", start=map_t(w["start"]), end=map_t(w["end"])))
    out.sort(key=lambda w: w["start"])
    json.dump({"words": out}, open(os.path.join(ROOT, "assets/voice/takes/cta-formulario.words.json"), "w"),
              ensure_ascii=False, indent=0)
    print(" | ".join(f'{w["text"]}@{w["start"]}-{w["end"]}' for w in out))


if __name__ == "__main__":
    main()
