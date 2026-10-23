#!/usr/bin/env bash
# Tratamento da locução (tomada 2A do ElevenLabs, assets/voice/vo.raw.mp3) -> assets/voice/vo.wav
#   passa-altas, compressão leve, presença em 3,2 kHz, 48 kHz mono.
set -euo pipefail
cd "$(dirname "$0")/.."
ffmpeg -v error -y -i assets/voice/vo.raw.mp3 \
  -af "highpass=f=75,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,equalizer=f=3200:t=q:w=1.2:g=1.5,aresample=48000" \
  -ac 1 assets/voice/vo.wav
