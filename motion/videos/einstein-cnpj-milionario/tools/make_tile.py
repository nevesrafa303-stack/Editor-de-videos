#!/usr/bin/env python3
"""
Cubo 3D da Alice no mesmo estilo dos cubos de Omint, SulAmérica, Bradesco e Amil
(assets/img/cubo-*.png, vindos de ../sp-rede-premium-cnpj): face rosa com o logo oficial, lateral em
relevo, leve inclinação e sombra. O logo não é redesenhado: o "alice" branco é recortado do ícone
enviado pelo cliente (assets/ref/alice-icone.png).

  python3 -I tools/make_tile.py   -> assets/img/cubo-alice.png
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
IMG = os.path.join(ROOT, 'assets', 'img')
S = 2  # supersampling


def alice_logo():
    a = np.asarray(Image.open(os.path.join(ROOT, 'assets', 'ref', 'alice-icone.png')).convert('RGBA')).astype(np.float32)
    # alfa = quão branco o pixel é sobre o rosa da face (o "alice" é branco sobre rosa)
    white = np.clip((a[..., 1] - 3) / (255 - 3), 0, 1) * (a[..., 3] / 255)
    logo = np.zeros(a.shape, np.uint8)
    logo[..., :3] = 255
    logo[..., 3] = (white * 255).astype(np.uint8)
    im = Image.fromarray(logo, 'RGBA')
    ys, xs = np.where(logo[..., 3] > 40)
    return im.crop((xs.min() - 6, ys.min() - 6, xs.max() + 7, ys.max() + 7))


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


tile(alice_logo(), (214, 22, 148), (176, 0, 112), (150, 0, 96), 0.7, 10, 'cubo-alice.png')
