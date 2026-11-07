"""Refaz o _painel.jpg do banco: um quadro do meio de cada corte, com o nome.

  python -I tools/gerar_painel.py
"""
import glob, os, subprocess, tempfile
from PIL import Image, ImageDraw
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

def frame(f, w, tmp):
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f],
                             capture_output=True, text=True).stdout)
    p = os.path.join(tmp, "f.png")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{d / 2:.2f}", "-i", f, "-frames:v", "1", "-vf", f"scale={w}:-1", p], check=True)
    return Image.open(p).convert("RGB")

def grade(files, w, cols, tmp):
    tiles = []
    for f in files:
        im = frame(f, w, tmp); t = Image.new("RGB", (w, im.height + 18), (20, 20, 20)); t.paste(im, (0, 18))
        ImageDraw.Draw(t).text((3, 3), os.path.basename(f)[:-4][:34], fill=(255, 255, 255)); tiles.append(t)
    th = max(t.height for t in tiles); rows = (len(tiles) + cols - 1) // cols
    g = Image.new("RGB", (cols * (w + 6), rows * (th + 6)), (40, 40, 40))
    for k, t in enumerate(tiles): g.paste(t, ((k % cols) * (w + 6), (k // cols) * (th + 6)))
    return g

with tempfile.TemporaryDirectory() as tmp:
    a = grade(sorted(glob.glob(os.path.join(B, "hospitais/vertical/*.mp4"))), 150, 9, tmp)
    b = grade(sorted(glob.glob(os.path.join(B, "hospitais/faixa/*.mp4"))), 222, 6, tmp)
W = max(a.width, b.width)
p = Image.new("RGB", (W, a.height + b.height + 60), (40, 40, 40)); d = ImageDraw.Draw(p)
d.text((6, 8), "vertical/ (e recorte-topo/)", fill=(255, 220, 120)); p.paste(a, (0, 28))
d.text((6, a.height + 36), "faixa/", fill=(255, 220, 120)); p.paste(b, (0, a.height + 56))
p.save(os.path.join(B, "_painel.jpg"), quality=82)
print("painel", p.size)
