#!/usr/bin/env python3
"""
Enquadra uma foto para um espaço do site e gera as três larguras em WebP.

Serve para as fotos que entram com o fundo real — retrato em moldura, cena de
consultório, detalhe. Quem entra sem fundo, para flutuar na página, passa antes
pelo recorte.py; este roteiro é o outro caminho.

O corte precisa de um ponto de ancoragem, senão a cabeça da pessoa sai cortada
ou sobra meio metro de parede acima dela. O ponto sai do próprio arquivo: a
mancha de pele é localizada em YCbCr, que separa tom de pele de parede clara
muito melhor que RGB, e o centro dela vira a âncora. Onde a âncora deve cair
dentro do quadro é escolha de enquadramento, e vem por parâmetro — num retrato
de hero o rosto pede o terço superior; numa cena de consultório ele pode ficar
no meio.

A busca erra quando a parede é bege: nessa faixa ela entra no mesmo intervalo
da pele e puxa a âncora para o meio do quadro. Por isso existe o --ancora: a
detecção é um padrão, não uma garantia, e toda foto deve ser olhada depois.

Uso:
    python3 ferramentas/enquadra.py ORIGEM DESTINO RAZAO [opções]

    RAZAO              largura/altura do quadro final (ex.: 0.714 para 5:7)
    --rosto N          onde a âncora cai na altura do quadro, de 0 a 1
                       (padrão 0.38 — o terço superior)
    --ancora X,Y       posição da âncora na foto, de 0 a 1, no lugar da busca
    --escala N         fecha o quadro: 1 usa o máximo que cabe, 0.8 aproxima

    python3 ferramentas/enquadra.py nova.jpg assets/img/consuelo-hero 0.714 --rosto 0.34
    python3 ferramentas/enquadra.py nova.jpg assets/img/consuelo-missao 0.66 \
            --ancora 0.17,0.27 --escala 0.74

Gera consuelo-hero-560.webp, -900.webp e -1300.webp.
"""
from PIL import Image
import numpy as np
import sys, os

LARGURAS = (560, 900, 1300)
QUALIDADE = 86


def ancora(im):
    """Devolve (x, y) do centro da maior mancha de pele, em fração da imagem.

    Em YCbCr a pele vive numa faixa estreita de Cb e Cr qualquer que seja a
    luminância, então sombra no rosto não tira o pixel da conta — foi por isso
    que esta busca não é feita em RGB.
    """
    p = im.convert('YCbCr').resize((im.width // 8, im.height // 8))
    a = np.asarray(p).astype(np.int16)
    cb, cr = a[..., 1], a[..., 2]
    pele = (cb >= 77) & (cb <= 127) & (cr >= 133) & (cr <= 173)
    if pele.sum() < 40:
        return 0.5, 0.42          # sem pele reconhecível: centro, um pouco acima

    # A mancha maior é o rosto ou o conjunto rosto+mãos; a mediana resiste a
    # pontos soltos de parede bege que entraram na faixa por acidente.
    ys, xs = np.nonzero(pele)
    x = float(np.median(xs)) / pele.shape[1]
    # Entre as linhas com pele, o rosto costuma estar no quarto superior: usar
    # a mediana puxaria a âncora para o tronco e as mãos.
    y = float(np.percentile(ys, 22)) / pele.shape[0]
    return x, y


def enquadra(origem, destino, razao, altura_rosto=0.38, forcada=None, escala=1.0):
    im = Image.open(origem).convert('RGB')
    lx, ly = forcada if forcada else ancora(im)
    w, h = im.size

    # O quadro é o maior que cabe na razão pedida, fechado pela escala
    if w / h > razao:
        nh, nw = h, int(round(h * razao))
    else:
        nw, nh = w, int(round(w / razao))
    nw, nh = int(round(nw * escala)), int(round(nh * escala))

    # posiciona o quadro para a âncora cair onde foi pedido
    esq = int(round(lx * w - nw * 0.5))
    topo = int(round(ly * h - nh * altura_rosto))
    esq = max(0, min(esq, w - nw))
    topo = max(0, min(topo, h - nh))

    corte = im.crop((esq, topo, esq + nw, topo + nh))
    for larg in LARGURAS:
        alt = int(round(larg / razao))
        saida = corte.resize((larg, alt), Image.LANCZOS)
        caminho = f'{destino}-{larg}.webp'
        saida.save(caminho, 'WEBP', quality=QUALIDADE, method=6)
        print('  %-40s %dx%d  %5.1f KB' % (
            os.path.basename(caminho), larg, alt, os.path.getsize(caminho) / 1024))
    return nw, nh, lx, ly


def main(args):
    if len(args) < 3:
        print(__doc__)
        return 1
    origem, destino, razao = args[0], args[1], float(args[2])
    altura, forcada, escala = 0.38, None, 1.0
    i = 3
    while i < len(args):
        if args[i] == '--rosto':
            altura = float(args[i + 1]); i += 2
        elif args[i] == '--ancora':
            forcada = tuple(float(v) for v in args[i + 1].split(',')); i += 2
        elif args[i] == '--escala':
            escala = float(args[i + 1]); i += 2
        else:
            print('opção desconhecida: %s' % args[i]); return 1

    print('%s  ->  %s  (razão %.3f, rosto a %.0f%% da altura, escala %.2f)' % (
        os.path.basename(origem), os.path.basename(destino), razao, altura * 100, escala))
    nw, nh, lx, ly = enquadra(origem, destino, razao, altura, forcada, escala)
    origem_ancora = 'dada' if forcada else 'encontrada'
    print('  âncora %s em %.0f%% x %.0f%% · corte de %dx%d' % (
        origem_ancora, lx * 100, ly * 100, nw, nh))
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
