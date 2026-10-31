# Super-resolução local das fotos (Real-ESRGAN via spandrel/PyTorch na CPU), para a exportação em 2x
# não precisar ampliar foto nenhuma no navegador.
#
# Pesos: https://github.com/xinntao/Real-ESRGAN/releases (RealESRGAN_x2plus.pth, RealESRGAN_x4plus.pth,
#        realesr-general-x4v3.pth). Requer: pip install torch (CPU) spandrel
# Uso (na pasta do projeto):
#   python3 -I ferramentas/ampliar.py PESOS.pth ENTRADA.jpg SAIDA.jpg [escala_final=2]
# Modelos 4x são reduzidos para a escala final com Lanczos.
import sys
import numpy as np
import torch
from PIL import Image
from spandrel import ModelLoader

TILE, PAD = 256, 24  # blocos com margem, para caber na memória sem emendas visíveis


@torch.inference_mode()
def ampliar(modelo, img):
    s = modelo.scale
    x = torch.from_numpy(np.asarray(img, dtype=np.float32) / 255).permute(2, 0, 1)[None]
    _, _, h, w = x.shape
    out = torch.zeros(1, 3, h * s, w * s)
    for y0 in range(0, h, TILE):
        for x0 in range(0, w, TILE):
            ya, yb = max(y0 - PAD, 0), min(y0 + TILE + PAD, h)
            xa, xb = max(x0 - PAD, 0), min(x0 + TILE + PAD, w)
            r = modelo(x[:, :, ya:yb, xa:xb])
            ty, tx = (y0 - ya) * s, (x0 - xa) * s
            th, tw = (min(y0 + TILE, h) - y0) * s, (min(x0 + TILE, w) - x0) * s
            out[:, :, y0 * s:y0 * s + th, x0 * s:x0 * s + tw] = r[:, :, ty:ty + th, tx:tx + tw]
    arr = (out[0].clamp(0, 1).permute(1, 2, 0).numpy() * 255).round().astype(np.uint8)
    return Image.fromarray(arr)


def main():
    pesos, entrada, saida = sys.argv[1:4]
    final = int(sys.argv[4]) if len(sys.argv) > 4 else 2
    torch.set_num_threads(4)
    modelo = ModelLoader().load_from_file(pesos).eval()
    img = Image.open(entrada).convert('RGB')
    icc = Image.open(entrada).info.get('icc_profile')
    hd = ampliar(modelo, img)
    alvo = (img.width * final, img.height * final)
    if hd.size != alvo:
        hd = hd.resize(alvo, Image.LANCZOS)
    hd.save(saida, quality=95, subsampling=0, icc_profile=icc)
    print('ok', saida, hd.size)


if __name__ == '__main__':
    main()
