#!/usr/bin/env python3
"""
Alinha duas fotos de um antes/depois coladas numa montagem vertical e exporta
o par em WebP nas três larguras que o site usa.

    python3 ferramentas/antes_depois.py <montagem.jpg> <prefixo>

Por que alinhar: a pessoa não se posiciona igual nas duas fotos. Sem alinhar,
deslizar de uma para a outra faz o rosto saltar, e a atenção vai para o salto
em vez de ir para o que mudou.

A âncora são as PUPILAS, não as sobrancelhas: numa foto de linhas da testa as
sobrancelhas estão levantadas de propósito, então elas se movem entre as duas
tomadas. As pupilas não. A distância entre elas também dá a escala.

O balanço de branco do "antes" é igualado ao do "depois" preservando a
luminância — só a cor muda. Isso corrige a diferença de iluminação entre as
duas tomadas; não mexe em textura, nitidez nem contraste, que é o que
importaria no resultado clínico.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

LARGURAS = (520, 760, 1040)
PROPORCAO = 4 / 3          # largura / altura do recorte final
OLHOS_EM = 0.92            # a linha dos olhos fica a 92% da altura do recorte
ALTURA_EM_PUPILAS = 1.25   # altura do recorte = 1,25x a distância entre as pupilas
                           # (medida do rosto, não da imagem: vale para qualquer foto)

def divisao(a):
    """Linha onde uma foto acaba e a outra começa: a faixa mais plana."""
    lin = a.mean(axis=(1, 2))
    meio = len(lin) // 2
    janela = slice(meio - 200, meio + 200)
    desvio = np.array([a[y].mean(axis=1).std() for y in range(*janela.indices(len(lin)))])
    return meio - 200 + int(np.argmin(desvio))


def borda_sobrancelha(a, y0, y1):
    """Queda de brilho mais forte depois do pico da testa."""
    cx0, cx1 = int(a.shape[1] * 0.25), int(a.shape[1] * 0.75)
    perfil = a[y0:y1, cx0:cx1].mean(axis=(1, 2))
    meio = len(perfil) // 2
    pico = meio + int(np.argmax(perfil[meio:]))
    return y0 + pico + int(np.argmin(np.gradient(perfil)[pico:pico + 320]))


def pupilas(a, y0, y1):
    """Centro e linha dos olhos pelos reflexos especulares."""
    larg = a.shape[1]
    reg = a[y0:y1].mean(axis=2)
    for limiar in (235, 220, 205, 190):
        ys, xs = np.where(reg > limiar)
        esq = xs < larg // 2
        if esq.sum() >= 5 and (~esq).sum() >= 5:
            xe, xd = np.median(xs[esq]), np.median(xs[~esq])
            ym = y0 + (np.median(ys[esq]) + np.median(ys[~esq])) / 2
            return (xe + xd) / 2, ym, xd - xe
    raise SystemExit('não encontrei os reflexos dos olhos nas duas metades')


def media_pele(arr):
    """Cor média da pele: fora o cabelo (escuro) e os reflexos (claros)."""
    lum = arr.mean(axis=2)
    m = (lum > np.percentile(lum, 25)) & (lum < np.percentile(lum, 98))
    return arr[m].reshape(-1, 3).mean(axis=0)


def main(origem: Path, prefixo: str) -> None:
    im = Image.open(origem).convert('RGB')
    a = np.asarray(im).astype(float)
    corte = divisao(a)
    print(f'divisão entre as duas fotos: y={corte}')

    b1 = borda_sobrancelha(a, 0, corte)
    b2 = borda_sobrancelha(a, corte, a.shape[0])
    c1 = pupilas(a, b1 + 240, corte)
    c2 = pupilas(a, b2 + 90, min(b2 + 340, a.shape[0]))
    escala = c2[2] / c1[2]
    print(f'antes : olhos em ({c1[0]:.0f}, {c1[1]:.0f})  distância {c1[2]:.0f}')
    print(f'depois: olhos em ({c2[0]:.0f}, {c2[1]:.0f})  distância {c2[2]:.0f}')
    print(f'escala depois/antes: {escala:.4f}')

    alturaImg, largImg = a.shape[0], a.shape[1]

    # A altura sai da medida do rosto, mas precisa caber nas duas metades. Cada
    # limite abaixo é uma borda que o recorte não pode ultrapassar; sem eles o
    # recorte estoura a imagem (barras pretas) ou invade a outra foto.
    limites = {
        'topo do antes':        c1[1] / OLHOS_EM,
        'divisão, pelo antes':  (corte - c1[1]) / (1 - OLHOS_EM),
        'lados do antes':       2 * min(c1[0], largImg - c1[0]) / PROPORCAO,
        'divisão, pelo depois': (c2[1] - corte) / (escala * OLHOS_EM),
        'base do depois':       (alturaImg - c2[1]) / (escala * (1 - OLHOS_EM)),
        'lados do depois':      2 * min(c2[0], largImg - c2[0]) / (escala * PROPORCAO),
    }
    desejada = ALTURA_EM_PUPILAS * c1[2]
    aperta = min(limites, key=limites.get)
    alt = int(min(desejada, limites[aperta]))
    if alt < desejada:
        print(f'altura reduzida de {desejada:.0f} para {alt} — limite: {aperta}')
    larg = int(round(alt * PROPORCAO))
    print(f'recorte: {larg}x{alt}')

    def janela(cx, cy, esc):
        l, h = round(larg * esc), round(alt * esc)
        e, t = round(cx - l / 2), round(cy - h * OLHOS_EM)
        return e, t, e + l, t + h

    ja, jd = janela(c1[0], c1[1], 1.0), janela(c2[0], c2[1], escala)
    for nome, j, ymin, ymax in (('antes', ja, 0, corte), ('depois', jd, corte, alturaImg)):
        assert j[0] >= 0 and j[2] <= largImg, f'{nome}: recorte fora da imagem {j}'
        assert j[1] >= ymin and j[3] <= ymax, f'{nome}: recorte invade a outra foto {j}'
        print(f'  {nome}: {j}')
    antes = im.crop(ja).resize((larg, alt), Image.LANCZOS)
    depois = im.crop(jd).resize((larg, alt), Image.LANCZOS)

    A = np.asarray(antes).astype(float)
    ganho = media_pele(np.asarray(depois).astype(float)) / media_pele(A)
    ganho /= float((ganho * np.array([0.2126, 0.7152, 0.0722])).sum())
    antes = Image.fromarray(np.clip(A * ganho, 0, 255).astype(np.uint8))
    print(f'ganho de cor no antes: {np.round(ganho, 3)}')

    destino = origem.parent if origem.parent.name == 'img' else Path('assets/img')
    for nome, img in (('antes', antes), ('depois', depois)):
        for w in LARGURAS:
            h = round(w / PROPORCAO)
            saida = destino / f'{prefixo}-{nome}-{w}.webp'
            img.resize((w, h), Image.LANCZOS).save(saida, 'WEBP', quality=88, method=6)
            print(f'  {saida}  {w}x{h}  {saida.stat().st_size // 1024} KB')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(Path(sys.argv[1]), sys.argv[2])
