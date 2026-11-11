#!/usr/bin/env python3
"""
Prepara as fotos do site: recorta, gera três larguras e exporta WebP.

Os retratos entram aqui já sem fundo — passe as fotos por recorte.py antes:

    python3 ferramentas/recorte.py originais/retrato-hero.jpg originais/retrato-hero.png

Este roteiro só recorta o enquadramento, gera as três larguras e exporta WebP
preservando o canal alfa.

Uso, a partir de site/:   python3 ferramentas/fotos.py
Requer:                   pip install Pillow
"""
from PIL import Image, ImageChops
import os, sys

ORIGEM = os.environ.get('FOTOS_ORIGEM', 'originais')
DESTINO = 'assets/img'

def rampa(n, curva=1.6):
    """0 → 255 com aceleração suave, para a borda não ter emenda dura."""
    return [int(255 * ((i / max(n - 1, 1)) ** curva)) for i in range(n)]

def mascara_bordas(w, h, esq, dir_, topo, base):
    """Opaca no centro, zero exatamente nas quatro bordas."""
    m = Image.new('L', (w, h), 255)
    px = m.load()
    fe, fd, ft, fb = int(w*esq), int(w*dir_), int(h*topo), int(h*base)
    r_e, r_d, r_t, r_b = rampa(fe), rampa(fd), rampa(ft), rampa(fb, 2.0)
    for x in range(w):
        v = 255
        if x < fe:      v = min(v, r_e[x])
        if x >= w - fd: v = min(v, r_d[w - 1 - x])
        if v < 255:
            for y in range(h):
                if px[x, y] > v: px[x, y] = v
    for y in range(h):
        v = 255
        if y < ft:      v = min(v, r_t[y])
        if y >= h - fb: v = min(v, r_b[h - 1 - y])
        if v < 255:
            for x in range(w):
                if px[x, y] > v: px[x, y] = v
    return m

def exporta(origem, destino, caixa, larguras, fades=None, qualidade=88):
    """caixa e fades em fração (0–1). fades=None mantém a foto opaca."""
    im = Image.open(os.path.join(ORIGEM, origem)).convert('RGBA')
    W, H = im.size
    x0, y0, x1, y1 = [int(round(v * (W if i % 2 == 0 else H))) for i, v in enumerate(caixa)]
    rec = im.crop((x0, y0, x1, y1))
    maior = max(larguras)
    rec = rec.resize((maior, round(rec.size[1] * maior / rec.size[0])), Image.LANCZOS)
    w, h = rec.size
    if fades:  # rampa opcional, só para fotos que ainda tenham fundo
        rec.putalpha(ImageChops.multiply(rec.getchannel('A'), mascara_bordas(w, h, *fades)))
    for larg in larguras:
        alt = round(h * larg / w)
        nome = os.path.join(DESTINO, f'{destino}-{larg}.webp')
        rec.resize((larg, alt), Image.LANCZOS).save(nome, 'WEBP', quality=qualidade, method=6)
        print(f'  {nome}  {larg}x{alt}  {os.path.getsize(nome)//1024} KB')

# (arquivo de origem, nome de saída, recorte, larguras, fades das bordas)
RECEITA = [
    # os três retratos passam antes por recorte.py, que remove o fundo
    ('retrato-hero.png',  'consuelo-hero',  (0.06, 0.18,  0.94, 1.0),   [560, 900, 1300], None),
    ('retrato-sobre.png', 'consuelo-sobre', (0.0,  0.167, 1.0,  1.0),   [520, 820, 1200], None),
    ('clinica.jpg',       'clinica',        (0.0,  0.10,  1.0,  0.94),  [520, 820, 1200], None),
    ('caso-labial.jpg',   'caso-labial',    (0.0,  0.04,  1.0,  0.80),  [600, 900, 1300], None),
]

if __name__ == '__main__':
    if not os.path.isdir(ORIGEM):
        sys.exit(f'Coloque as fotos originais em "{ORIGEM}/" (ou defina FOTOS_ORIGEM).')
    os.makedirs(DESTINO, exist_ok=True)
    for origem, destino, caixa, larguras, fades in RECEITA:
        if not os.path.exists(os.path.join(ORIGEM, origem)):
            print(f'· pulando {origem} (não encontrado)')
            continue
        print(f'{destino}:')
        exporta(origem, destino, caixa, larguras, fades)
