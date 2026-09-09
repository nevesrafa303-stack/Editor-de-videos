#!/usr/bin/env bash
# ETAPA 1 — Analise do bruto.
#   ffprobe (resolucao, fps, duracao, codec, ROTACAO) + audio 16k mono +
#   folhas de contato + silencedetect.
set -euo pipefail

RAW="${1:-$(ls assets/raw/*.{mp4,mov,MP4,MOV,mkv} 2>/dev/null | head -1)}"
if [ -z "${RAW:-}" ] || [ ! -f "$RAW" ]; then
  echo "ERRO: nenhum bruto encontrado. Coloque o arquivo em assets/raw/ ou passe o caminho." >&2
  exit 1
fi
mkdir -p data build

echo "==> bruto: $RAW"

# --- 1.1 probe completo -> data/probe.json ---
ffprobe -v error -print_format json -show_format -show_streams \
        -show_entries "stream_side_data=rotation" "$RAW" > data/probe.json

python3 - "$RAW" <<'PY'
import json, sys
p = json.load(open('data/probe.json'))
v = next(s for s in p['streams'] if s['codec_type'] == 'video')
a = next((s for s in p['streams'] if s['codec_type'] == 'audio'), None)

rot = 0
for sd in v.get('side_data_list', []) or []:
    if 'rotation' in sd:
        rot = int(float(sd['rotation']))
# ffprobe tambem expoe via tags em alguns containers
rot = rot or int(float(v.get('tags', {}).get('rotate', 0) or 0))

num, den = (v['r_frame_rate'].split('/') + ['1'])[:2]
fps = float(num) / float(den)

info = {
    'src': sys.argv[1],
    'width': v['width'], 'height': v['height'],
    'rotation': rot,
    # dimensoes APOS aplicar a rotacao — e o que o mezzanine vai produzir
    'display_width':  v['height'] if abs(rot) in (90, 270) else v['width'],
    'display_height': v['width']  if abs(rot) in (90, 270) else v['height'],
    'fps': round(fps, 6),
    'duration': float(p['format']['duration']),
    'vcodec': v['codec_name'],
    'acodec': a['codec_name'] if a else None,
    'sample_rate': int(a['sample_rate']) if a else None,
}
json.dump(info, open('data/probe_summary.json', 'w'), indent=2)
print(json.dumps(info, indent=2))
PY

# --- 1.2 audio para transcricao ---
echo "==> extraindo audio 16k mono"
ffmpeg -y -v error -i "$RAW" -vn -ar 16000 -ac 1 build/audio16k.wav
# copia em qualidade alta para o corte/mix da Etapa 3
ffmpeg -y -v error -i "$RAW" -vn -ar 48000 -ac 1 -c:a pcm_s24le build/voice_raw.wav

# --- 1.4 folhas de contato (enquadramento e luz) ---
echo "==> folhas de contato"
rm -f build/sheet_*.png
ffmpeg -y -v error -i "$RAW" -vf "fps=1/6,scale=480:-1,tile=4x2" build/sheet_%02d.png

# --- 1.5 silencedetect (achar onde a fala realmente comeca/termina) ---
echo "==> silencedetect"
ffmpeg -v info -i build/audio16k.wav -af "silencedetect=noise=-32dB:d=0.35" -f null - \
  2>&1 | grep -E "silence_(start|end)" > data/silences.txt || true
python3 - <<'PY'
import re, json
starts, ends, out = [], [], []
for line in open('data/silences.txt'):
    m = re.search(r'silence_start: ([\d.]+)', line)
    if m: starts.append(float(m.group(1)))
    m = re.search(r'silence_end: ([\d.]+)', line)
    if m: ends.append(float(m.group(1)))
for i, s in enumerate(starts):
    e = ends[i] if i < len(ends) else None
    out.append({'start': s, 'end': e, 'dur': (e - s) if e else None})
json.dump(out, open('data/silences.json', 'w'), indent=2)
print(f"{len(out)} regioes de silencio >= 0.35s")
PY

echo "==> ETAPA 1 OK. Revise build/sheet_*.png antes de seguir."
