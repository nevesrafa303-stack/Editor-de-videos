"""Gera as imagens do site (WebP) a partir de ../originais.

Uso (de sites/_fontes/reforce): python3 -I scripts/preparar-imagens.py ../../reforce/src/assets/img
As imagens do PDF institucional têm pouca resolução (setores com 416 px, retratos com ~400 px):
são ampliadas com Lanczos e uma nitidez leve, só o bastante para telas retina no tamanho em que
aparecem no site. Nada de troca de fundo ou retoque nos retratos.
"""
import sys, os, glob
from PIL import Image, ImageFilter

origem = os.path.join(os.path.dirname(__file__), "..", "originais")
destino = sys.argv[1]
os.makedirs(destino, exist_ok=True)


def salvar(im, nome, q=80):
    im.save(os.path.join(destino, nome + ".webp"), "WEBP", quality=q, method=6)


def ampliar(im, largura):
    if im.width >= largura:
        return im
    alt = round(im.height * largura / im.width)
    im = im.resize((largura, alt), Image.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=2))


for f in sorted(glob.glob(os.path.join(origem, "*.jpg"))):
    nome = os.path.basename(f)[:-4]
    im = Image.open(f).convert("RGB")
    if nome.startswith("setor-"):
        salvar(ampliar(im, 1100), nome, 78)
    elif nome.startswith("equipe-"):
        # quadrado centrado no rosto (os retratos já vêm enquadrados)
        lado = min(im.size)
        x = (im.width - lado) // 2
        y = 0 if im.height > im.width else (im.height - lado) // 2
        im = im.crop((x, y, x + lado, y + lado))
        salvar(ampliar(im, 720), nome, 80)
    elif nome == "campo-construtibilidade":
        # foto em pé no PDF aparece cortada na horizontal: mesmo recorte (tela + mesa)
        alt = round(im.width * 3 / 4)
        y = 330
        salvar(ampliar(im.crop((0, y, im.width, y + alt)), 1280), nome, 78)
    else:
        salvar(im, nome, 80)

rede = Image.open(os.path.join(origem, "rede-brasil.png"))
rede.save(os.path.join(destino, "rede-brasil.webp"), "WEBP", quality=85, method=6)
print("ok", len(os.listdir(destino)))
