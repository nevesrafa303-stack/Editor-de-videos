#!/usr/bin/env python3
"""
Recorta os vídeos de banco (Mixkit, licença gratuita para uso comercial, sem atribuição obrigatória)
usados nas cenas. A lista fica em tools/clips.json: para cada clipe, o id do Mixkit, o início e a
duração do trecho, o centro horizontal do recorte (0–1) e o formato de saída (vertical 9:16 ou 4:5).

  python3 -I tools/prep_clips.py [pasta-de-cache]   -> assets/video/<nome>.mp4

Os originais são baixados de assets.mixkit.co para a pasta de cache (fora do repositório; padrão
.cache/mixkit) e recortados com ffmpeg: sem áudio, 30 fps, H.264. Nenhuma correção de cor.
"""
import json
import os
import subprocess
import sys
import urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
CACHE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, ".cache", "mixkit")
OUT = os.path.join(ROOT, "assets", "video")
SIZES = {"9x16": (720, 1280), "4x5": (720, 900), "1x1": (720, 720)}
os.makedirs(CACHE, exist_ok=True)
os.makedirs(OUT, exist_ok=True)


def source(mid):
    for q in (1080, 720):
        path = os.path.join(CACHE, f"{mid}-{q}.mp4")
        if os.path.exists(path) and os.path.getsize(path) > 100_000:
            return path
        try:
            urllib.request.urlretrieve(f"https://assets.mixkit.co/videos/{mid}/{mid}-{q}.mp4", path)
            if os.path.getsize(path) > 100_000:
                return path
        except Exception:
            pass
    raise SystemExit(f"não consegui baixar o clipe {mid} do Mixkit")


for c in json.load(open(os.path.join(ROOT, "tools", "clips.json"))):
    w, h = SIZES[c.get("fmt", "9x16")]
    ar = w / h
    vf = (f"crop=ih*{ar:.5f}:ih:max(0\\,min(iw-ih*{ar:.5f}\\,iw*{c['cx']}-ih*{ar / 2:.5f})):0,"
          f"scale={w}:{h}:flags=lanczos,setsar=1,fps=30")
    dst = os.path.join(OUT, f"{c['name']}.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(c["ss"]), "-t", str(c["dur"]), "-i", source(c["mixkit"]),
                    "-vf", vf, "-an", "-c:v", "libx264", "-crf", "22", "-preset", "medium", "-pix_fmt", "yuv420p",
                    "-movflags", "+faststart", dst], check=True)
    print(f"{c['name']}.mp4  mixkit {c['mixkit']}  {c['ss']}+{c['dur']}s  {w}x{h}  {os.path.getsize(dst) // 1024} KB")
