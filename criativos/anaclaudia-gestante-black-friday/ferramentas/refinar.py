# Acabamento das fotos ampliadas: devolve a textura fina da foto original (pele, fios) que a IA alisa
# e aplica uma nitidez sutil. Entrada: assets/fotos/originais + assets/fotos/hd (Real-ESRGAN).
# Saída: assets/fotos/nitidas/<nome>.jpg, usadas pelas peças.
# Uso (na pasta do projeto): python3 -I ferramentas/refinar.py vermelho sentada jeans branco-tenis marrom-tule
import sys
import numpy as np
from PIL import Image, ImageFilter

TEXTURA = 0.8                                                   # quanto da textura original volta
NITIDEZ = ImageFilter.UnsharpMask(radius=2.2, percent=45, threshold=2)

for nome in sys.argv[1:]:
    orig = Image.open(f'assets/fotos/originais/{nome}.jpg')
    icc = orig.info.get('icc_profile')
    hd = Image.open(f'assets/fotos/hd/{nome}.jpg').convert('RGB')
    up = orig.convert('RGB').resize(hd.size, Image.LANCZOS)
    detalhe = np.asarray(up, dtype=np.float32) - np.asarray(up.filter(ImageFilter.GaussianBlur(2)), dtype=np.float32)
    out = np.clip(np.asarray(hd, dtype=np.float32) + TEXTURA * detalhe, 0, 255).astype(np.uint8)
    Image.fromarray(out).filter(NITIDEZ).save(f'assets/fotos/nitidas/{nome}.jpg', quality=95, subsampling=0, icc_profile=icc)
    print('ok', nome, hd.size)
