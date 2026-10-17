#!/usr/bin/env python3
"""
Prepara a foto do Hospital Dr. Beda para o filme Porto.

  python3 -I tools/prep_assets.py   (numpy, opencv-python-headless)

Entrada: assets/ref/ref-story.png (peça "AD - Dr. Beda Preço Porto STORY", 1080x1920)
Saída:   assets/img/plate.png  RGBA 1080x1920, já nas coordenadas do vídeo:
         a foto desce PHOTO_DY px (a placa DR. BEDA sai da faixa de cima, que o
         Instagram cobre); só fica opaco o que é foto na peça: as linhas de cima
         inteiras e, à direita do bloco azul, a área até a curva. A curva é
         recortada pelo círculo vetorial da arte do vídeo (o da peça, centro
         679,5 / 585, r 400,5, subido LAYOUT_DY junto com os blocos), com
         antisserrilhado, para não aparecer serrilhado da peça.
"""
import os

import cv2
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
W, H = 1080, 1920
PHOTO_DY = 10
BLOCK_TOP = 705      # bloco azul-claro começa na linha 707 da peça
BLOCK_RIGHT = 756    # e termina na coluna 755
LAYOUT_DY = 8       # blocos e curva: a peça desce 8 px; a parte de baixo é compactada no build
CIRCLE = (679.5, 585.0 + LAYOUT_DY, 400.5)  # em coordenadas do vídeo


def main():
    story = cv2.imread(os.path.join(ROOT, 'assets', 'ref', 'ref-story.png'))
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

    # alfa em coordenadas do vídeo: linhas de foto inteiras + direita do bloco até a curva
    cx, cy, r = CIRCLE
    top_end = BLOCK_TOP + PHOTO_DY
    inside = np.clip(r - np.hypot(xx - cx, yy - cy) + 0.5, 0, 1)
    base = np.where((yy < top_end) | (xx >= BLOCK_RIGHT), 1.0, 0.0)
    curve = np.where((yy >= cy) & (xx >= cx), inside, 1.0)  # quadrante de baixo à direita
    a = (base * curve).astype(np.float32)
    a[top_end - 2:top_end, :BLOCK_RIGHT] = 0  # borda do bloco da peça
    # a peça desce PHOTO_DY; o topo que falta é espelhado (céu/fachada) e suavizado
    rgb = np.zeros((H, W, 3), np.uint8)
    rgb[PHOTO_DY:] = story[:H - PHOTO_DY]
    top = cv2.flip(story[:PHOTO_DY + 20], 0)[-PHOTO_DY:]
    rgb[:PHOTO_DY] = cv2.GaussianBlur(top, (0, 0), 3)
    out = np.dstack([rgb, (a * 255).round().astype(np.uint8)])
    os.makedirs(os.path.join(ROOT, 'assets', 'img'), exist_ok=True)
    cv2.imwrite(os.path.join(ROOT, 'assets', 'img', 'plate.png'), out)
    ys = np.where(a[:, 300] > 0.5)[0]
    print(f'plate.png: foto opaca até y={ys.max()} à esquerda; DR. BEDA em y≈{215 + PHOTO_DY}-{280 + PHOTO_DY}')


if __name__ == '__main__':
    main()
