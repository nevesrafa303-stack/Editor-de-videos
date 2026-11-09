# Baixa as fotos originais da pasta de Natal da cliente (Google Drive) e guarda uma cópia REDUZIDA em assets/fotos/.
# Regra da cliente: só cortar e reduzir. Aqui só reduzimos (lado maior = 4000 px, Lanczos), sem filtro, nitidez ou
# ajuste de cor; o perfil de cor (sRGB) original vai junto. As originais (11–30 MB cada) ficam fora do git.
# Uso: python3 -I ferramentas/preparar-fotos.py PASTA_DAS_ORIGINAIS   (ou sem argumento, para baixar do Drive)
import os, sys, subprocess, tempfile
from PIL import Image

DRIVE = {  # nome → id do arquivo no Drive da cliente (só as fotos usadas nas peças)
    'ANA_9127': '1kz_0EQf_trCOz-QhnOKmUTemWyZuT3yU', 'ANA_9320': '1i6fETjgZFDiHOhvkuhMakBkaFHPQgWKS',
    'ANA_9390': '1qWXY_0kHGn5GIruMeH-smNAicwqYIF4L', 'ANA_9214': '1YxgKS-BkEYS-qWjlsgTSKckg4ZCkUORK',
    'ANA_9178': '1wJ4bqcH3p7hKXwtpll3tDaieZNxG_qea', 'ANA_9359': '1sOGzZuGQXQ8tgxEOniBKNzofx9rvNMVg',
    'ANA_9363': '1x62RErSVec_VpyHPu_2sxibMdkUlTpFK', 'ANA_9265': '14cn0iGkDEDLPlgupUF8Jf-5-5P7HaTb9',
    'ANA_9215': '1-aLT5mrkzD212BzYxoe0EpJfHGIMNN7I', 'ANA_9209': '15h4yANBPDTl_2d7cTILiUPQuzCU8QXai',
}
LADO = 4000  # em tela cheia no Story (2160×3840 exportado) a foto precisa de ~4000 px de altura
Image.MAX_IMAGE_PIXELS = None
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
destino = os.path.join(raiz, 'assets', 'fotos')
os.makedirs(destino, exist_ok=True)
origem = sys.argv[1] if len(sys.argv) > 1 else tempfile.mkdtemp(prefix='natal-originais-')
for nome, fid in DRIVE.items():
    orig = os.path.join(origem, nome + '.jpg')
    if not os.path.exists(orig):
        subprocess.run(['curl', '-sSL', '--retry', '3', '-o', orig,
                        f'https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t'], check=True)
    im = Image.open(orig)
    w, h = im.size
    f = min(1, LADO / max(w, h))
    red = im.resize((round(w * f), round(h * f)), Image.LANCZOS) if f < 1 else im.copy()
    red.save(os.path.join(destino, nome + '.jpg'), quality=92, icc_profile=im.info.get('icc_profile'))
    print(nome, (w, h), '→', red.size)
