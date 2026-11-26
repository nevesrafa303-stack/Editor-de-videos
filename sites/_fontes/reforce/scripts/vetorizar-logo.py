"""Vetoriza o logo da Reforce (PNG extraído do PDF institucional) em SVG.

Uso: python3 vetorizar-logo.py ../logo-reforce.png ../logo-reforce.svg
Traça as bordas (branco e verde-água separados) num mapa ampliado 6x, simplifica com
Ramer-Douglas-Peucker e grava caminhos com fill-rule evenodd. Também grava o R isolado
(marca) em ../marca-r.svg.
"""
import sys
from collections import defaultdict
from PIL import Image, ImageFilter
import numpy as np

src, dst = sys.argv[1], sys.argv[2]
ESC = 6
im = Image.open(src).convert("RGBA")
W, H = im.size
grande = im.resize((W * ESC, H * ESC), Image.LANCZOS)
arr = np.asarray(grande).astype(int)
r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]
verde = (a > 128) & (g - r > 60)
branco = (a > 128) & ~verde


def bordas2(mask):
    """Arestas orientadas (interior à direita) como lista; ligação por dicionário de listas."""
    m = np.pad(mask, 1)
    saidas = defaultdict(list)
    ys, xs = np.nonzero(m)
    for y, x in zip(ys.tolist(), xs.tolist()):
        X, Y = x - 1, y - 1
        if not m[y - 1, x]:
            saidas[(X, Y)].append((X + 1, Y))
        if not m[y, x + 1]:
            saidas[(X + 1, Y)].append((X + 1, Y + 1))
        if not m[y + 1, x]:
            saidas[(X + 1, Y + 1)].append((X, Y + 1))
        if not m[y, x - 1]:
            saidas[(X, Y + 1)].append((X, Y))
    laços = []
    while saidas:
        inicio = next(iter(saidas))
        atual = inicio
        laço = [inicio]
        while True:
            prox = saidas[atual].pop()
            if not saidas[atual]:
                del saidas[atual]
            if prox == inicio:
                break
            laço.append(prox)
            atual = prox
            if atual not in saidas:
                break
        laços.append(laço)
    return laços


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    p = np.array(pts, float)
    a, b = p[0], p[-1]
    d = b - a
    n = np.hypot(*d)
    if n == 0:
        dist = np.hypot(*(p - a).T)
    else:
        dist = np.abs(d[0] * (p[:, 1] - a[1]) - d[1] * (p[:, 0] - a[0])) / n
    i = int(dist.argmax())
    if dist[i] > eps:
        return rdp(pts[: i + 1], eps)[:-1] + rdp(pts[i:], eps)
    return [pts[0], pts[-1]]


def suavizar(laço, janela=9):
    """Média móvel circular: tira a escada dos pixels sem arredondar os cantos de forma visível."""
    a = np.array(laço, float)
    k = janela // 2
    ext = np.concatenate([a[-k:], a, a[:k]])
    nucleo = np.ones(janela) / janela
    x = np.convolve(ext[:, 0], nucleo, mode="valid")
    y = np.convolve(ext[:, 1], nucleo, mode="valid")
    return list(zip(x.tolist(), y.tolist()))


def caminho(laços, eps=0.9, xmin=None, xmax=None):
    partes = []
    for laço in laços:
        if len(laço) < 12:
            continue
        xs = [p[0] for p in laço]
        if xmin is not None and (min(xs) < xmin or max(xs) > xmax):
            continue
        laço = suavizar(laço)
        # fecha o laço dividindo em duas metades para o RDP
        meio = len(laço) // 2
        s = rdp(laço[: meio + 1], eps)[:-1] + rdp(laço[meio:] + [laço[0]], eps)[:-1]
        pts = " ".join(f"{x / ESC:.2f},{y / ESC:.2f}" for x, y in s)
        partes.append("M" + pts.replace(" ", "L") + "Z")
    return "".join(partes)


lb, lv = bordas2(branco), bordas2(verde)
svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">'
    f'<path fill="#fff" fill-rule="evenodd" d="{caminho(lb)}"/>'
    f'<path fill="#00bda1" d="{caminho(lv)}"/></svg>'
)
open(dst, "w").write(svg)

# Marca: só o R (primeira letra) + bloco verde.
lim = 170 * ESC
marca = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 132 {H}">'
    f'<path fill="#fff" fill-rule="evenodd" d="{caminho(lb, xmin=-1, xmax=lim)}"/>'
    f'<path fill="#00bda1" d="{caminho(lv)}"/></svg>'
)
open(dst.replace("logo-reforce.svg", "marca-r.svg"), "w").write(marca)
print(len(svg), len(marca))
