#!/usr/bin/env python3
"""
Alinha duas fotos de um antes/depois coladas numa montagem vertical e exporta
o par em WebP nas três larguras que o site usa.

    python3 ferramentas/antes_depois.py <montagem.jpg> <prefixo> [opções]

    --divisao Y               linha onde uma foto acaba e a outra começa
    --pupilas-antes  XE,YE,XD,YD    pupilas da foto de cima, em pixels
    --pupilas-depois XE,YE,XD,YD    pupilas da foto de baixo
    --razao R                 largura/altura do recorte (padrão 1.333)
    --olhos-em F              linha dos olhos a F da altura (padrão 0.92)
    --altura N                altura do recorte, em pixels do "antes"
    --centro X,Y              centro do recorte, em pixels do "antes"
    --larguras 520,760        larguras a exportar
    --sem-cor                 não iguala o balanço de branco

Dadas as pupilas à mão, o alinhamento vira uma semelhança completa: escala,
rotação e deslocamento saem dos dois pares de pontos. A busca automática não
gira, e por isso o modo automático continua como estava — é o que gerou as
fotos que já estão no site.

A busca automática falha em montagem com fundo claro: ela procura o reflexo da
pupila pelo brilho, e parede branca é mais clara que reflexo nenhum. Quando
ela falhar, meça as pupilas e passe nas opções acima.

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

    exporta(origem, prefixo, antes, depois, LARGURAS, PROPORCAO)


def exporta(origem, prefixo, antes, depois, larguras, razao):
    destino = origem.parent if origem.parent.name == 'img' else Path('assets/img')
    for nome, img in (('antes', antes), ('depois', depois)):
        for w in larguras:
            h = round(w / razao)
            saida = destino / f'{prefixo}-{nome}-{w}.webp'
            img.resize((w, h), Image.LANCZOS).save(saida, 'WEBP', quality=88, method=6)
            print(f'  {saida}  {w}x{h}  {saida.stat().st_size // 1024} KB')


# --------------------------------------------------------------------------
# Modo manual: as pupilas vêm medidas, e o alinhamento gira além de escalar.
# --------------------------------------------------------------------------

def semelhanca(pa, pd):
    """Transformação que leva o par de pontos do "antes" ao do "depois".

    Com os pontos escritos como números complexos, a semelhança que casa dois
    pares é só uma multiplicação e uma soma: o módulo do fator é a escala e o
    argumento é o giro. É por isso que esta conta cabe em três linhas, em vez
    de montar e resolver a matriz à mão.
    """
    a1, a2 = complex(*pa[0]), complex(*pa[1])
    d1, d2 = complex(*pd[0]), complex(*pd[1])
    k = (d1 - d2) / (a1 - a2)
    return k, d1 - k * a1


def recorta(im, janela, k, c, tamanho):
    """Recorta a `janela` (no sistema do "antes") depois de levá-la por k,c.

    `Image.transform` pede a conta ao contrário da intuição: os coeficientes
    levam o pixel de SAÍDA ao de ENTRADA. Por isso a janela entra como escala
    e deslocamento, e a semelhança entra composta com ela.
    """
    esq, topo, larg, alt = janela
    m = alt / tamanho[1]                       # pixels do "antes" por pixel de saída
    kr, ki = k.real, k.imag
    coef = (kr * m, -ki * m, kr * esq - ki * topo + c.real,
            ki * m,  kr * m, ki * esq + kr * topo + c.imag)
    return im.transform(tamanho, Image.AFFINE, coef, resample=Image.BICUBIC)


def cantos(janela, k, c):
    """Os quatro cantos da janela, já levados para o sistema do "depois"."""
    esq, topo, larg, alt = janela
    for x in (esq, esq + larg):
        for y in (topo, topo + alt):
            z = k * complex(x, y) + c
            yield z.real, z.imag


def manual(origem, prefixo, op):
    im = Image.open(origem).convert('RGB')
    largImg, alturaImg = im.size
    corte = op['divisao'] if op['divisao'] else divisao(np.asarray(im).astype(float))
    pa, pd = op['pupilas_antes'], op['pupilas_depois']
    k, c = semelhanca(pa, pd)
    print(f'divisão entre as duas fotos: y={corte}')
    print(f'escala depois/antes: {abs(k):.4f}   giro: {np.degrees(np.angle(k)):+.2f}°')

    olhos = ((pa[0][0] + pa[1][0]) / 2, (pa[0][1] + pa[1][1]) / 2)
    entre = abs(complex(*pa[0]) - complex(*pa[1]))
    alt = op['altura'] or ALTURA_EM_PUPILAS * entre
    larg = alt * op['razao']
    cx, cy = op['centro'] if op['centro'] else (olhos[0], olhos[1] - alt * (op['olhos_em'] - 0.5))
    janela = (cx - larg / 2, cy - alt / 2, larg, alt)
    print(f'recorte no antes: {larg:.0f}x{alt:.0f} centrado em ({cx:.0f}, {cy:.0f})')

    # Cada metade tem de caber na sua foto: estourar a imagem dá barra preta,
    # e passar da divisão cola um pedaço da outra tomada dentro do recorte.
    for nome, pontos, ymin, ymax in (
            ('antes', list(cantos(janela, 1 + 0j, 0j)), 0, corte),
            ('depois', list(cantos(janela, k, c)), corte, alturaImg)):
        xs = [p[0] for p in pontos]; ys = [p[1] for p in pontos]
        print(f'  {nome}: x {min(xs):.0f}..{max(xs):.0f}  y {min(ys):.0f}..{max(ys):.0f}')
        if min(xs) < 0 or max(xs) > largImg or min(ys) < ymin or max(ys) > ymax:
            raise SystemExit(f'{nome}: o recorte sai da foto (limite y {ymin}..{ymax})')

    # Renderiza na maior das duas resoluções nativas, para não jogar fora a
    # metade mais detalhada antes de reduzir.
    trab_alt = int(round(alt * max(1.0, abs(k))))
    tamanho = (int(round(trab_alt * op['razao'])), trab_alt)
    antes = recorta(im, janela, 1 + 0j, 0j, tamanho)
    depois = recorta(im, janela, k, c, tamanho)

    if not op['sem_cor']:
        A = np.asarray(antes).astype(float)
        ganho = media_pele(np.asarray(depois).astype(float)) / media_pele(A)
        ganho /= float((ganho * np.array([0.2126, 0.7152, 0.0722])).sum())
        antes = Image.fromarray(np.clip(A * ganho, 0, 255).astype(np.uint8))
        print(f'ganho de cor no antes: {np.round(ganho, 3)}')

    exporta(origem, prefixo, antes, depois, op['larguras'], op['razao'])


def opcoes(args):
    op = dict(divisao=None, pupilas_antes=None, pupilas_depois=None, razao=PROPORCAO,
              olhos_em=OLHOS_EM, altura=None, centro=None, larguras=LARGURAS, sem_cor=False)
    def par(v):
        n = [float(x) for x in v.split(',')]
        return (n[0], n[1]), (n[2], n[3])
    i = 0
    while i < len(args):
        a = args[i]
        if a == '--sem-cor':
            op['sem_cor'] = True; i += 1; continue
        if i + 1 >= len(args):
            raise SystemExit(f'falta o valor de {a}')
        v = args[i + 1]; i += 2
        if a == '--divisao':          op['divisao'] = int(v)
        elif a == '--pupilas-antes':  op['pupilas_antes'] = par(v)
        elif a == '--pupilas-depois': op['pupilas_depois'] = par(v)
        elif a == '--razao':          op['razao'] = float(v)
        elif a == '--olhos-em':       op['olhos_em'] = float(v)
        elif a == '--altura':         op['altura'] = float(v)
        elif a == '--centro':         op['centro'] = tuple(float(x) for x in v.split(','))
        elif a == '--larguras':       op['larguras'] = tuple(int(x) for x in v.split(','))
        else: raise SystemExit(f'opção desconhecida: {a}')
    return op


if __name__ == '__main__':
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    op = opcoes(sys.argv[3:])
    if op['pupilas_antes'] and op['pupilas_depois']:
        manual(Path(sys.argv[1]), sys.argv[2], op)
    elif op['pupilas_antes'] or op['pupilas_depois']:
        raise SystemExit('passe as pupilas das duas metades, ou de nenhuma')
    else:
        main(Path(sys.argv[1]), sys.argv[2])
