#!/usr/bin/env bash
# Trata a voz do Caio (áudio original do vídeo, microfone de lapela): passa-altas, compressão leve, presença e
# nível de fala (-16 LUFS, pico -1,5 dBTP). O vídeo entra mudo na composição e a voz tratada vai num <audio>.
#   bash tools/prep_voice.sh   -> assets/audio/voice.wav (48 kHz mono)
set -euo pipefail
cd "$(dirname "$0")/.."
ffmpeg -v error -y -i assets/video/caio.mp4 -vn -ac 1 -ar 48000 \
  -af "highpass=f=80,lowpass=f=15000,equalizer=f=250:t=q:w=1.0:g=-1.5,equalizer=f=3200:t=q:w=1.2:g=2.5,acompressor=threshold=-26dB:ratio=3:attack=6:release=140:makeup=3,loudnorm=I=-16:TP=-1.5:LRA=7" \
  assets/audio/voice.wav
ffmpeg -v info -i assets/audio/voice.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tr -s ' '
