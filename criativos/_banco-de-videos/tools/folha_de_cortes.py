"""Detecta os cortes de cena de um vídeo e monta uma folha com um quadro de cada trecho (para escolher o que recortar).

  python -I folha_de_cortes.py VIDEO.mp4 SAIDA.jpg [limiar=0.15]

Imprime a lista de trechos (início–fim em segundos). Requer ffmpeg e Pillow.
"""
import subprocess, sys, tempfile, os
from PIL import Image, ImageDraw

src, out = sys.argv[1], sys.argv[2]
thr = sys.argv[3] if len(sys.argv) > 3 else "0.15"
log = subprocess.run(["ffmpeg", "-hide_banner", "-i", src, "-vf", f"select='gt(scene,{thr})',showinfo", "-an", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
cuts = [float(x.split("pts_time:")[1].split()[0]) for x in log.splitlines() if "pts_time:" in x]
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src],
                           capture_output=True, text=True).stdout)
pts = [0.0] + cuts + [dur]
shots = [(a, b) for a, b in zip(pts, pts[1:]) if b - a > 0.25]
tiles = []
with tempfile.TemporaryDirectory() as tmp:
    for k, (a, b) in enumerate(shots):
        p = os.path.join(tmp, f"{k}.png")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{(a + b) / 2:.2f}", "-i", src, "-frames:v", "1", "-vf", "scale=150:-1", p], check=True)
        im = Image.open(p).convert("RGB"); d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 150, 14], fill=(0, 0, 0)); d.text((2, 1), f"{k} {a:.1f}-{b:.1f}", fill=(255, 255, 0))
        tiles.append(im)
        print(f"{k:3d}  {a:7.2f} – {b:7.2f} s")
cols = 12; th = max(t.height for t in tiles); rows = (len(tiles) + cols - 1) // cols
sheet = Image.new("RGB", (cols * 152, rows * (th + 2)), "black")
for k, t in enumerate(tiles): sheet.paste(t, ((k % cols) * 152, (k // cols) * (th + 2)))
sheet.save(out, quality=82)
