"""Gera o HTML de importação para o Adobe Express a partir das camadas extraídas (extrair-camadas.mjs).
O importador do Express só entende estilos simples, então cada camada vira um elemento com estilo inline e
posição absoluta (sem classes, sem variáveis CSS). Fotos e logos entram embutidos (data URI): as fotos em JPEG
a ~1,5x do tamanho na tela, os logos em PNG a 2x. Um documento só, com as 9 peças no formato Story (1080x1920).
Uso: python3 -I ferramentas/gerar-express.py <pasta-das-camadas> <saida>  ->  express-story.html"""
import base64, html, io, json, pathlib, sys
from PIL import Image

pasta, saida = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
raiz = pathlib.Path(__file__).resolve().parent.parent
saida.mkdir(parents=True, exist_ok=True)
PESOS = {'Regular': 400, 'Medium': 500, 'SemiBold': 600, 'Bold': 700, 'ExtraBold': 800, 'Black': 900}
PECAS = ['a1-amil-recibo', 'a2-amil-hospital', 'a3-amil-tabela', 'b1-bradesco-hospital', 'b2-bradesco-extrato',
         'b3-bradesco-paulista', 's1-sula-preco', 's2-sula-hospital', 's3-sula-conta']

cache = {}
def imagem(src, w):
    """Foto (jpg) em JPEG a 1,5x da largura exibida; logo (png) em PNG a 2x, mantendo a transparência."""
    if (src, w) not in cache:
        im = Image.open(raiz / src)
        foto = src.lower().endswith(('.jpg', '.jpeg'))
        alvo = min(im.width, round(w * (1.5 if foto else 2)))
        im = im.convert('RGB' if foto else 'RGBA').resize((alvo, round(im.height * alvo / im.width)), Image.LANCZOS)
        b = io.BytesIO()
        im.save(b, 'JPEG', quality=86, optimize=True, progressive=True) if foto else im.save(b, 'PNG', optimize=True)
        cache[(src, w)] = f'data:image/{"jpeg" if foto else "png"};base64,' + base64.b64encode(b.getvalue()).decode()
    return cache[(src, w)]

rgba = lambda c, op=None: f"rgba({round(c['r']*255)},{round(c['g']*255)},{round(c['b']*255)},{c.get('a', 1) if op is None else op})"
def sombra_txt(fx): return ', '.join(f"{e['offset']['x']}px {e['offset']['y']}px {e['radius']}px {rgba(e['color'])}" for e in fx)
def sombra_filtro(fx): return ' '.join(f"drop-shadow({e['offset']['x']}px {e['offset']['y']}px {e['radius'] / 2}px {rgba(e['color'])})" for e in fx)
def pos(it, extra=''): return f"position:absolute;left:{it['x']}px;top:{it['y']}px;" + extra

def render(itens):
    out = []
    for it in itens:
        k = it['k']
        if k == 'r':
            c = it['css']; st = pos(it, f"width:{it['w']}px;height:{it['h']}px;border-radius:{c['br']};")
            if c['bgi'] != 'none': st += f"background-image:{c['bgi']};"
            st += f"background-color:{c['bgc']};"
            if c['sh'] != 'none': st += f"box-shadow:{c['sh']};"
            if c['bd']: st += f"border:{c['bd']};box-sizing:border-box;"
            if it['op'] < 1: st += f"opacity:{it['op']};"
            out.append(f'<div style="{st}"></div>')
        elif k == 's':
            st = pos(it, f"width:{it['w']}px;height:{it['h']}px;")
            if it.get('fx'): st += f"filter:{sombra_filtro(it['fx'])};"
            out.append(f'<div style="{st}">{it["svg"]}</div>')
        elif k == 'l':
            w, h = (it['peso'], it['h']) if it.get('vertical') else (it['w'], it['peso'])
            x1, y1, x2, y2 = (w / 2, 0, w / 2, h) if it.get('vertical') else (0, h / 2, w, h / 2)
            y = it['y'] if it.get('vertical') else it['y'] - h / 2
            svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><line x1="{x1}" y1="{y1}" '
                   f'x2="{x2}" y2="{y2}" stroke="{rgba(it["color"])}" stroke-width="{it["peso"]}" stroke-dasharray="{" ".join(map(str, it["dash"]))}"/></svg>')
            out.append(f'<div style="position:absolute;left:{it["x"]}px;top:{y}px;width:{w}px;height:{h}px">{svg}</div>')
        elif k == 'i':
            out.append(f'<img alt="" src="{imagem(it["src"], it["w"])}" style="{pos(it, f"width:{it["w"]}px;height:{it["h"]}px;")}">')
        elif k == 't':
            # o parágrafo leva a fonte do maior trecho: a "linha-base" do bloco fica igual à da peça e a altura de
            # cada linha não cresce; cada trecho tem altura de linha proporcional ao seu tamanho, como no CSS original
            m = max(it['runs'], key=lambda r: r['size'])
            st = pos(it, f"margin:0;font-family:'{m['fam']}';font-weight:{PESOS[m['sty']]};font-size:{m['size']}px;"
                         f"line-height:{it['lh']}px;text-align:{it['align'].lower()};")
            st += f"width:{it['w']}px;" if it['w'] else 'white-space:nowrap;'
            if it['fx']: st += f"text-shadow:{sombra_txt(it['fx'])};"
            partes = []
            for r in it['runs']:
                t = html.escape(it['text'][r['s']:r['e']]).replace('\n', '<br>')
                rs = (f"font-family:'{r['fam']}';font-weight:{PESOS[r['sty']]};font-size:{r['size']}px;color:{rgba(r['color'], r['op'])};"
                      f"letter-spacing:{r['ls']}px;line-height:{round(it['lh'] * r['size'] / m['size'], 2)}px;"
                      + (f"vertical-align:{r['va']}px;" if r.get('va') else '') + ('text-transform:uppercase;' if r['upper'] else ''))
                partes.append(f'<span style="{rs}">{t}</span>')
            out.append(f'<p style="{st}">{"".join(partes)}</p>')
        elif k == 'f':
            st = pos(it, f"width:{it['w']}px;height:{it['h']}px;")
            if it.get('rot'): st += f"transform:rotate({it['rot']}deg);"
            if it.get('fx'): st += f"filter:{sombra_filtro(it['fx'])};"
            out.append(f'<div style="{st}">{render(it["itens"])}</div>')
    return ''.join(out)

slides = []
for peca in PECAS:
    spec = json.loads((pasta / f'{peca}-story.json').read_text())
    slides.append(f'<div class="slide" data-canvas-width="1080" data-canvas-height="1920" '
                  f'style="position:relative;width:1080px;height:1920px;overflow:hidden;margin:0 auto 40px;background:#fff">'
                  f'{render(spec["itens"])}</div>')
doc = f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="hz:slide-selector" content=".slide">
<title>Cotações 3 vidas SP · Story</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Poppins:wght@500;600;700&family=Courier+Prime:wght@400;700&family=Caveat:wght@700&family=Gabarito:wght@700;900&display=swap" rel="stylesheet">
<style>body{{margin:0;background:#ddd}}</style>
</head><body>
{chr(10).join(slides)}
</body></html>'''
arq = saida / 'express-story.html'; arq.write_text(doc); print(arq, len(doc))
