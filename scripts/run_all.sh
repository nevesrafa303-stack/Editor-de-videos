#!/usr/bin/env bash
# Pipeline completo, 100% reproduzivel: mesmo bruto -> mesmo video.
set -euo pipefail
cd "$(dirname "$0")/.."

node   scripts/00_fonts.mjs     # fontes locais (uma vez por maquina)
bash   scripts/01_analyze.sh    "${1:-}"
bash   scripts/02_transcribe.sh
echo   "== PAUSA: revise data/transcript.json e escreva data/corrections.json =="
bash   scripts/03_mezzanine.sh

# A ordem importa: a calibragem de SFX e RELATIVA a voz ja tratada, entao
# 06 roda depois de 05; e o data.json so fica completo na 2a passada da EDL,
# quando ganhos e faixa de audio ja existem.
node   scripts/04_build_edl.mjs   # 1a passada: gera o plano de audio
node   scripts/05_audio.mjs       # voz cortada, tratada, -14 LUFS (+ trilha)
node   scripts/06_sfx.mjs         # calibra os SFX contra essa voz
node   scripts/04_build_edl.mjs   # 2a passada: ganhos calibrados + audioSrc
bash   scripts/07_render.sh
node   scripts/08_qc.mjs
