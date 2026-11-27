#!/usr/bin/env bash
# Base da edição a partir do vídeo original ("Ads 01 vídeo", iPhone, HDR HLG BT.2020, 2160x3840 HEVC 60 fps):
#  1. conversão para SDR BT.709 com a cor do original como o Google Drive mostra (mobius com pico nominal de 350 nits,
#     saturação 0,9 e contraste 1,05: calibrado contra a miniatura do Drive em parede, rosto, camisa, ar-condicionado
#     e cortina; erro médio de ~5 níveis de 255). O mobius com 100 nits deixava a imagem clara e lavada.
#     Sai em 1080x1920, 30 fps, H.264 com quadro-chave a cada 0,5 s;
#  2. áudio mono 48 kHz;
#  3. os cortes de tools/cuts.json (tools/assemble.py) -> assets/video/src.mp4 (mudo) e work/voice_cut_raw.wav.
#   bash tools/prep_video.sh <original.mp4> <pasta de trabalho>
set -euo pipefail
cd "$(dirname "$0")/.."
SRC="$1"; WORK="$2"; mkdir -p "$WORK"
ffmpeg -v error -y -i "$SRC" \
  -vf "zscale=t=linear:npl=350,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=mobius:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,eq=saturation=0.9:contrast=1.05,scale=1080:1920:flags=lanczos" \
  -r 30 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
  -c:v libx264 -preset medium -crf 16 -g 15 -keyint_min 15 -an -movflags +faststart "$WORK/sdr_full.mp4"
ffmpeg -v error -y -i "$SRC" -vn -ac 1 -ar 48000 "$WORK/raw48.wav"
python3 -I tools/assemble.py tools/cuts.json "$WORK/sdr_full.mp4" "$WORK/raw48.wav" assets/video/src.mp4 "$WORK/voice_cut_raw.wav"
