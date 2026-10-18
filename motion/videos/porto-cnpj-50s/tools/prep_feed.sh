#!/usr/bin/env bash
# Posts genéricos do feed do gancho: fotos do projeto recortadas em 4:5 e levemente desfocadas.
#   bash tools/prep_feed.sh
set -euo pipefail
cd "$(dirname "$0")/../assets/img"
for p in ai-consult:p2 b-ocup:p6 ai-doctor:p7; do
  src=${p%%:*}; [ -f "$src.jpg" ] && src="$src.jpg" || src="$src.png"
  ffmpeg -v error -y -i "$src" -vf "scale=1032:1290:force_original_aspect_ratio=increase,crop=1032:1290,gblur=sigma=3" -q:v 4 "feed-${p##*:}.jpg"
done
