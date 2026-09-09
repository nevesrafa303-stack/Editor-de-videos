#!/usr/bin/env bash
# Teste de regressao do pipeline: gera um bruto sintetico, roda tudo e exige
# que o QC aprove. Nao depende de gravacao real nem do Whisper (a transcricao
# do fixture ja vem com word timestamps).
#
#   npm run verify
set -euo pipefail
cd "$(dirname "$0")/../.."

echo "### fixture"
node scripts/dev/make_fixture.mjs

echo "### etapa 1 (analise)"
bash scripts/01_analyze.sh assets/raw/bruto.mov >/dev/null
# 02_transcribe e pulado: o fixture ja escreveu data/transcript.json

echo "### fontes locais"
[ -f src/generated/fonts.json ] || node scripts/00_fonts.mjs >/dev/null

echo "### etapa 4.1 (mezzanine)"
bash scripts/03_mezzanine.sh >/dev/null 2>&1

echo "### etapa 2 (decupagem, 1a passada)"
node scripts/04_build_edl.mjs
echo "### etapa 3 (audio)"
node scripts/05_audio.mjs
echo "### etapa 3.4 (sfx calibrados contra a voz)"
node scripts/06_sfx.mjs
echo "### etapa 2 (decupagem, 2a passada com ganhos e faixa)"
node scripts/04_build_edl.mjs >/dev/null

echo "### etapa 5.1 (render)"
bash scripts/07_render.sh 2>&1 | grep -E "browser:|true peak|pronto"

echo "### etapa 5.2 (QC)"
node scripts/08_qc.mjs
