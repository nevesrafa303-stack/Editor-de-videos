"""Fotos reais das peças (nada de banco de imagens nem foto gerada):
- quadros dos cortes do Vila Nova Star em criativos/_banco-de-videos (Reel 05, uso autorizado segundo o cliente),
  na versão recorte-topo (sem reparo de legenda), no quadro mais nítido de cada corte;
- fotos de fachada enviadas pelo cliente (motion/videos/sp-rede-premium-cnpj/assets/img).
Uso: python3 -I ferramentas/preparar-fotos.py  ->  assets/fotos/*.jpg"""
import pathlib, shutil, subprocess

raiz = pathlib.Path(__file__).resolve().parent.parent
repo = raiz.parent.parent
saida = raiz / 'assets/fotos'
banco = repo / 'criativos/_banco-de-videos/hospitais/recorte-topo'
cliente = repo / 'motion/videos/sp-rede-premium-cnpj/assets/img'

QUADROS = {  # arquivo de saída: (corte do banco, segundo do quadro mais nítido)
    'vns-fachada-vidro.jpg': ('vila-nova-star-fachada-02.mp4', 0.0),
    'vns-letreiro.jpg': ('vila-nova-star-letreiro.mp4', 1.167),
    'vns-lobby.jpg': ('vila-nova-star-lobby.mp4', 0.0),
    'vns-quarto-vista.jpg': ('vila-nova-star-quarto-vista.mp4', 0.0),
    'vns-restaurante.jpg': ('vila-nova-star-restaurante.mp4', 1.1),
    'vns-quarto.jpg': ('vila-nova-star-quarto-01.mp4', 0.0),
}
for nome, (corte, t) in QUADROS.items():
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', str(t), '-i', str(banco / corte), '-frames:v', '1', '-q:v', '1',
                    str(saida / nome)], check=True)
    print(nome, '<-', corte, t)
for nome, orig in {'vns-fachada.jpg': 'vila-nova-star.jpg', 'sao-luiz-itaim.jpg': 'sao-luiz-itaim.jpg'}.items():
    shutil.copyfile(cliente / orig, saida / nome)
    print(nome, '<-', orig, '(enviada pelo cliente)')
