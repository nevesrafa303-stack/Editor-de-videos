#!/usr/bin/env bash
# Abaixa a trilha sob a voz do apresentador: -1 dB fixo + compressor com a voz como chave (sidechain).
#   bash tools/duck_bgm.sh   -> assets/audio/bgm_duck.wav
set -euo pipefail
cd "$(dirname "$0")/.."
ffmpeg -v error -y -i assets/audio/bgm.wav -i assets/audio/voice.wav -filter_complex \
  "[0:a]volume=-1dB[b];[1:a]aformat=channel_layouts=stereo,aresample=48000[k];[b][k]sidechaincompress=threshold=0.025:ratio=5:attack=40:release=420:makeup=1[o]" \
  -map "[o]" -ar 48000 assets/audio/bgm_duck.wav
