#!/usr/bin/env bash
# Gera as duas versões (story 9:16 e feed 1:1) e aplica o carve da trilha sob a locução.
#   bash tools/assemble.sh
set -euo pipefail
cd "$(dirname "$0")/.."
ffprobe -v error -show_entries format=duration -of csv=p=0 assets/voice/vo.wav > assets/voice/vo.dur
node tools/build.mjs story
node tools/build.mjs feed
for f in index.html feed/index.html; do
  node ~/.claude/skills/hyperframes-audio/scripts/carve.mjs --comp "./$f" --bed el-bgm --strength 0.5
done
