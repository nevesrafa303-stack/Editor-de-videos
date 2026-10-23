#!/usr/bin/env python3
"""
Locução: tomada 2A do ElevenLabs até "…e sem taxa de inscrição." emendada, no silêncio que vinha
depois, com a tomada do CTA de formulário ("Quer saber se você pode contratar? Preenche o
formulário… Toca no botão aqui embaixo e faz a sua cotação!"), mesma voz.

  python -I tools/prep_voice.py   -> assets/voice/vo.wav, vo.words.json, vo.dur

Tratamento (as duas tomadas): passa-altas, compressão leve, presença em 3,2 kHz, 48 kHz mono; a
tomada nova é nivelada pelo RMS falado da 2A. Palavras: Scribe da 2A (assets/voice/takes/
vo-2A.words.json) até a emenda + tempos da tomada nova (tools/align_words.py) deslocados.
"""
import json
import os
import subprocess

import numpy as np
import soundfile as sf

SR = 48000
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
VOICE = os.path.join(ROOT, "assets", "voice")
CHAIN = "highpass=f=75,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,equalizer=f=3200:t=q:w=1.2:g=1.5"
CUT = 30.95      # na 2A: meio do silêncio depois de "inscrição" (30,76–31,12 s)
OFFSET = 31.10   # onde começa a tomada nova; "Quer" cai em 31,18 s, como na 2A


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-af", CHAIN, "-ac", "1", "-ar", str(SR),
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def voiced_rms(x):
    n = int(0.02 * SR)
    e = np.sqrt(np.convolve(x ** 2, np.ones(n) / n, "same"))
    v = x[20 * np.log10(e + 1e-9) > -40]
    return np.sqrt(np.mean(v ** 2))


def main():
    a = load(os.path.join(VOICE, "vo.raw.mp3"))
    b = load(os.path.join(VOICE, "takes", "cta-formulario.mp3"))
    b *= voiced_rms(a) / voiced_rms(b)
    head = a[:int(CUT * SR)].copy()
    f = int(0.02 * SR)
    head[-f:] *= np.linspace(1, 0, f)
    b[:int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))
    out = np.concatenate([head, np.zeros(int(OFFSET * SR) - len(head)), b])
    sf.write(os.path.join(VOICE, "vo.wav"), out.astype(np.float32), SR, subtype="PCM_16")
    old = json.load(open(os.path.join(VOICE, "takes", "vo-2A.words.json")))
    new = json.load(open(os.path.join(VOICE, "takes", "cta-formulario.words.json")))["words"]
    words = [w for w in old if w["end"] <= CUT] + [
        dict(word=w["text"], start=round(w["start"] + OFFSET, 3), end=round(w["end"] + OFFSET, 3)) for w in new
    ]
    json.dump(words, open(os.path.join(VOICE, "vo.words.json"), "w"), ensure_ascii=False, indent=0)
    open(os.path.join(VOICE, "vo.dur"), "w").write(f"{len(out) / SR:.3f}\n")
    print(f"vo.wav {len(out) / SR:.2f} s, {len(words)} palavras (última: {words[-1]['word']} {words[-1]['end']} s), "
          f"ganho da tomada nova {20 * np.log10(voiced_rms(b) / voiced_rms(load(os.path.join(VOICE, 'takes', 'cta-formulario.mp3')))):+.1f} dB")


if __name__ == "__main__":
    main()
