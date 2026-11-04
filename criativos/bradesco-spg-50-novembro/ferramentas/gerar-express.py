"""Gera o HTML de importação para o Adobe Express a partir das camadas extraídas (extrair-camadas.mjs).
O importador do Express só entende estilos simples, então cada camada vira um elemento com estilo inline e
posição absoluta (sem classes, sem variáveis CSS); as fotos entram embutidas (data URI) já com o esmaecimento
da borda aplicado; os furos do picote viram círculos na cor do fundo, amostrada da peça final.
Uso: python3 -I ferramentas/gerar-express.py <pasta-das-camadas> <saida>  ->  express-story.html, express-feed.html"""
import base64, html, io, json, pathlib, re, sys
from PIL import Image

pasta, saida = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
raiz = pathlib.Path(__file__).resolve().parent.parent
saida.mkdir(parents=True, exist_ok=True)
D = re.search(r' d="([^"]+)"', (raiz / 'assets/marca/bradesco-saude.svg').read_text()).group(1)
PESOS = {'Regular': 400, 'Medium': 500, 'SemiBold': 600, 'Bold': 700, 'ExtraBold': 800, 'Black': 900}
# largura de exportação de cada recorte e de que lado a borda esmaece (igual à máscara CSS das peças)
FOTOS = {'12-dupla-recorte-adobe.png': (1100, 'baixo'), '05-trio-recorte-adobe.png': (1600, 'baixo'),
         '04-equipe-recorte-adobe.png': (1000, 'esquerda')}

def data_uri(im, fmt='PNG'):
    b = io.BytesIO(); im.save(b, fmt, optimize=True)
    return f'data:image/{fmt.lower()};base64,' + base64.b64encode(b.getvalue()).decode()

cache = {}
def foto(src):
    if src not in cache:
        w, lado = FOTOS[src]
        im = Image.open(raiz / 'assets/fotos' / src).convert('RGBA')
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        a = im.split()[-1]; px = a.load(); W, H = im.size
        for y in range(H):
            for x in range(W):
                f = 1.0
                if lado == 'baixo' and y > .88 * H: f = max(0.0, (H - y) / (.12 * H))
                if lado == 'esquerda' and x < .09 * W: f = x / (.09 * W)
                if f < 1: px[x, y] = int(px[x, y] * f)
        im.putalpha(a); cache[src] = data_uri(im)
    return cache[src]

rgba = lambda c, op=None: f"rgba({round(c['r']*255)},{round(c['g']*255)},{round(c['b']*255)},{c.get('a', 1) if op is None else op})"
def sombra_txt(fx): return ', '.join(f"{e['offset']['x']}px {e['offset']['y']}px {e['radius']}px {rgba(e['color'])}" for e in fx)
def pos(it, extra=''): return f"position:absolute;left:{it['x']}px;top:{it['y']}px;" + extra

def render(itens, fmt, peca, ox=0, oy=0):
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
            out.append(f'<div style="{pos(it, f"width:{it["w"]}px;height:{it["h"]}px;")}">{it["svg"].replace("__D__", D)}</div>')
        elif k == 'l':
            w, h = (it['peso'], it['h']) if it.get('vertical') else (it['w'], it['peso'])
            x1, y1, x2, y2 = (w / 2, 0, w / 2, h) if it.get('vertical') else (0, h / 2, w, h / 2)
            y = it['y'] if it.get('vertical') else it['y'] - h / 2
            svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><line x1="{x1}" y1="{y1}" '
                   f'x2="{x2}" y2="{y2}" stroke="{rgba(it["color"])}" stroke-width="{it["peso"]}" stroke-dasharray="{" ".join(map(str, it["dash"]))}"/></svg>')
            out.append(f'<div style="position:absolute;left:{it["x"]}px;top:{y}px;width:{w}px;height:{h}px">{svg}</div>')
        elif k == 'i':
            out.append(f'<img alt="" src="{foto(it["src"])}" style="{pos(it, f"width:{it["w"]}px;height:{it["h"]}px;")}">')
        elif k == 'x':
            im = Image.open(pasta / f'raster-{peca}-{fmt}-{it["raster"]}.png')
            out.append(f'<img alt="" src="{data_uri(im)}" style="{pos(it, f"width:{it["w"]}px;height:{it["h"]}px;")}">')
        elif k == 't':
            st = pos(it, f"margin:0;line-height:{it['lh']}px;text-align:{it['align'].lower()};")
            st += f"width:{it['w']}px;" if it['w'] else 'white-space:nowrap;'
            if it['fx']: st += f"text-shadow:{sombra_txt(it['fx'])};"
            partes = []
            for r in it['runs']:
                t = html.escape(it['text'][r['s']:r['e']]).replace('\n', '<br>')
                rs = (f"font-family:'{r['fam']}';font-weight:{PESOS[r['sty']]};font-size:{r['size']}px;color:{rgba(r['color'], r['op'])};"
                      f"letter-spacing:{r['ls']}px;" + ('text-transform:uppercase;' if r['upper'] else ''))
                partes.append(f'<span style="{rs}">{t}</span>')
            out.append(f'<p style="{st}">{"".join(partes)}</p>')
        elif k == 'f':
            st = pos(it, f"width:{it['w']}px;height:{it['h']}px;")
            if it.get('rot'): st += f"transform:rotate({it['rot']}deg);"
            filhos = render(it['itens'], fmt, peca, ox + it['x'], oy + it['y'])
            for furo in it.get('furos') or []:  # furo do picote = círculo na cor do fundo atrás do cupom
                fin = Image.open(raiz / f'final/{peca}-{fmt}.png').convert('RGB')
                gx, gy = (ox + it['x'] + furo['cx']) * 2, (oy + it['y'] + furo['cy'] + (-30 if furo['cy'] == 0 else 30)) * 2
                cor = '#%02x%02x%02x' % fin.getpixel((int(gx), int(gy)))
                d = 2 * furo['r']
                filhos += f'<div style="position:absolute;left:{furo["cx"] - furo["r"]}px;top:{furo["cy"] - furo["r"]}px;width:{d}px;height:{d}px;border-radius:50%;background-color:{cor}"></div>'
            out.append(f'<div style="{st}">{filhos}</div>')
    return ''.join(out)

PECAS = ['b1-classico', 'b2-cupom', 'b3-mensalidades']
for fmt, h in (('story', 1920), ('feed', 1350)):
    slides = []
    for peca in PECAS:
        spec = json.loads((pasta / f'{peca}-{fmt}.json').read_text())
        slides.append(f'<div class="slide" data-canvas-width="1080" data-canvas-height="{h}" '
                      f'style="position:relative;width:1080px;height:{h}px;overflow:hidden;margin:0 auto 40px;background:#fff">'
                      f'{render(spec["itens"], fmt, peca)}</div>')
    doc = f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="hz:slide-selector" content=".slide">
<title>Bradesco Saúde SPG · {'Stories' if fmt == 'story' else 'Feed'}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>body{{margin:0;background:#ddd}}</style>
</head><body>
{chr(10).join(slides)}
</body></html>'''
    arq = saida / f'express-{fmt}.html'; arq.write_text(doc); print(arq, len(doc))
