#!/usr/bin/env python3
"""
Gera uma versão de arquivo único do site: um .html com CSS, JavaScript e
imagens embutidos, para mandar por WhatsApp/e-mail e abrir com dois cliques.

    python3 ferramentas/embutir.py            -> ../dra-consuelo-site.html

O site publicado continua sendo a pasta site/ (mais leve e cacheável). Este
arquivo é só para inspeção rápida.
"""
import base64
import mimetypes
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def como_data_uri(caminho: Path) -> str:
    tipo = mimetypes.guess_type(caminho.name)[0] or 'application/octet-stream'
    dados = base64.b64encode(caminho.read_bytes()).decode('ascii')
    return f'data:{tipo};base64,{dados}'


def main(destino: Path) -> None:
    html = (RAIZ / 'index.html').read_text(encoding='utf-8')
    css = (RAIZ / 'assets/css/style.css').read_text(encoding='utf-8')

    # 1. o srcset é descartado: num arquivo único cada variação de largura
    #    seria mais um data URI inteiro, e o navegador só usa uma delas.
    #    Fica o src, que é a largura do meio.
    html = re.sub(r'\s*srcset="[^"]*"', '', html)
    html = re.sub(r'\s*sizes="[^"]*"', '', html)

    # 2. as referências a assets/img/... viram data URI — no HTML e no CSS, mas
    #    NUNCA dentro do JavaScript: lá os caminhos entram em URLs absolutas
    #    (og:image, dados estruturados) e precisam continuar sendo caminhos.
    cache: dict[str, str] = {}

    def trocar(m: re.Match) -> str:
        rel = m.group(0)
        if rel not in cache:
            caminho = RAIZ / rel
            if not caminho.exists():
                print(f'  ! não encontrei {rel}', file=sys.stderr)
                return rel
            cache[rel] = como_data_uri(caminho)
        return cache[rel]

    padrao = r'assets/img/[\w.-]+'
    html = re.sub(padrao, trocar, html)
    css = re.sub(padrao, trocar, css)

    # 3. CSS e JS viram blocos inline
    # os href/src carregam ?v=N para furar cache, então a busca é por regex
    html, n = re.subn(r'<link rel="stylesheet" href="assets/css/style\.css[^"]*">',
                      lambda _: '<style>\n' + css + '\n</style>', html)
    assert n == 1, f'não achei o link do CSS ({n} ocorrências)'

    for arquivo in ('assets/js/config.js', 'assets/js/main.js'):
        js = (RAIZ / arquivo).read_text(encoding='utf-8')
        alvo = re.escape(arquivo) + r'[^"]*'
        html, n = re.subn(rf'<script src="{alvo}"[^>]*></script>',
                          lambda _: '<script>\n' + js + '\n</script>', html)
        assert n == 1, f'não achei o script {arquivo} ({n} ocorrências)'

    destino.write_text(html, encoding='utf-8')
    kb = destino.stat().st_size / 1024
    print(f'{destino}  ({kb:.0f} KB, {len(cache)} imagens embutidas)')


if __name__ == '__main__':
    alvo = Path(sys.argv[1]) if len(sys.argv) > 1 else RAIZ.parent / 'dra-consuelo-site.html'
    main(alvo)
