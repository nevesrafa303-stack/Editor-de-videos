#!/usr/bin/env python3
"""
Prepara os vídeos das cenas da variação 2 a partir do banco de vídeos (criativos/_banco-de-videos/hospitais/):
para as molduras em arco, a versão recorte-topo/ (cortada acima da legenda, sem nenhum reparo); para o fundo do
gancho, a versão vertical/. Cortes curtos são desacelerados (fator < 1) com mistura de quadros.

  python3 -I tools/prep_clips.py   -> assets/video/<nome>.mp4 (720x1280, 30 fps, H.264, sem áudio)
"""
import os, subprocess
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
BANK = os.path.join(ROOT, "..", "..", "..", "criativos", "_banco-de-videos", "hospitais")
OUT = os.path.join(ROOT, "assets", "video")
os.makedirs(OUT, exist_ok=True)
# nome: (arquivo do banco, início, duração no original (None = até o fim), velocidade)
CLIPS = {
    "noite": ("vertical/vila-nova-star-corredor", 0, None, 0.6),
    "a_corredor": ("recorte-topo/vila-nova-star-corredor", 0, None, 0.9),
    "a_quarto01": ("recorte-topo/vila-nova-star-quarto-01", 0, None, 0.7),
    "a_quarto02": ("recorte-topo/vila-nova-star-quarto-02", 0, None, 0.7),
    "a_quarto03": ("recorte-topo/vila-nova-star-quarto-03", 0, None, 0.55),
    "a_centro": ("recorte-topo/vila-nova-star-centro-diagnostico", 0, None, 0.5),
    "a_medica": ("recorte-topo/vila-nova-star-medica", 0, None, 0.45),
    "a_fachada": ("recorte-topo/vila-nova-star-fachada-02", 0, None, 0.8),
    "a_lobby": ("recorte-topo/vila-nova-star-lobby", 0, None, 0.9),
    "a_vista": ("recorte-topo/vila-nova-star-quarto-vista", 0, None, 0.6),
}
for name, (src, ss, dur, speed) in CLIPS.items():
    vf = f"setpts=PTS/{speed}" + (",minterpolate=fps=30:mi_mode=blend" if speed < 1 else "") + ",fps=30,format=yuv420p"
    cmd = ["ffmpeg", "-v", "error", "-y", "-ss", str(ss), "-i", os.path.join(BANK, src + ".mp4")]
    if dur: cmd += ["-t", str(dur)]
    cmd += ["-an", "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-movflags", "+faststart", os.path.join(OUT, name + ".mp4")]
    subprocess.run(cmd, check=True)
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(OUT, name + ".mp4")],
                             capture_output=True, text=True).stdout)
    print(f"{name:12s} {src:36s} x{speed:<4} {d:5.2f} s")
