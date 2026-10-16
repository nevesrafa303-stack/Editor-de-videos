#!/usr/bin/env bash
# Remonta o filme do zero: cenas -> index.html -> transições -> GSAP local.
#   bash tools/assemble.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PLV="$HOME/.claude/skills/product-launch-video/scripts"
node tools/build-frames.mjs
node "$PLV/assemble-index.mjs" --storyboard ./STORYBOARD.md --hyperframes . --audio-meta ./audio_meta.json
node "$PLV/transitions.mjs" inject --storyboard ./STORYBOARD.md --hyperframes .
node "$PLV/transitions.mjs" verify --storyboard ./STORYBOARD.md --index ./index.html
# o container não alcança cdn.jsdelivr.net: GSAP vem de assets/vendor
sed -i 's#<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"[^>]*></script>#<script src="assets/vendor/gsap.min.js"></script>#' index.html
grep -q 'assets/vendor/gsap.min.js' index.html
