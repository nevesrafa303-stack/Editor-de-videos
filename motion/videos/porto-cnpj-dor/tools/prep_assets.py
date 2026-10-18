#!/usr/bin/env python3
"""
Prepara a foto do Hospital Dr. Beda para o filme Porto.

  python3 -I tools/prep_assets.py   (numpy, opencv-python-headless)

Entrada: assets/ref/ref-story.png (peça "AD - Dr. Beda Preço Porto STORY", 1080x1920)
Saída:   assets/img/plate.png  RGBA 1080x1920 (story), já nas coordenadas do vídeo:
         a foto desce PHOTO_DY px (a placa DR. BEDA sai da faixa de cima, que o
         Instagram cobre); só fica opaco o que é foto na peça: as linhas de cima
         inteiras e, à direita do bloco azul, a área até a curva. A curva é
         recortada pelo círculo vetorial da arte do vídeo (o da peça, centro
         679,5 / 585, r 400,5, subido LAYOUT_DY junto com os blocos), com
         antisserrilhado, para não aparecer serrilhado da peça.
         assets/img/plate-feed.png  RGBA 1080x1080 (feed), no enquadramento da peça
         "AD - Dr. Beda Preço Porto" (assets/ref/ref-feed.png). Abaixo da faixa de foto
         do feed entra a story alinhada por ORB (mesma foto, escala ~0,75), para o
         cartão do ato 2 ter foto suficiente; a curva é a da peça de feed.
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


FEED = dict(block_top=315, block_right=669, circle=(726.5, 350.8, 362.0))


def align(src, dst, src_mask, dst_mask):
    orb = cv2.ORB_create(6000)
    k1, d1 = orb.detectAndCompute(cv2.cvtColor(src, cv2.COLOR_BGR2GRAY), src_mask)
    k2, d2 = orb.detectAndCompute(cv2.cvtColor(dst, cv2.COLOR_BGR2GRAY), dst_mask)
    mt = sorted(cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(d1, d2), key=lambda m: m.distance)[:800]
    p1 = np.float32([k1[m.queryIdx].pt for m in mt])
    p2 = np.float32([k2[m.trainIdx].pt for m in mt])
    M, inl = cv2.estimateAffinePartial2D(p1, p2, method=cv2.RANSAC, ransacReprojThreshold=2)
    return M, int(inl.sum())


def feed_plate():
    story = cv2.imread(os.path.join(ROOT, 'assets', 'ref', 'ref-story.png'))
    feed = cv2.imread(os.path.join(ROOT, 'assets', 'ref', 'ref-feed.png'))
    S = 1080
    ms = np.zeros(story.shape[:2], np.uint8)
    ms[:700] = 255
    mf = np.zeros(feed.shape[:2], np.uint8)
    mf[:310] = 255
    M, n = align(story, feed, ms, mf)
    warped = cv2.warpAffine(story, M, (S, S), flags=cv2.INTER_LANCZOS4)
    valid = cv2.warpAffine(ms, M, (S, S), flags=cv2.INTER_NEAREST)
    valid = cv2.erode(valid, np.ones((7, 7), np.uint8))
    # mesma cor da peça de feed na área em comum
    both = (valid > 0) & (mf > 0)
    w = warped.astype(np.float32)
    for c in range(3):
        a, b = w[..., c][both], feed[..., c][both].astype(np.float32)
        w[..., c] = (w[..., c] - a.mean()) / (a.std() + 1e-6) * b.std() + b.mean()
    warped = np.clip(w, 0, 255).astype(np.uint8)
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    bt, br = FEED['block_top'], FEED['block_right']
    cx, cy, r = FEED['circle']
    inside = np.clip(r - np.hypot(xx - cx, yy - cy) + 0.5, 0, 1)
    feed_photo = np.where((yy < bt - 2) | ((xx >= br) & (inside > 0)), 1.0, 0.0).astype(np.float32)
    feed_photo = cv2.erode(feed_photo, np.ones((3, 3), np.uint8))
    a_feed = cv2.GaussianBlur(feed_photo, (0, 0), 1.5)[..., None]
    rgb = feed.astype(np.float32) * a_feed + warped.astype(np.float32) * (1 - a_feed)
    alpha = np.maximum(feed_photo, (valid > 0).astype(np.float32))
    alpha = alpha * np.where((yy >= cy) & (xx >= cx), inside, 1.0)  # curva da peça
    out = np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), (alpha * 255).round().astype(np.uint8)])
    cv2.imwrite(os.path.join(ROOT, 'assets', 'img', 'plate-feed.png'), out)
    ys = np.where(alpha[:, 500] > 0.5)[0]
    print(f'plate-feed.png: story->feed {n} inliers, escala {np.hypot(*M[0, :2]):.4f}; foto em x=500 até y={ys.max()}')


if __name__ == '__main__':
    main()
    feed_plate()
