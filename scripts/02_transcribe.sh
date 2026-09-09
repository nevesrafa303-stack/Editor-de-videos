#!/usr/bin/env bash
# ETAPA 1.3 — Transcricao Whisper com word timestamps.
# O JSON com word timestamps e a espinha dorsal de tudo: decupagem, legendas e
# sincronizacao de efeitos saem dele.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p data build

if ! command -v whisper >/dev/null 2>&1; then
  echo "ERRO: whisper nao instalado. Rode: pip install -U openai-whisper" >&2
  exit 1
fi
[ -f build/audio16k.wav ] || {
  echo "ERRO: build/audio16k.wav ausente. Rode scripts/01_analyze.sh primeiro." >&2; exit 1; }

MODEL="${WHISPER_MODEL:-small}"

# Em rede restrita o download dos pesos (openaipublic.azureedge.net) pode ser
# bloqueado. WHISPER_MODEL_DIR aponta para uma pasta com o .pt ja baixado.
DIR_ARGS=()
if [ -n "${WHISPER_MODEL_DIR:-}" ]; then
  DIR_ARGS=(--model_dir "$WHISPER_MODEL_DIR")
  echo "==> usando pesos locais em $WHISPER_MODEL_DIR"
fi

echo "==> whisper (modelo $MODEL, pt, word timestamps)"
if ! whisper build/audio16k.wav \
      --model "$MODEL" "${DIR_ARGS[@]}" \
      --language Portuguese \
      --word_timestamps True \
      --output_format json \
      --output_dir data; then
  echo >&2
  echo "ERRO: o whisper falhou." >&2
  echo "Se o erro for de rede (URLError / 403 ao baixar o modelo), baixe os pesos" >&2
  echo "numa maquina com acesso e aponte para eles:" >&2
  echo "  WHISPER_MODEL_DIR=~/.cache/whisper npm run transcribe" >&2
  exit 1
fi

mv -f "data/audio16k.json" data/transcript.json

python3 - <<'PY'
import json
t = json.load(open('data/transcript.json'))
n = sum(len(s.get('words', [])) for s in t['segments'])
print(f"{len(t['segments'])} segmentos, {n} palavras com timestamp")
if n == 0:
    raise SystemExit(
        'ERRO: nenhuma palavra com timestamp. Confirme --word_timestamps True; '
        'sem isso o resto do pipeline nao funciona.'
    )
print('--- texto completo (confira criticamente, o Whisper erra) ---')
print(t['text'].strip())
PY

echo
echo "==> ETAPA 1.6: leia o texto acima e monte data/corrections.json"
echo '    exemplo: {"anilizacao": "indenizacao", "foto": "falta"}'
echo '    (base em data/corrections.example.json — legenda com palavra errada reprova o QC)'
