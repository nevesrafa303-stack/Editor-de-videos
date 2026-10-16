#!/usr/bin/env bash
# Renderiza os 6 criativos Aport Seguros em Feed (1080x1350) e Stories (1080x1920):
# MP4 animado de 12 s + PNG estático (frame 340, animação já assentada).
# Saída: out/aport/{video,estatico}/
set -euo pipefail
cd "$(dirname "$0")/../.."

node scripts/aport/prepare.mjs

BROWSER_FLAG=()
for c in /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell "$(command -v chromium || true)"; do
  if [[ -n "$c" && -x "$c" ]]; then BROWSER_FLAG=(--browser-executable "$c"); break; fi
done

mkdir -p out/aport/video out/aport/estatico
for id in 01 02 03 04 05 06; do
  for fmt in Feed Stories; do
    comp="Aport-$id-$fmt"
    echo "==> $comp"
    npx remotion render src/index.ts "$comp" "out/aport/video/$comp.mp4" "${BROWSER_FLAG[@]}" --log=error
    npx remotion still src/index.ts "$comp" "out/aport/estatico/$comp.png" --frame=340 "${BROWSER_FLAG[@]}" --log=error
  done
done
echo "pronto: out/aport/video e out/aport/estatico"
