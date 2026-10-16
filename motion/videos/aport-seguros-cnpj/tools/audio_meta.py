#!/usr/bin/env python3
"""
Escreve audio_meta.json: locução HeyGen + trilha + SFX (source: host), nos
tempos locais de cada cena. Os marcos batem com tools/build-frames.mjs:
checks dos benefícios no tempo da fala, riser 5.6-7.2 s e impacto na trava
do preço (7.2 s, linha de compasso).

  python3 tools/audio_meta.py
"""
import json
import os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

BENEFITS = {3: [1.76, 2.82, 4.0], 4: [1.6, 3.55], 5: [1.24, 2.5, 3.76, 4.45]}
LOCK, RISER = 7.2, 1.6

sfx = []


def cue(frame, name, at, dur, vol):
    sfx.append({'frame': frame, 'file': f'assets/audio/{name}.wav', 'offset_s': at,
                'duration_s': dur, 'volume': vol, 'source': 'host'})


cue(1, 'sfx_impact', 0.0, 3.0, 0.4)
cue(2, 'sfx_whoosh', -0.3, 1.0, 0.4)
cue(2, 'sfx_shimmer', 0.75, 3.0, 0.32)
cue(2, 'sfx_tick', 4.05, 0.14, 0.25)
for f, ticks in BENEFITS.items():
    cue(f, 'sfx_whoosh', -0.3, 1.0, 0.4)
    for t in ticks:
        cue(f, 'sfx_tick', t, 0.14, 0.25)
    cue(f, 'sfx_riser', round(LOCK - RISER, 2), RISER, 0.3)
    cue(f, 'sfx_impact', LOCK, 3.0, 0.5)
cue(6, 'sfx_whoosh', -0.3, 1.0, 0.4)
cue(6, 'sfx_impact', 0.0, 3.0, 0.4)
cue(6, 'sfx_pop', 1.85, 0.5, 0.45)
cue(6, 'sfx_shimmer', 5.5, 3.0, 0.32)

voices = [{'frame': n, 'path': f'assets/voice/{n:02d}.wav'} for n in range(1, 7)
          if os.path.exists(os.path.join(ROOT, f'assets/voice/{n:02d}.wav'))]

meta = {'bgm': {'path': 'assets/audio/bgm.wav', 'volume': 0.55, 'source': 'host'},
        'voices': voices, 'sfx': sfx}
json.dump(meta, open(os.path.join(ROOT, 'audio_meta.json'), 'w'), indent=2, ensure_ascii=False)
print(f'audio_meta.json: {len(voices)} falas, {len(sfx)} SFX')
