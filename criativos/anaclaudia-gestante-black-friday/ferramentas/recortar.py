# Recorta a modelo do fundo (BiRefNet, ONNX, local) e tira a cor do fundo das bordas do cabelo,
# para compor sobre o holofote desenhado em CSS.
#
# Modelo: https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-epoch_244.onnx
# Uso (na pasta do projeto): python3 -I ferramentas/recortar.py /caminho/BiRefNet.onnx sentada jeans
# Saída: assets/fotos/recortes/<nome>.png (RGBA, mesma resolução da foto original)
import sys
import numpy as np
import onnxruntime as ort
from PIL import Image

MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def box(a, r):
    """Média móvel separável (raio r) via soma acumulada; aceita arrays 2D ou 3D."""
    for ax in (0, 1):
        pad = [(0, 0)] * a.ndim
        pad[ax] = (r + 1, r)
        c = np.cumsum(np.pad(a, pad, mode='edge'), axis=ax)
        hi = np.take(c, range(2 * r + 1, c.shape[ax]), axis=ax)
        lo = np.take(c, range(0, c.shape[ax] - 2 * r - 1), axis=ax)
        a = (hi - lo) / (2 * r + 1)
    return a


def fundo_estimado(img, alfa):
    """Cor do fundo atrás da modelo: média normalizada só dos pixels de fundo, em baixa resolução."""
    f = 8
    h, w = alfa.shape
    hs, ws = h // f, w // f
    peso = (alfa < 0.04).astype(np.float32)[:hs * f, :ws * f].reshape(hs, f, ws, f).mean(axis=(1, 3))
    cor = (img[:hs * f, :ws * f] * (alfa[:hs * f, :ws * f, None] < 0.04)).reshape(hs, f, ws, f, 3).sum(axis=(1, 3)) / (f * f)
    num, den = cor.copy(), peso.copy()
    for r in (4, 12, 40):  # preenche o buraco da modelo com raios crescentes
        n2, d2 = box(cor, r), box(peso, r)
        vazio = den < 0.05
        num[vazio], den[vazio] = n2[vazio], d2[vazio]
    bg = num / np.maximum(den, 1e-4)[..., None]
    bg = np.asarray(Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8)).resize((w, h), Image.BILINEAR), dtype=np.float32)
    return bg


def main():
    modelo, nomes = sys.argv[1], sys.argv[2:]
    op = ort.SessionOptions()
    op.enable_cpu_mem_arena = False  # sem isso o BiRefNet passa de 15 GB de RAM na CPU
    op.enable_mem_pattern = False
    op.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_BASIC
    sess = ort.InferenceSession(modelo, sess_options=op, providers=['CPUExecutionProvider'])
    entrada = sess.get_inputs()[0].name
    for nome in nomes:
        im = Image.open(f'assets/fotos/originais/{nome}.jpg').convert('RGB')
        x = np.asarray(im.resize((1024, 1024), Image.LANCZOS), dtype=np.float32) / 255.0
        x = ((x - MEAN) / STD).transpose(2, 0, 1)[None].astype(np.float32)
        pred = sess.run(None, {entrada: x})[0][0, 0]
        p = 1 / (1 + np.exp(-pred))
        p = (p - p.min()) / (p.max() - p.min())
        alfa = np.asarray(Image.fromarray((p * 255).astype(np.uint8)).resize(im.size, Image.LANCZOS), dtype=np.float32) / 255

        img = np.asarray(im, dtype=np.float32)
        bg = fundo_estimado(img, alfa)
        a = np.clip(alfa, 0, 1)[..., None]
        # I = a·F + (1-a)·B  →  F = (I - (1-a)·B) / a   (só onde a modelo é parcialmente transparente)
        frente = np.where(a > 0.98, img, (img - (1 - a) * bg) / np.maximum(a, 0.08))
        frente = np.clip(frente, 0, 255)
        rgba = np.dstack([frente, alfa * 255]).astype(np.uint8)
        Image.fromarray(rgba, 'RGBA').save(f'assets/fotos/recortes/{nome}.png', optimize=True)
        print('ok', nome, im.size)


if __name__ == '__main__':
    main()
