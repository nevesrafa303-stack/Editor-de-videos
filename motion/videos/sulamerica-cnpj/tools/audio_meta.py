#!/usr/bin/env python3
"""
Escreve audio_meta.json do filme SulAmérica para CNPJ: locução HeyGen + trilha +
SFX (source: host) nos tempos locais de cada cena (batem com tools/build-frames.mjs).

  python3 tools/audio_meta.py
"""
import json
import os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
LOCK, RISER = 4.0, 1.6
sfx = []


def cue(frame, name, at, dur, vol):
    sfx.append({'frame': frame, 'file': f'assets/audio/{name}.wav', 'offset_s': at,
                'duration_s': dur, 'volume': vol, 'source': 'host'})


# 01 dor: impacto na abertura e soco no "caro"
cue(1, 'sfx_impact', 0.0, 3.0, 0.4)
cue(1, 'sfx_pop', 1.11, 0.5, 0.45)
# 02 virada: selo CNPJ, marca, barras do comparativo
cue(2, 'sfx_whoosh', -0.25, 1.0, 0.4)
cue(2, 'sfx_tick', 0.8, 0.14, 0.3)
cue(2, 'sfx_shimmer', 2.15, 1.6, 0.3)
cue(2, 'sfx_tick', 3.05, 0.14, 0.25)
cue(2, 'sfx_tick', 3.55, 0.14, 0.25)
cue(2, 'sfx_pop', 4.0, 0.5, 0.4)
# 03 hospital: checks no tempo da fala
cue(3, 'sfx_whoosh', -0.25, 1.0, 0.4)
for t in (1.2, 2.05, 3.6):
    cue(3, 'sfx_tick', t, 0.14, 0.28)
# 04 preço: riser até a trava (linha de compasso) e impacto
cue(4, 'sfx_whoosh', -0.25, 1.0, 0.4)
cue(4, 'sfx_tick', 0.42, 0.14, 0.25)
cue(4, 'sfx_riser', round(LOCK - RISER, 2), RISER, 0.3)
cue(4, 'sfx_impact', LOCK, 2.0, 0.55)
# 05 CTA
cue(5, 'sfx_whoosh', -0.25, 1.0, 0.4)
cue(5, 'sfx_impact', 0.0, 3.0, 0.35)
cue(5, 'sfx_pop', 1.25, 0.5, 0.45)
cue(5, 'sfx_shimmer', 1.9, 1.6, 0.3)

voices = [{'frame': n, 'path': f'assets/voice/{n:02d}.wav'} for n in range(1, 6)
          if os.path.exists(os.path.join(ROOT, f'assets/voice/{n:02d}.wav'))]
meta = {'bgm': {'path': 'assets/audio/bgm.wav', 'volume': 0.55, 'source': 'host'},
        'voices': voices, 'sfx': sfx}
json.dump(meta, open(os.path.join(ROOT, 'audio_meta.json'), 'w'), indent=2, ensure_ascii=False)
print(f'audio_meta.json: {len(voices)} falas, {len(sfx)} SFX')
