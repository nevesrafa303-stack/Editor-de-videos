"""
Remove o fundo de estúdio das fotos da Dra. Consuelo.

O problema: o fundo iluminado atrás dos ombros tem luminância 44 — exatamente a
mediana do cabelo dela. Nenhum limiar de cor separa os dois.

A solução é textura. O fundo de estúdio é liso (alta frequência p99 = 2); o
cabelo é feito de fios (p50 = 8, p90 = 27). Um pixel só é fundo quando é escuro
E liso. A varredura parte das bordas por inundação, então o cabelo interno,
cercado pela própria figura, nunca é alcançado mesmo sendo escuro.
"""
from PIL import Image, ImageFilter, ImageChops
from collections import deque
import sys, time

LUM_MAX = 52     # fundo mais claro medido: 47 (atrás dos ombros)
TEX_MAX = 3      # fundo p99 = 2; cabelo começa em 8
SAT_MAX = 26     # fundo é cinza neutro (sat ~5); pele e jaleco têm cor

def mascara_figura(im):
    w, h = im.size
    cinza = im.convert('L')
    L = list(cinza.getdata())
    tex = ImageChops.difference(cinza, cinza.filter(ImageFilter.GaussianBlur(2.5)))
    T = list(tex.filter(ImageFilter.MaxFilter(5)).getdata())
    S = [max(p) - min(p) for p in im.getdata()]

    def ehFundo(i):
        return L[i] <= LUM_MAX and T[i] <= TEX_MAX and S[i] <= SAT_MAX

    fundo = bytearray(w * h)
    fila = deque()
    def semear(i):
        if not fundo[i] and ehFundo(i):
            fundo[i] = 1; fila.append(i)
    for x in range(w):
        semear(x); semear((h - 1) * w + x)
    for y in range(h):
        semear(y * w); semear(y * w + w - 1)

    while fila:
        i = fila.popleft()
        x, y = i % w, i // w
        if x > 0:     semear(i - 1)
        if x < w - 1: semear(i + 1)
        if y > 0:     semear(i - w)
        if y < h - 1: semear(i + w)

    a = Image.new('L', (w, h))
    a.putdata([0 if f else 255 for f in fundo])
    return a

def refina(a):
    a = a.filter(ImageFilter.MaxFilter(5))      # fecha furos deixados por fios
    a = a.filter(ImageFilter.MinFilter(5))
    a = a.filter(ImageFilter.MinFilter(3))      # 1px para dentro: come o halo do fundo
    a = a.filter(ImageFilter.GaussianBlur(1.0)) # borda sem serrilha
    return a

def processa(origem, destino):
    t0 = time.time()
    im = Image.open(origem).convert('RGB')
    a = refina(mascara_figura(im))
    im.putalpha(a)
    im.save(destino)
    w, h = im.size
    op = sum(1 for v in a.getdata() if v > 200)
    print(f'{destino.split("/")[-1]}: {w}x{h} · figura ocupa {op/(w*h):.1%} · {time.time()-t0:.0f}s')

if __name__ == '__main__':
    processa(sys.argv[1], sys.argv[2])
