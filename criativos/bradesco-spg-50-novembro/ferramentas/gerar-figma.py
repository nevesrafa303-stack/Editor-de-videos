"""Gera o script use_figma de cada variação (Story + Feed) a partir das camadas extraídas.
Uso: python3 -I ferramentas/gerar-figma.py <pasta-das-camadas>  ->  <pasta>/figma-<peca>.js"""
import json, re, sys, pathlib
pasta = pathlib.Path(sys.argv[1]); raiz = pathlib.Path(__file__).resolve().parent.parent
corpo = (raiz / 'ferramentas/figma-montar.js').read_text()
logo = (raiz / 'assets/marca/bradesco-saude.svg').read_text()
D = re.search(r' d="([^"]+)"', logo).group(1)
NOMES = {'b1-classico': 'B1 · Clássico', 'b2-cupom': 'B2 · Cupom', 'b3-mensalidades': 'B3 · Mensalidades'}
for i, peca in enumerate(NOMES):
    quadros = []
    for fmt, x in (('story', 0), ('feed', 1200)):
        spec = json.loads((pasta / f'{peca}-{fmt}.json').read_text())
        txt = json.dumps(spec['itens'], ensure_ascii=False, separators=(',', ':')).replace(D, '__D__')
        quadros.append({'nome': f'{NOMES[peca]} — {"Story 1080×1920" if fmt == "story" else "Feed 1080×1350"}',
                        'w': spec['w'], 'h': spec['h'], 'x': x, 'y': i * 2200, 'itens': json.loads(txt)})
    spec_txt = json.dumps({'quadros': quadros}, ensure_ascii=False, separators=(',', ':'))
    codigo = corpo.replace('__SPEC__', spec_txt).replace('__LOGO_D__', json.dumps(D))
    (pasta / f'figma-{peca}.js').write_text(codigo)
    print(peca, len(codigo), 'caracteres')
