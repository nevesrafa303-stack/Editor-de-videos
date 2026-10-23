#!/usr/bin/env python3
"""
Monta a conversa em áudios: corta cada fala das tomadas escolhidas do ElevenLabs, trata, nivela as
duas vozes e posiciona tudo numa linha do tempo única.

  python -I tools/prep_voice.py
    -> assets/voice/vo.wav          (48 kHz mono, a conversa inteira)
       assets/voice/vo.words.json   (palavras com tempo global, fala e quem fala)
       assets/voice/vo.lines.json   (início/fim de cada áudio e as barras da forma de onda)
       assets/voice/vo.dur

Tomadas (Eleven v4): cliente = "Adriane" (tomada A), consultor = "Kaique" (tomada A, a mesma voz da
versão 1). A última resposta do consultor (CTA do formulário) vem da tomada cta-formulario, gravada
para a versão 1, juntando duas frases dela. Tempos das palavras: Scribe v1 sem texto de referência
(assets/voice/takes/*.words.json); os da tomada do CTA saem de ../sulamerica-pme-3vidas/tools/
align_words.py. Os cortes caem nos silêncios entre as falas (conferidos no envelope de cada tomada).
"""
import json
import os
import subprocess

import numpy as np
import soundfile as sf

SR = 48000
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
VOICE = os.path.join(ROOT, "assets", "voice")
TAKES = os.path.join(VOICE, "takes")

# (id, quem fala, tomada, trechos [(início, fim), …] em segundos da tomada)
LINES = [
    ("c1", "cliente", "cliente-A", [(0.00, 7.78)]),       # "Oi! Tudo bem? Eu tenho CNPJ… será que eu consigo…?"
    ("k1", "consultor", "consultor-A", [(0.00, 12.42)]),  # "Oi! Consegue sim! Olha só a cotação… já com IOF!"
    ("c2", "cliente", "cliente-A", [(7.80, 10.30)]),      # "Sério?! Pra três pessoas?!"
    ("k2", "consultor", "consultor-A", [(12.42, 21.20)]),  # (risada) "Sério! Pra essas idades aqui, ó…"
    ("c3", "cliente", "cliente-A", [(10.30, 12.52)]),     # "Amei! E como é que eu faço?"
    # "Preenche o formulário que eu te ajudo… pra sua família." + "Toca no botão aqui embaixo e faz a sua cotação!"
    ("k3", "consultor", "cta-formulario", [(2.10, 6.45), (9.95, 12.59)]),
]
START = 0.45                                 # primeiro áudio começa aqui
GAP = {"consultor": 0.5, "cliente": 0.32}    # respiro antes de cada áudio, por quem responde
INNER = 0.38                                 # pausa entre dois trechos da mesma fala
BARS = 34                                    # barras da forma de onda em cada bolha
TARGET_DB = -20.0                            # RMS dos trechos falados, igual para as duas vozes
CHAIN = "highpass=f=75,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,equalizer=f=3200:t=q:w=1.2:g=1.5"


def load(name):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(TAKES, f"{name}.mp3"), "-af", CHAIN,
                          "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def env_db(x, win=0.02):
    n = int(win * SR)
    e = np.sqrt(np.convolve(x ** 2, np.ones(n) / n, "same"))
    return 20 * np.log10(e + 1e-9)


def main():
    takes = {name: load(name) for name in {l[2] for l in LINES}}
    words = {name: json.load(open(os.path.join(TAKES, f"{name}.words.json")))["words"] for name in takes}
    # nivela as duas vozes pelo RMS dos trechos falados
    for name, x in takes.items():
        voiced = x[env_db(x) > -40]
        takes[name] = x * 10 ** ((TARGET_DB - 20 * np.log10(np.sqrt(np.mean(voiced ** 2)))) / 20)

    out = np.zeros(int(60 * SR))
    t = START
    prev = None
    lines, ws = [], []
    for lid, spk, take, cuts in LINES:
        if prev is not None:
            t = prev + GAP[spk]
        parts, tt = [], 0.0
        for a, b in cuts:
            x = takes[take][int(a * SR):int(b * SR)]
            e = env_db(x)
            on = max(0, np.argmax(e > -45) - int(0.04 * SR))
            off = min(len(x), len(x) - np.argmax(e[::-1] > -45) + int(0.08 * SR))
            piece = x[on:off].copy()
            f = int(0.008 * SR)
            piece[:f] *= np.linspace(0, 1, f)
            piece[-f:] *= np.linspace(1, 0, f)
            if parts:
                parts.append(np.zeros(int(INNER * SR)))
                tt += INNER
            t0 = a + on / SR                 # instante da tomada que cai em t + tt
            for w in words[take]:
                if w["type"] == "word" and a <= w["start"] < b:
                    ws.append(dict(word=w["text"], start=round(w["start"] - t0 + t + tt, 3),
                                   end=round(w["end"] - t0 + t + tt, 3), line=lid, spk=spk))
            parts.append(piece)
            tt += len(piece) / SR
        seg = np.concatenate(parts)
        i = int(round(t * SR))
        out[i:i + len(seg)] += seg
        dur = len(seg) / SR
        # forma de onda real da fala, em BARS barras
        chunks = np.array_split(seg, BARS)
        rms = np.array([np.sqrt(np.mean(c ** 2)) for c in chunks])
        bars = np.clip((20 * np.log10(rms + 1e-9) + 42) / 30, 0.12, 1.0)
        lines.append(dict(id=lid, spk=spk, start=round(t, 3), end=round(t + dur, 3), dur=round(dur, 3),
                          bars=[round(float(v), 3) for v in bars]))
        prev = t + dur
    total = prev + 0.1
    out = out[:int(total * SR)]
    sf.write(os.path.join(VOICE, "vo.wav"), out.astype(np.float32), SR, subtype="PCM_16")
    json.dump(ws, open(os.path.join(VOICE, "vo.words.json"), "w"), ensure_ascii=False, indent=0)
    json.dump(lines, open(os.path.join(VOICE, "vo.lines.json"), "w"), indent=1)
    open(os.path.join(VOICE, "vo.dur"), "w").write(f"{total:.3f}\n")
    for l in lines:
        print(f'{l["id"]} {l["spk"]:9s} {l["start"]:6.2f} -> {l["end"]:6.2f} ({l["dur"]:.2f} s)')
    print(f"vo.wav {total:.2f} s, {len(ws)} palavras, pico {np.max(np.abs(out)):.2f}")


if __name__ == "__main__":
    main()
