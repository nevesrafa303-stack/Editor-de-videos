# Gera as versões em alta (hd/) das fotos do banco: super-resolução Real-ESRGAN local (CPU), depois
# devolve a textura fina da foto original (pele, cabelo) e aplica nitidez sutil — o mesmo acabamento
# usado em criativos/anaclaudia-gestante-black-friday. Fotos com menos de 1000 px de largura usam o
# modelo 4x; as demais, o 2x.
#
# Pesos: https://github.com/xinntao/Real-ESRGAN/releases (RealESRGAN_x2plus.pth e RealESRGAN_x4plus.pth)
# Requer: pip install torch (CPU) spandrel
# Uso (na raiz do repositório):
#   python3 -I criativos/_banco-de-imagens/ampliar.py /pasta/dos/pesos [familia/01-....jpg ...]
#   (sem arquivos: processa todas as fotos que ainda não têm versão em hd/)
import os
import sys
import numpy as np
import torch
from PIL import Image, ImageFilter
from spandrel import ModelLoader

BANCO = os.path.dirname(os.path.abspath(__file__))
TILE, PAD = 256, 24
TEXTURA, NITIDEZ = 0.8, ImageFilter.UnsharpMask(radius=2.2, percent=45, threshold=2)


@torch.inference_mode()
def super_resolucao(modelo, img):
    s = modelo.scale
    x = torch.from_numpy(np.asarray(img, dtype=np.float32) / 255).permute(2, 0, 1)[None]
    _, _, h, w = x.shape
    out = torch.zeros(1, 3, h * s, w * s)
    for y0 in range(0, h, TILE):
        for x0 in range(0, w, TILE):
            ya, yb, xa, xb = max(y0 - PAD, 0), min(y0 + TILE + PAD, h), max(x0 - PAD, 0), min(x0 + TILE + PAD, w)
            r = modelo(x[:, :, ya:yb, xa:xb])
            ty, tx = (y0 - ya) * s, (x0 - xa) * s
            th, tw = (min(y0 + TILE, h) - y0) * s, (min(x0 + TILE, w) - x0) * s
            out[:, :, y0 * s:y0 * s + th, x0 * s:x0 * s + tw] = r[:, :, ty:ty + th, tx:tx + tw]
    return Image.fromarray((out[0].clamp(0, 1).permute(1, 2, 0).numpy() * 255).round().astype(np.uint8))


def main():
    pesos = sys.argv[1]
    arquivos = sys.argv[2:] or [f'{c}/{f}' for c in ('familia', 'empresarial')
                                for f in sorted(os.listdir(os.path.join(BANCO, c)))
                                if f.endswith('.jpg') and not os.path.exists(os.path.join(BANCO, 'hd', c, f))]
    torch.set_num_threads(4)
    modelos = {}
    for rel in arquivos:
        orig = Image.open(os.path.join(BANCO, rel))
        icc = orig.info.get('icc_profile')
        img = orig.convert('RGB')
        nome = 'RealESRGAN_x4plus.pth' if img.width < 1000 else 'RealESRGAN_x2plus.pth'
        if nome not in modelos:
            modelos[nome] = ModelLoader().load_from_file(os.path.join(pesos, nome)).eval()
        hd = super_resolucao(modelos[nome], img)
        up = img.resize(hd.size, Image.LANCZOS)
        detalhe = np.asarray(up, dtype=np.float32) - np.asarray(up.filter(ImageFilter.GaussianBlur(2)), dtype=np.float32)
        final = Image.fromarray(np.clip(np.asarray(hd, dtype=np.float32) + TEXTURA * detalhe, 0, 255).astype(np.uint8)).filter(NITIDEZ)
        destino = os.path.join(BANCO, 'hd', rel)
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        final.save(destino, quality=94, subsampling=0, icc_profile=icc)
        print('ok', rel, img.size, '->', final.size, flush=True)


if __name__ == '__main__':
    main()
