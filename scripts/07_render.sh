#!/usr/bin/env bash
# ETAPA 5.1 — Render + limiter de seguranca no true peak.
set -euo pipefail
mkdir -p out

# O Remotion baixa o proprio Chrome Headless Shell. Em ambientes sem esse
# acesso de rede, aponte REMOTION_BROWSER para um binario ja instalado.
BROWSER_FLAG=()
CANDIDATOS=(
  "${REMOTION_BROWSER:-}"
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"
  "$(command -v chromium || true)"
  "$(command -v google-chrome || true)"
)
for c in "${CANDIDATOS[@]}"; do
  if [ -n "$c" ] && [ -x "$c" ]; then
    BROWSER_FLAG=(--browser-executable "$c")
    echo "==> browser: $c"
    break
  fi
done

echo "==> remotion render"
npx remotion render Reel out/final_raw.mp4 \
  --codec=h264 --crf 18 --concurrency "${RENDER_CONCURRENCY:-2}" \
  "${BROWSER_FLAG[@]}"

# 3.5 — SFX somados a voz podem estourar o TP. Mede e, se preciso, aplica
# alimiter e RE-MUXA (-c:v copy, sem re-render).
TP=$(ffmpeg -v info -i out/final_raw.mp4 -af loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json -f null - 2>&1 \
     | python3 -c "import sys,json;s=sys.stdin.read();print(json.loads(s[s.rfind('{'):s.rfind('}')+1])['input_tp'])")
echo "==> true peak medido: ${TP} dBTP"

NEEDS=$(python3 -c "print(1 if float('${TP}') > -1.0 else 0)")
if [ "$NEEDS" = "1" ]; then
  echo "==> TP acima de -1.0 dBTP: aplicando alimiter e re-muxando (sem re-render)"
  ffmpeg -y -v error -i out/final_raw.mp4 \
    -af "alimiter=limit=0.8:level=disabled" \
    -c:v copy -c:a aac -b:a 256k out/final.mp4
else
  ffmpeg -y -v error -i out/final_raw.mp4 -c:v copy -c:a aac -b:a 256k out/final.mp4
fi

echo "==> out/final.mp4 pronto"
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate -of default=nw=1 out/final.mp4
