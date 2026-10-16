#!/usr/bin/env bash
# Remonta o filme do zero: cenas -> audio_meta -> index.html -> transições ->
# GSAP local -> grupo de voz + carve da trilha sob a locução.
#   bash tools/assemble.sh
set -euo pipefail
cd "$(dirname "$0")/.."
SK="$HOME/.claude/skills"
PLV="$SK/product-launch-video/scripts"
node tools/build-frames.mjs
python3 tools/audio_meta.py
node "$PLV/assemble-index.mjs" --storyboard ./STORYBOARD.md --hyperframes . --audio-meta ./audio_meta.json
node "$PLV/transitions.mjs" inject --storyboard ./STORYBOARD.md --hyperframes .
node "$PLV/transitions.mjs" verify --storyboard ./STORYBOARD.md --index ./index.html
# o container não alcança cdn.jsdelivr.net: GSAP vem de assets/vendor
sed -i 's#<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"[^>]*></script>#<script src="assets/vendor/gsap.min.js"></script>#' index.html
grep -q 'assets/vendor/gsap.min.js' index.html
# locução: um grupo só, e a trilha recebe o carve espectral sob ele
if grep -q 'id="el-[0-9a-z-]*-voice"' index.html; then
  sed -i -E 's#(id="el-[0-9a-z-]+-voice")#\1\n        data-audio-group="voiceover"#' index.html
  node "$SK/hyperframes-audio/scripts/carve.mjs" --comp ./index.html --bed el-bgm --strength 0.5
fi
