#!/usr/bin/env python3
"""
Prepara as imagens do filme Amil 50%.

  python3 -I tools/prep_assets.py   (numpy, opencv-python-headless)

assets/img/einstein.png  fachada do Hospital Israelita Albert Einstein, tirada da peça
                         "Amil Black" do Drive (assets/ref/amil-black-einstein-story.png): a faixa
                         de foto abaixo do selo da corretora (1080x436).
assets/img/einstein-bg-*.jpg  a mesma foto ampliada e desfocada, fundo da cena do hospital.
assets/img/amil-logo.png logo Amil branco com alfa, extraído da peça ADS01 (story), 2x.
"""
import os

import cv2
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
REF = os.path.join(ROOT, 'assets', 'ref')
IMG = os.path.join(ROOT, 'assets', 'img')


def einstein():
    """faixa de foto da peça sem o selo da corretora (o selo fica nas linhas 28-156)"""
    src = cv2.imread(os.path.join(REF, 'amil-black-einstein-story.png'))
    out = src[158:594].copy()
    cv2.imwrite(os.path.join(IMG, 'einstein.png'), out)
    print('einstein.png', out.shape)


def einstein_bg():
    """fundo desfocado da cena do hospital (story 1080x1920 e feed 1080x1080)"""
    src = cv2.imread(os.path.join(IMG, 'einstein.png'))
    for name, (w, h), sig in (('story', (1080, 1920), 28), ('feed', (1080, 1080), 24)):
        s = h / src.shape[0]
        big = cv2.resize(src, (round(src.shape[1] * s), h), interpolation=cv2.INTER_CUBIC)
        x0 = (big.shape[1] - w) // 2
        big = cv2.GaussianBlur(big[:, x0:x0 + w], (0, 0), sig)
        big = np.clip(big.astype(np.float32) * 0.9, 0, 255).astype(np.uint8)
        cv2.imwrite(os.path.join(IMG, f'einstein-bg-{name}.jpg'), big, [cv2.IMWRITE_JPEG_QUALITY, 88])
        print(f'einstein-bg-{name}.jpg', big.shape)


def logo():
    src = cv2.imread(os.path.join(REF, 'ads01-story.png')).astype(np.float32)
    x0, y0, x1, y1 = 360, 1610, 720, 1790
    crop = src[y0:y1, x0:x1]
    mn = crop.min(axis=2)
    a = np.clip((mn - 110) / (235 - 110), 0, 1)
    ys, xs = np.where(a > 0.5)
    pad = 6
    a = a[max(0, ys.min() - pad):ys.max() + pad, max(0, xs.min() - pad):xs.max() + pad]
    a2 = cv2.resize(a, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    a2 = np.clip((a2 - 0.5) * 1.6 + 0.5, 0, 1)
    rgba = np.dstack([np.full(a2.shape, 255, np.float32)] * 3 + [a2 * 255]).astype(np.uint8)
    cv2.imwrite(os.path.join(IMG, 'amil-logo.png'), rgba)
    print('amil-logo.png', rgba.shape)


if __name__ == '__main__':
    os.makedirs(IMG, exist_ok=True)
    einstein()
    einstein_bg()
    logo()
