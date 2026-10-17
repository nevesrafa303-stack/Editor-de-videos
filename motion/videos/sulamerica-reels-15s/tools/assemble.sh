#!/usr/bin/env bash
# Gera index.html e aplica o carve da trilha sob a locução.
#   bash tools/assemble.sh
set -euo pipefail
cd "$(dirname "$0")/.."
node tools/build.mjs
node ~/.claude/skills/hyperframes-audio/scripts/carve.mjs --comp ./index.html --bed el-bgm --strength 0.5
node tools/open_gaps.mjs
