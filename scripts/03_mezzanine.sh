#!/usr/bin/env bash
# ETAPA 4.1 — Mezzanine: rotacao normalizada + color grade EMBUTIDO.
# Resolucao ~1.5x da final (1620x2880) para o zoom maximo (135%) nao perder
# qualidade. Determinístico e mais rapido que filtro CSS no Remotion.
set -euo pipefail

RAW="${1:-$(python3 -c "import json;print(json.load(open('data/probe_summary.json'))['src'])")}"
mkdir -p public

W=1620; H=2880

# Grade sutil: leve contraste, saturacao e tom quente. Nada agressivo (Principio 3).
GRADE="eq=contrast=1.06:saturation=1.08:gamma=1.01,colorbalance=rs=0.020:gs=0.004:bs=-0.020:rm=0.012:bm=-0.012"

# -noautorotate NAO e usado: deixamos o ffmpeg aplicar o displaymatrix e
# escrevemos um arquivo sem metadado de rotacao — o Remotion recebe pixels ja
# na orientacao certa.
echo "==> mezzanine ${W}x${H} (rotacao normalizada + grade)"
ffmpeg -y -v error -stats -i "$RAW" \
  -vf "scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},${GRADE},format=yuv420p" \
  -metadata:s:v rotate=0 \
  -r 30 -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p \
  -an public/mezzanine.mp4

ffprobe -v error -show_entries stream=width,height,r_frame_rate,nb_frames \
        -of default=nw=1 public/mezzanine.mp4
echo "==> mezzanine pronto em public/mezzanine.mp4"
