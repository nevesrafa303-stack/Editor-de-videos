"""Recortes novos da versão 3 (os demais vêm de cortar-v2.py), no tamanho 2x de cada espaço da peça.
Uso: python3 -I ferramentas/cortar-v3.py  ->  assets/fotos/cortes/v3-*.jpg"""
import pathlib
from PIL import Image

raiz = pathlib.Path(__file__).resolve().parent.parent
fotos, saida = raiz / 'assets/fotos', raiz / 'assets/fotos/cortes'
CORTES = {
    'v3-b1-bp.jpg':         ('hospitais/bp-possi-b.jpg',           (0, 60, 1280, 771),     (900, 500)),    # 450x250
    'v3-b1-samaritano.jpg': ('hospitais/samaritano-hsama.jpg',     (0, 60, 1920, 1127),    (900, 500)),
    'v3-b3-socios.jpg':     ('stock-221706617-socios.jpg',         (710, 0, 2712, 2280),   (2160, 2460)),  # 1080x1230
    'v3-s1-bp.jpg':         ('hospitais/bp-possi-a.jpg',           (100, 20, 1800, 681),   (2160, 840)),   # 1080x420
    'v3-s3-equipe.jpg':     ('stock-561309706-equipe.jpg',         (1070, 0, 3427, 3000),  (880, 1120)),   # 440x560
}
for nome, (arq, caixa, tam) in CORTES.items():
    im = Image.open(fotos / arq).convert('RGB').crop(caixa)
    ar_c, ar_t = im.width / im.height, tam[0] / tam[1]
    assert abs(ar_c - ar_t) / ar_t < 0.03, (nome, round(ar_c, 3), round(ar_t, 3))
    im.resize(tam, Image.LANCZOS).save(saida / nome, quality=90, optimize=True, progressive=True)
    print(nome, tam, f'escala {tam[0] / im.width:.2f}x')
