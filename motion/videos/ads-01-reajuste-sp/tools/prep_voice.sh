#!/usr/bin/env bash
# Tratamento da voz (áudio do próprio iPhone, já cortado por tools/assemble.py), para a fala ficar mais nítida:
#  - passa-altas 90 Hz e redução leve de ruído;
#  - menos "caixa" da sala (-3 dB em 400 Hz) e menos embolado (-1,5 dB em 180 Hz);
#  - presença (+3 dB em 3,2 kHz) e ar (+2 dB acima de 8 kHz) para as consoantes;
#  - de-esser, compressão 3:1 e expansor leve nas pausas (a sala some entre as frases);
#  - nível de fala: -16 LUFS, pico -1,5 dBTP.
#   bash tools/prep_voice.sh <voice_cut_raw.wav>   -> assets/audio/voice.wav (48 kHz mono)
set -euo pipefail
cd "$(dirname "$0")/.."
ffmpeg -v error -y -i "$1" -ac 1 -ar 48000 -af "\
highpass=f=90:poles=2,afftdn=nr=6:nf=-55:tn=1,\
equalizer=f=180:t=q:w=1.0:g=-1.5,equalizer=f=400:t=q:w=0.9:g=-3,\
equalizer=f=3200:t=q:w=1.1:g=3,highshelf=f=8000:g=2,\
deesser=i=0.35:m=0.5:f=0.5,\
acompressor=threshold=-24dB:ratio=3:attack=5:release=110:makeup=2,\
agate=threshold=0.006:range=0.35:ratio=2:attack=4:release=180,\
loudnorm=I=-16:TP=-1.5:LRA=6" assets/audio/voice.wav
ffmpeg -v info -i assets/audio/voice.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" | tr -s ' '
