"""Recortes das peças v2 (linguagem das referências do cliente), no tamanho 2x de cada espaço da peça.
Uso: python3 -I ferramentas/cortar-v2.py  ->  assets/fotos/cortes/v2-*.jpg|png"""
import pathlib
from PIL import Image

raiz = pathlib.Path(__file__).resolve().parent.parent
fotos, saida = raiz / 'assets/fotos', raiz / 'assets/fotos/cortes'

# nome: (arquivo, caixa de corte na origem (x0, y0, x1, y1) ou None para a imagem toda, tamanho final 2x)
CORTES = {
    'v2-b1-samaritano.jpg':  ('hospitais/samaritano-hsama.jpg',       (150, 0, 1682, 1277),     (2160, 1800)),  # 1080x900
    'v2-b2-medico.png':      ('stock-335918554-medico-recorte.png',  None,                     (1068, 1380)),  # 534x690
    'v2-b3-socios.jpg':      ('stock-221706617-socios.jpg',          (209, 0, 3212, 2280),     (2160, 1640)),  # 1080x820
    'v2-s1-equipe.jpg':      ('stock-561309706-equipe.jpg',          (409, 0, 4091, 3000),     (2160, 1760)),  # 1080x880
    'v2-s2-bp.jpg':          ('hospitais/bp-possi-b.jpg',            (0, 100, 1280, 839),      (936, 540)),    # 468x270
    'v2-s3-bp.jpg':          ('hospitais/bp-possi-b.jpg',            (0, 60, 1280, 771),       (2160, 1200)),  # 1080x600
    'v2-a1-saguao.jpg':      ('stock-305689652-equipe-saguao.jpg',   (136, 0, 5048, 3456),     (2160, 1520)),  # 1080x760
    'v2-a2-corredor.jpg':    ('stock-1193644379-equipe-corredor.jpg', (0, 300, 8192, 4908),    (1920, 1080)),  # 960x540
    'v2-a3-medica.png':      ('stock-490032919-medica-recorte.png',  None,                     (902, 1520)),   # 451x760
}

for nome, (arq, caixa, tam) in CORTES.items():
    im = Image.open(fotos / arq)
    im = im.convert('RGBA' if nome.endswith('.png') else 'RGB')
    if caixa: im = im.crop(caixa)
    ar_c, ar_t = im.width / im.height, tam[0] / tam[1]
    assert abs(ar_c - ar_t) / ar_t < 0.03, (nome, round(ar_c, 3), round(ar_t, 3))
    im = im.resize(tam, Image.LANCZOS)
    if nome.endswith('.png'): im.save(saida / nome, optimize=True)
    else: im.save(saida / nome, quality=90, optimize=True, progressive=True)
    print(nome, tam, f'escala {tam[0] / (caixa[2] - caixa[0] if caixa else Image.open(fotos / arq).width):.2f}x')
