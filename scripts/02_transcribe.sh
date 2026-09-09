#!/usr/bin/env bash
# ETAPA 1.3 — Transcricao Whisper com word timestamps.
# O JSON com word timestamps e a espinha dorsal de tudo.
set -euo pipefail
mkdir -p data build

if ! command -v whisper >/dev/null 2>&1; then
  echo "ERRO: whisper nao instalado. Rode: pip install -U openai-whisper" >&2
  exit 1
fi
[ -f build/audio16k.wav ] || {
  echo "ERRO: build/audio16k.wav ausente. Rode scripts/01_analyze.sh primeiro." >&2; exit 1; }

MODEL="${WHISPER_MODEL:-small}"
echo "==> whisper (modelo $MODEL, pt, word timestamps)"
whisper build/audio16k.wav \
  --model "$MODEL" \
  --language Portuguese \
  --word_timestamps True \
  --output_format json \
  --output_dir data

mv -f data/audio16k.json data/transcript.json
python3 -c "
import json
t = json.load(open('data/transcript.json'))
w = sum(len(s.get('words', [])) for s in t['segments'])
print(f\"{len(t['segments'])} segmentos, {w} palavras com timestamp\")
print('--- texto completo (confira criticamente, o Whisper erra) ---')
print(t['text'].strip())
"
echo
echo "==> ETAPA 1.6: leia o texto acima e monte data/corrections.json"
echo '    exemplo: {"anilizacao": "indenizacao", "foto": "falta"}'
