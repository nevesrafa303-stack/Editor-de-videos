#!/usr/bin/env bash
# Converte o vídeo original do Caio (iPhone, HDR HLG BT.2020, 1440x2560 HEVC 24 fps) para a base da edição:
# SDR BT.709 (tone-mapping mobius), 1080x1920, H.264, 24 fps, um quadro-chave por segundo (seek sem travar),
# áudio AAC 48 kHz. Em SDR o render sai em H.264 comum, que é o mais seguro para anúncio no Meta.
#   bash tools/prep_video.sh <original.mp4>   -> assets/video/caio.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
SRC="$1"
ffmpeg -v error -y -i "$SRC" \
  -vf "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=mobius:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,scale=1080:1920:flags=lanczos" \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
  -c:v libx264 -preset slow -crf 17 -g 24 -keyint_min 24 -r 24 \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart assets/video/caio.mp4
ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt,color_space,color_transfer,color_primaries -of compact assets/video/caio.mp4
