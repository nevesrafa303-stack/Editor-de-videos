#!/usr/bin/env bash
# Gera compositions/filme.html + index.html e aplica o carve da trilha sob a locução.
#   bash tools/assemble.sh
set -euo pipefail
cd "$(dirname "$0")/.."
ffprobe -v error -show_entries format=duration -of csv=p=0 assets/voice/vo.wav > assets/voice/vo.dur
node tools/build.mjs
node ~/.claude/skills/hyperframes-audio/scripts/carve.mjs --comp ./index.html --bed el-bgm --strength 0.5
