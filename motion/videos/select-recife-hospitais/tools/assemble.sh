#!/usr/bin/env bash
# Gera as duas versões (story 9:16 e feed 1:1). Sem locução, então não há carve da trilha.
#   bash tools/assemble.sh
set -euo pipefail
cd "$(dirname "$0")/.."
node tools/build.mjs story
node tools/build.mjs feed
