# Contraste WCAG de cada texto contra o fundo renderizado.
# Compara a página sem texto (fundo) com a página com texto: os pixels que mudam são as letras.
# Para cada caixa de texto, mede o contraste da cor do texto contra o fundo atrás das suas letras
# (pixels que mudam e ficam com a cor daquele texto) e fica com o pior caso (percentil 5). Uso: python3 -I contraste.py fundo.png textos.json com-texto.png
import json
import re
import sys
import numpy as np
from PIL import Image


def lum(rgb):
    c = np.asarray(rgb, dtype=np.float64) / 255
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    return c[..., 0] * 0.2126 + c[..., 1] * 0.7152 + c[..., 2] * 0.0722


img = np.asarray(Image.open(sys.argv[1]).convert('RGB'))
com = np.asarray(Image.open(sys.argv[3]).convert('RGB'))
letras = np.abs(img.astype(np.int16) - com.astype(np.int16)).max(axis=2) > 40
H, W, _ = img.shape
saida = []
for t in json.load(open(sys.argv[2])):
    m = re.findall(r'[\d.]+', t['cor'])
    cor, alfa = [float(v) for v in m[:3]], float(m[3]) if len(m) > 3 else 1.0
    x0, y0 = max(int(t['x']), 0), max(int(t['y']), 0)
    x1, y1 = min(int(t['x'] + t['w']), W), min(int(t['y'] + t['h']), H)
    if x1 <= x0 or y1 <= y0:
        continue
    # só as letras deste texto: pixels que mudam E que ficaram com a cor dele
    # (exclui letras de outro elemento que caiam dentro da mesma caixa)
    perto = np.abs(com[y0:y1, x0:x1].astype(np.float64) - np.asarray(cor)).max(axis=2) < 60
    mascara = letras[y0:y1, x0:x1] & perto
    if mascara.sum() < 20:
        continue
    fundo = img[y0:y1, x0:x1][mascara].astype(np.float64)
    texto = np.asarray(cor) * alfa + fundo.mean(axis=0) * (1 - alfa)  # cor efetiva se houver transparência
    lt, lf = lum(texto), lum(fundo)
    razoes = (np.maximum(lt, lf) + 0.05) / (np.minimum(lt, lf) + 0.05)
    pior = float(np.percentile(razoes, 5))   # ignora 5% de pixels de borda/antialias
    grande = t['fs'] >= 24 or (t['fs'] >= 18.66 and t['peso'] >= 700)
    minimo = 3.0 if grande else 4.5
    saida.append({'texto': t['texto'], 'razao': round(pior, 2), 'min': minimo, 'ok': pior >= minimo})
print(json.dumps(saida))
