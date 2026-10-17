#!/usr/bin/env python3
"""
Prepara os assets do motion SulAmérica 15 s a partir das referências.

  python3 tools/prep_assets.py   (precisa de numpy, opencv-python-headless, pillow)

Entradas (assets/ref/):
  ref-story.png              peça final 1080x1920 (referência de layout e foto nítida)
  ref-feed.png               peça final 1080x1080 (mais área da foto, nítida)
  nursing-care-lowres.png    foto original 480x854 (cobre a tela toda, mas suave)
  logo-sulamerica-oficial.png  logo oficial (lockup 130 anos) do site da SulAmérica

Saídas (assets/img/):
  plate.png        foto do hospital em tela cheia 1080x1920, no enquadramento da story
  totem.png        totem "Hospital Nursing Care" recortado (RGBA) para o parallax
  logo-wave.png    só a onda laranja do logo (RGBA)
  logo-text.png    só o "SulAmérica" do logo, em branco (RGBA)
"""
import os

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
REF = os.path.join(ROOT, 'assets', 'ref')
OUT = os.path.join(ROOT, 'assets', 'img')
W, H = 1080, 1920

NAVY = np.array([0x53, 0x23, 0x0B])     # BGR de #0B2353
ORANGE = np.array([0x24, 0x5E, 0xE0])   # BGR de #E05E24


def near(img, color, tol):
    return np.abs(img.astype(int) - color).max(axis=2) <= tol


def overlay_free_rows(img, start_y, end_y, x_min):
    """máscara da foto: tira o azul-marinho que encosta na borda direita (curva)"""
    h, w = img.shape[:2]
    m = np.zeros((h, w), np.uint8)
    navy = near(img, NAVY, 26)
    for y in range(h):
        if y < start_y:
            m[y, :] = 255
            continue
        if y >= end_y:
            continue
        row = navy[y]
        x = w
        while x > 0 and row[x - 1]:
            x -= 1
        if w - x > 4:
            m[y, max(x_min, 0):max(x - 6, 0)] = 255
        else:
            m[y, x_min:] = 255
    return m


def align(src, dst, src_mask, dst_mask):
    orb = cv2.ORB_create(6000)
    g1 = cv2.cvtColor(src, cv2.COLOR_BGR2GRAY)
    g2 = cv2.cvtColor(dst, cv2.COLOR_BGR2GRAY)
    k1, d1 = orb.detectAndCompute(g1, src_mask)
    k2, d2 = orb.detectAndCompute(g2, dst_mask)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    mt = sorted(bf.match(d1, d2), key=lambda m: m.distance)[:800]
    p1 = np.float32([k1[m.queryIdx].pt for m in mt])
    p2 = np.float32([k2[m.trainIdx].pt for m in mt])
    M, inl = cv2.estimateAffinePartial2D(p1, p2, method=cv2.RANSAC, ransacReprojThreshold=3)
    return M, int(inl.sum())


def match_color(src, ref, mask_src, mask_ref):
    out = src.astype(np.float32)
    for c in range(3):
        a = src[..., c][mask_src > 0].astype(np.float32)
        b = ref[..., c][mask_ref > 0].astype(np.float32)
        out[..., c] = (out[..., c] - a.mean()) / (a.std() + 1e-6) * b.std() + b.mean()
    return np.clip(out, 0, 255).astype(np.uint8)


def feather(mask, px):
    return cv2.GaussianBlur(mask.astype(np.float32) / 255.0, (0, 0), px)[..., None]


def build_plate():
    story = cv2.imread(os.path.join(REF, 'ref-story.png'))
    feed = cv2.imread(os.path.join(REF, 'ref-feed.png'))

    # áreas de foto limpa em cada peça (sem bloco laranja, cartão ou curva azul)
    ms = overlay_free_rows(story, 640, 1000, 0)
    ms[725:, :745] = 0
    ms[995:, :] = 0
    mf = overlay_free_rows(feed, 470, 720, 0)
    mf[418:, :632] = 0
    mf[705:, :] = 0

    Mf, nf = align(feed, story, mf, ms)
    print(f'alinhamento feed->story: {nf} inliers, escala {np.hypot(*Mf[0, :2]):.3f}')
    wf = cv2.warpAffine(feed, Mf, (W, H), flags=cv2.INTER_LANCZOS4)
    wfm = cv2.warpAffine(mf, Mf, (W, H), flags=cv2.INTER_NEAREST)
    wfm = cv2.erode(wfm, np.ones((9, 9), np.uint8))
    both = ((wfm > 0) & (ms > 0)).astype(np.uint8)
    wf = match_color(wf, story, both, both)

    plate = np.zeros((H, W, 3), np.float32)
    a = feather(wfm, 5)
    plate = plate * (1 - a) + wf.astype(np.float32) * a
    sm = cv2.erode(ms, np.ones((7, 7), np.uint8))
    a = feather(sm, 3)
    plate = plate * (1 - a) + story.astype(np.float32) * a
    cover = np.maximum(sm, wfm)

    # extensão onde não há foto (sob o totem, atrás do bloco laranja, e abaixo do
    # gramado): mosaico espelhado do gramado da direita (sem o tronco da palmeira),
    # no mesmo brilho do gramado real, com a luz caindo para baixo; depois a imagem
    # escurece até o azul-marinho, onde a base da arte entra
    pa = plate[815:945, 805:895]
    pb = plate[815:945, 935:1075]
    assert cover[815:945, 805:895].min() == 255 and cover[815:945, 935:1075].min() == 255
    row = np.concatenate([pa, pb[:, ::-1], pb, pa[:, ::-1]], axis=1)
    row = np.concatenate([row, row[:, ::-1]], axis=1)
    blk = np.concatenate([row, row[::-1]], axis=0)
    tile = np.tile(blk, (H // blk.shape[0] + 2, W // blk.shape[1] + 2, 1))[:H, :W].astype(np.float32)
    tile = cv2.GaussianBlur(tile, (0, 0), 1.0)
    ok = cv2.erode(cover, np.ones((15, 15), np.uint8))[730:900, 745:830] > 0
    real = plate[730:900, 745:830][ok].mean(0)
    tile *= real / (tile[760:1000].reshape(-1, 3).mean(0) + 1e-6)
    yy = np.arange(H, dtype=np.float32)[:, None, None]
    tile *= 1 - 0.4 * np.clip((yy - 760) / 420.0, 0, 1)
    cover[1000:, :] = 0  # o meio-fio cortado no fim da foto vira gramado também
    a = feather(cv2.erode(cover, np.ones((9, 9), np.uint8)), 7)
    plate = plate * a + tile * (1 - a)
    dark = np.array([0x30, 0x14, 0x08], np.float32)  # BGR navy bem escuro
    dist = np.clip((yy - 1060) / 520.0, 0, 1)
    plate = plate * (1 - dist) + dark * dist
    plate = np.clip(plate, 0, 255).astype(np.uint8)
    cv2.imwrite(os.path.join(OUT, 'plate.png'), plate)
    return plate, story


def build_totem(plate, story):
    # totem: azul saturado dentro do retângulo dele na story + letras brancas + faixa verde
    x0, y0, x1, y1 = 80, 60, 300, 740
    roi = story[y0:y1, x0:x1]
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    # azul do painel: matiz ~106, muito saturado (o céu tem a mesma matiz mas S baixa)
    blue = cv2.inRange(hsv, (98, 150, 40), (118, 255, 210))
    green = cv2.inRange(hsv, (55, 150, 30), (80, 255, 200))
    m = cv2.bitwise_or(blue, green)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cnts, key=cv2.contourArea)
    full = np.zeros((H, W), np.uint8)
    cv2.drawContours(full, [c + np.array([x0, y0])], -1, 255, thickness=cv2.FILLED)
    full = cv2.erode(full, np.ones((3, 3), np.uint8))
    full = cv2.GaussianBlur(full, (0, 0), 0.8)
    rgba = cv2.cvtColor(plate, cv2.COLOR_BGR2BGRA)
    rgba[..., 3] = full
    ys, xs = np.where(full > 128)
    crop = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    cv2.imwrite(os.path.join(OUT, 'totem.png'), crop)
    print(f'totem: x {xs.min()}-{xs.max()}  y {ys.min()}-{ys.max()}  (salvo recortado; posicionar em left={xs.min()} top={ys.min()})')


def build_logo():
    lg = np.array(Image.open(os.path.join(REF, 'logo-sulamerica-oficial.png')).convert('RGBA'))
    h, w = lg.shape[:2]
    a = lg[..., 3]
    # o lockup tem "SulAmérica" à esquerda, um divisor vertical, "130 ANOS" e o slogan embaixo
    cols = (a > 40).sum(axis=0)
    gap = None
    for x in range(int(w * 0.35), int(w * 0.65)):
        if cols[x] == 0 and cols[x + 1:x + 20].sum() > 0:
            gap = x
            break
    region = lg[:, : int(w * 0.5)]
    ra = region[..., 3]
    rows = (ra > 40).sum(axis=1)
    # para no primeiro vão horizontal grande (antes do slogan)
    y_end = h
    seen = False
    for y in range(h):
        if rows[y] > 0:
            seen = True
        elif seen and rows[y:y + 25].sum() == 0:
            y_end = y
            break
    region = region[:y_end]
    ra = region[..., 3]
    ys, xs = np.where(ra > 10)
    # descarta o traço divisor (coluna estreita isolada à direita)
    colsum = (ra > 40).sum(axis=0)
    right = xs.max()
    while right > 0 and colsum[right] > 0:
        right -= 1
    mark_right = right
    while mark_right > 0 and colsum[mark_right] == 0:
        mark_right -= 1
    if (xs.max() - right) < 30:  # o que sobrou à direita era o divisor
        xs_lim = mark_right
    else:
        xs_lim = xs.max()
    crop = region[ys.min():ys.max() + 1, xs.min():xs_lim + 1]
    rgb = crop[..., :3].astype(int)
    al = crop[..., 3]
    orange = (rgb[..., 0] > 180) & (rgb[..., 2] < 120) & (rgb[..., 0] - rgb[..., 2] > 90)
    wave = crop.copy()
    wave[..., 3] = np.where(orange, al, 0)
    text = crop.copy()
    text[..., :3] = 255
    text[..., 3] = np.where(orange, 0, al)
    Image.fromarray(wave).save(os.path.join(OUT, 'logo-wave.png'))
    Image.fromarray(text).save(os.path.join(OUT, 'logo-text.png'))
    print(f'logo: recorte {crop.shape[1]}x{crop.shape[0]} (do lockup oficial {w}x{h}, divisor em x={gap})')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    p, st = build_plate()
    build_totem(p, st)
    build_logo()
