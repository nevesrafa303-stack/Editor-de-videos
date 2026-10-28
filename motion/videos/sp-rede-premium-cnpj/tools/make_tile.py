#!/usr/bin/env python3
"""
Cubos 3D da Omint e da Amil no mesmo estilo dos cubos de SulAmérica e Bradesco
(assets/img/cubo-*.png): face com o logo oficial, lateral em relevo, leve inclinação e sombra. Os
logos não são redesenhados:
  - Omint: assets/img/omint-logo.png (enviado pelo cliente), azul sobre branco, recortado do fundo;
  - Amil: logo branco com alfa de ../amil-pme-3vidas/assets/img/amil-logo.png, sobre face azul
    (o cubo da Amil que existia no repositório tinha só ~100 px de face e ficava borrado ampliado).

  python3 -I tools/make_tile.py   -> assets/img/cubo-omint.png e assets/img/cubo-amil.png
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
IMG = os.path.join(ROOT, 'assets', 'img')
S = 2  # supersampling


def omint_logo():
    a = np.asarray(Image.open(os.path.join(IMG, 'omint-logo.png')).convert('RGB')).astype(np.float32)
    # alfa a partir da distância ao branco (o logo é azul sobre branco)
    alpha = np.clip((255 - a.min(axis=2)) * 2.2, 0, 255).astype(np.uint8)
    ys, xs = np.where(alpha > 20)
    box = (xs.min() - 4, ys.min() - 4, xs.max() + 5, ys.max() + 5)
    return Image.fromarray(np.dstack([a.astype(np.uint8), alpha]), 'RGBA').crop(box)


def amil_logo():
    im = Image.open(os.path.join(ROOT, '..', 'amil-pme-3vidas', 'assets', 'img', 'amil-logo.png')).convert('RGBA')
    return im.crop(im.getbbox())


def tile(logo, top, bot, side, logo_w, rot, out):
    W, H = 560 * S, 580 * S
    T = 400 * S          # lado da face
    R = 96 * S           # raio dos cantos
    DEPTH = 30 * S       # espessura da lateral
    x0, y0 = (W - T) // 2, 70 * S
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    # lateral: camadas da base até a face, clareando para cima
    for k in range(DEPTH, 0, -1):
        f = 0.72 + 0.28 * (1 - k / DEPTH)
        layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(layer).rounded_rectangle((x0, y0 + k, x0 + T, y0 + T + k), R,
                                                fill=tuple(int(c * f) for c in side) + (255,))
        img = Image.alpha_composite(img, layer)
    # face com degradê vertical
    grad = np.linspace(0, 1, T)[:, None, None]
    face_rgb = np.broadcast_to(np.array(top) * (1 - grad) + np.array(bot) * grad, (T, T, 3))
    mask = Image.new('L', (T, T), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, T - 1, T - 1), R, fill=255)
    face = Image.fromarray(face_rgb.astype(np.uint8), 'RGB').convert('RGBA')
    face.putalpha(mask)
    # brilho na borda
    hl = Image.new('RGBA', (T, T), (0, 0, 0, 0))
    ImageDraw.Draw(hl).rounded_rectangle((6 * S, 6 * S, T - 6 * S, T - 6 * S), R - 6 * S, outline=(255, 255, 255, 150), width=4 * S)
    face = Image.alpha_composite(face, hl)
    # logo centralizado
    lw = int(T * logo_w)
    lh = int(logo.height * lw / logo.width)
    face.alpha_composite(logo.resize((lw, lh), Image.LANCZOS), ((T - lw) // 2, (T - lh) // 2 + 6 * S))
    img.alpha_composite(face, (x0, y0))
    # inclinação e sombra
    img = img.rotate(rot, resample=Image.BICUBIC, center=(W // 2, H // 2))
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse((x0 + 30 * S, y0 + T + 40 * S, x0 + T - 30 * S, y0 + T + 80 * S), fill=(0, 0, 0, 110))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18 * S))
    res = Image.alpha_composite(shadow, img).resize((W // S, H // S), Image.LANCZOS)
    res = res.crop(res.getbbox())
    res.save(os.path.join(IMG, out))
    print(out, res.size)


tile(omint_logo(), (255, 255, 255), (228, 233, 242), (204, 212, 236), 0.78, 9, 'cubo-omint.png')
tile(amil_logo(), (38, 108, 245), (10, 60, 196), (12, 52, 170), 0.66, 12, 'cubo-amil.png')
