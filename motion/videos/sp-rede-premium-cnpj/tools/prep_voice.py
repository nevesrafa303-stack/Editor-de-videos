#!/usr/bin/env python3
"""
Locução do anúncio "plano empresarial com rede premium em São Paulo" a partir da tomada A do
ElevenLabs (Eleven v4, voz "Jhony Tygas"; assets/voice/takes/take-A.mp3) e dos tempos por palavra
do Scribe v1 (takes/take-A.words.json).

  python3 -I tools/prep_voice.py   -> assets/voice/vo.wav, vo.words.json e vo.dur

Tratamento leve (passa-altas, compressão suave, presença em 3,2 kHz), 48 kHz mono, com LEAD s de
silêncio antes da primeira palavra. As tags de direção ([confident], [warmly]…) que o Scribe devolve
como palavras são descartadas.
"""
import json
import os
import subprocess

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
V = os.path.join(ROOT, 'assets', 'voice')
LEAD = 0.1

src = os.path.join(V, 'takes', 'take-A.mp3')
dst = os.path.join(V, 'vo.wav')
af = (f'adelay={int(LEAD * 1000)},highpass=f=75,'
      'acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,'
      'equalizer=f=3200:t=q:w=1.2:g=1.5')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', af, '-ar', '48000', '-ac', '1', dst], check=True)

raw = json.load(open(os.path.join(V, 'takes', 'take-A.words.json')))['words']
words = [dict(word=w['text'], start=round(w['start'] + LEAD, 3), end=round(w['end'] + LEAD, 3))
         for w in raw if w.get('type') == 'word' and not w['text'].startswith('[')]
json.dump(words, open(os.path.join(V, 'vo.words.json'), 'w'), ensure_ascii=False, indent=1)
dur = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dst],
                     capture_output=True, text=True, check=True).stdout.strip()
open(os.path.join(V, 'vo.dur'), 'w').write(dur + '\n')
print(f'vo.wav {float(dur):.2f}s, {len(words)} palavras, última termina em {words[-1]["end"]}s')
