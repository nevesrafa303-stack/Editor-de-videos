"""limpar_corte.py — recorta um trecho de vídeo, tira o áudio e apaga a legenda branca queimada (inpainting por quadro).

  python -I limpar_corte.py SRC T0 T1 OUT [--cap Y0,Y1] [--crop x,y,w,h] [--grow 11]

A legenda desses vídeos é branca, centralizada e fica sempre na mesma altura (--cap: faixa de linhas). Em cada
quadro, dentro dessa faixa, acha a palavra a partir do centro da tela (colunas com traço de letra, com espaços de
até 26 px entre letras e palavras), marca os pixels brancos puros e preenche com cv2.inpaint (Telea).
Saída H.264 30 fps, sem áudio.
"""
import argparse, subprocess
import numpy as np
import cv2

ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("t0", type=float); ap.add_argument("t1", type=float); ap.add_argument("out")
ap.add_argument("--cap"); ap.add_argument("--crop")
ap.add_argument("--grow", type=int, default=11, help="diâmetro (px) da área apagada em volta de cada letra; maior pega sombra")
a = ap.parse_args()

cap = cv2.VideoCapture(a.src)
cap.set(cv2.CAP_PROP_POS_MSEC, a.t0 * 1000)
frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    if cap.get(cv2.CAP_PROP_POS_MSEC) / 1000 > a.t1 + 1e-3: break
    frames.append(f)
H, W = frames[0].shape[:2]
XC = W // 2

def text_mask(f, r0, r1):
    reg = f[r0:r1].astype(np.int16)
    mn = reg.min(axis=2); ch = reg.max(axis=2) - mn
    strict = (mn >= 232) & (ch <= 26)
    bh = r1 - r0
    cnt = strict.sum(axis=0)
    letter = (cnt >= 2) & (cnt <= 0.8 * bh)
    cols = np.where(letter)[0]
    if len(cols) == 0: return None
    # parte do centro e anda para os lados enquanto houver letra (espaço de até 26 px)
    near = cols[np.abs(cols - XC) <= 60]
    if len(near) == 0: return None
    lo = hi = int(near[np.argmin(np.abs(near - XC))])
    s = set(cols.tolist())
    gap = 0; x = lo
    while x > 0 and gap <= 26:
        x -= 1; gap = 0 if x in s else gap + 1
        if x in s: lo = x
    gap = 0; x = hi
    while x < W - 1 and gap <= 26:
        x += 1; gap = 0 if x in s else gap + 1
        if x in s: hi = x
    if hi - lo < 14: return None
    x0, x1 = max(0, lo - 8), min(W, hi + 9)
    m = np.zeros((H, W), np.uint8)
    m[r0:r1, x0:x1] = strict[:, x0:x1].astype(np.uint8) * 255
    return cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (a.grow, a.grow)), iterations=1)

hits = 0
out = []
for f in frames:
    if a.cap:
        r0, r1 = map(int, a.cap.split(","))
        m = text_mask(f, r0, r1)
        if m is not None:
            hits += 1
            f = cv2.inpaint(f, m, 6, cv2.INPAINT_TELEA)
    out.append(f)
if a.crop:
    x, y, w, h = map(int, a.crop.split(","))
    out = [f[y:y + h, x:x + w] for f in out]
h, w = out[0].shape[:2]
w2, h2 = w - w % 2, h - h % 2
p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w2}x{h2}", "-r", "30",
                      "-i", "-", "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
                      "-movflags", "+faststart", a.out], stdin=subprocess.PIPE)
for f in out: p.stdin.write(np.ascontiguousarray(f[:h2, :w2]).tobytes())
p.stdin.close(); p.wait()
print(f"{a.out.split('/hospitais/')[-1]}: {len(out)} quadros, {w2}x{h2}, legenda apagada em {hits}")
