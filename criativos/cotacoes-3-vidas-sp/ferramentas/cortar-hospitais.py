"""Recorta as fotos dos hospitais (assets/fotos/hospitais, Wikimedia Commons) no tamanho 2x de cada espaço das peças.
Uso: python3 -I ferramentas/cortar-hospitais.py  ->  assets/fotos/cortes/h-*.jpg"""
import pathlib
from PIL import Image

raiz = pathlib.Path(__file__).resolve().parent.parent
orig, saida = raiz / 'assets/fotos/hospitais', raiz / 'assets/fotos/cortes'

# nome: (arquivo de origem, caixa de corte (x0, y0, x1, y1) em px da origem, tamanho final = 2x o espaço na peça)
CORTES = {
    'h-paulistano-alto':  ('paulistano-fachada.jpg',   (0, 30, 1280, 1694),   (1200, 1560)),  # A4: cartão 600x780
    'h-metropolitano':    ('metropolitano-lapa.jpg',   (0, 3, 960, 691),      (1200, 860)),   # A5: polaroide 600x430
    'h-paulistano-card':  ('paulistano-fachada.jpg',   (0, 0, 1280, 900),     (916, 644)),    # A6: cartão 458x322
    'h-metropolitano-card': ('metropolitano-lapa.jpg', (0, 10, 960, 685),     (916, 644)),
    'h-samaritano':       ('samaritano-hsama.jpg',     (0, 90, 1920, 1210),   (1920, 1120)),  # B4: quadro 960x560
    'h-bp-predio':        ('bp-possi-a.jpg',           (230, 100, 1650, 690), (1800, 748)),   # B5: faixa 900x374
    'h-bp-card':          ('bp-possi-b.jpg',           (0, 0, 1280, 900),     (916, 644)),    # B6/S5: cartão 458x322
    'h-samaritano-card':  ('samaritano-hsama.jpg',     (50, 0, 1866, 1277),   (916, 644)),
    'h-bp-viaduto':       ('bp-possi-b.jpg',           (0, 70, 1280, 777),    (1520, 840)),   # S4: quadro 760x420
    'h-bp-redondo':       ('bp-possi-b.jpg',           (300, 60, 1000, 760),  (300, 300)),    # S6: miniatura 150x150
}

for nome, (arq, caixa, tam) in CORTES.items():
    im = Image.open(orig / arq).convert('RGB').crop(caixa)
    ar_c, ar_t = im.width / im.height, tam[0] / tam[1]
    assert abs(ar_c - ar_t) / ar_t < 0.03, (nome, round(ar_c, 3), round(ar_t, 3))
    im.resize(tam, Image.LANCZOS).save(saida / f'{nome}.jpg', quality=90, optimize=True, progressive=True)
    print(f'{nome}.jpg', tam, f'escala {tam[0] / im.width:.2f}x')
