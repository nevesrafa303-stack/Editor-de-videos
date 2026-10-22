#!/usr/bin/env python3
"""
Assets de imagem do anúncio Amil "3 vidas" a partir da peça enviada (assets/ref/amil-gloria-story.png).

  python -I tools/prep_assets.py   -> assets/img/hospital.jpg, hospital-wide.jpg

hospital.jpg: a foto da fachada (faixa de cima da peça, 1080x505) sem a aba branca do logo, que
fica por cima do céu no canto superior esquerdo. A aba é tirada por máscara (branco + roxo do
logo) e preenchida com a cor da linha à direita (céu/fachada) desfocada; no vídeo esse canto
fica sempre sob a aba do logo ou fora do quadro.
hospital-wide.jpg: a mesma foto ampliada 1,5x (Lanczos + nitidez leve) para os enquadramentos
maiores da story.
"""
import os

import cv2
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.join(ROOT, "assets/ref/amil-gloria-story.png")
OUT = os.path.join(ROOT, "assets/img")

im = cv2.imread(SRC, cv2.IMREAD_COLOR)
photo = im[0:505, :, :].copy()

# aba branca do logo: canto superior esquerdo, branco quase puro ou o roxo do logo
reg = photo[0:175, 0:380].astype(np.int16)
b, g, r = reg[..., 0], reg[..., 1], reg[..., 2]
white = (r > 238) & (g > 238) & (b > 238)
purple = (b > 180) & (r < 140) & (g < 90)
m = np.zeros(photo.shape[:2], np.uint8)
m[0:175, 0:380] = ((white | purple) * 255).astype(np.uint8)
# fecha o logo dentro da aba e cobre a borda antisserrilhada
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
# o branco do totem (placa do hospital) não é aba: só vale o que encosta no topo/esquerda
n, lab = cv2.connectedComponents(m)
keep = np.zeros_like(m)
for k in range(1, n):
    ys, xs = np.where(lab == k)
    if ys.min() <= 2:
        keep[lab == k] = 255
keep = cv2.dilate(keep, np.ones((9, 9), np.uint8))
# preenchimento por linha: cada linha da aba recebe a cor do primeiro pixel livre à direita
# (céu em cima, fachada embaixo), depois um desfoque forte só no remendo
clean = photo.copy()
for y in range(keep.shape[0]):
    xs = np.where(keep[y] > 0)[0]
    if len(xs):
        x1 = min(xs.max() + 6, photo.shape[1] - 1)
        clean[y, : x1] = photo[y, x1 : x1 + 12].mean(axis=0)
blur = cv2.GaussianBlur(clean, (0, 0), 14)
soft = cv2.GaussianBlur(keep, (0, 0), 5).astype(np.float32)[..., None] / 255
clean = (photo * (1 - soft) + blur * soft).astype(np.uint8)

os.makedirs(OUT, exist_ok=True)
cv2.imwrite(os.path.join(OUT, "hospital.jpg"), clean, [cv2.IMWRITE_JPEG_QUALITY, 94])
cv2.imwrite(os.path.join(ROOT, "assets/ref/hospital-mask.png"), keep)
wide = cv2.resize(clean, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_LANCZOS4)
sharp = cv2.addWeighted(wide, 1.35, cv2.GaussianBlur(wide, (0, 0), 1.6), -0.35, 0)
cv2.imwrite(os.path.join(OUT, "hospital-wide.jpg"), sharp, [cv2.IMWRITE_JPEG_QUALITY, 92])
print("hospital.jpg", clean.shape, "máscara", int((keep > 0).sum()), "px")
