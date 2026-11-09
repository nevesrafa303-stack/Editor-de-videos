# Junta as 12 imagens de final/ numa visão geral (final/_visao-geral.jpg): Story em cima, Feed embaixo.
# Uso: python3 -I ferramentas/visao-geral.py [saida.jpg] [largura_de_cada]
import glob, os, sys
from PIL import Image
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
saida = sys.argv[1] if len(sys.argv) > 1 else os.path.join(raiz, 'final', '_visao-geral.jpg')
L = int(sys.argv[2]) if len(sys.argv) > 2 else 540
ids = sorted({os.path.basename(f).rsplit('-', 1)[0] for f in glob.glob(os.path.join(raiz, 'final', 'n*-story.png'))})
G = 24
hs, hf = round(L * 16 / 9), round(L * 5 / 4)
tela = Image.new('RGB', (G + len(ids) * (L + G), G * 3 + hs + hf), '#e9e2d6')
for i, n in enumerate(ids):
    for fmt, y, h in (('story', G, hs), ('feed', G * 2 + hs, hf)):
        im = Image.open(os.path.join(raiz, 'final', f'{n}-{fmt}.png')).convert('RGB').resize((L, h), Image.LANCZOS)
        tela.paste(im, (G + i * (L + G), y))
tela.save(saida, quality=88)
print(saida, tela.size)
