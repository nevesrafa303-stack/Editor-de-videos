#!/usr/bin/env python3
"""
Prepara os vídeos das cenas a partir do banco de vídeos (criativos/_banco-de-videos/hospitais/vertical/, cortes
limpos do Vila Nova Star, sem áudio e sem legenda). Alguns cortes são muito curtos para a fala: esses são
desacelerados (fator SPEED < 1) com interpolação por mistura de quadros, sem mudar o enquadramento.

  python3 -I tools/prep_clips.py   -> assets/video/<nome>.mp4 (720x1280, 30 fps, H.264, sem áudio)
"""
import os, subprocess
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
BANK = os.path.join(ROOT, "..", "..", "..", "criativos", "_banco-de-videos", "hospitais", "vertical")
OUT = os.path.join(ROOT, "assets", "video")
os.makedirs(OUT, exist_ok=True)
# nome: (arquivo do banco, início, duração no original (None = até o fim), velocidade)
CLIPS = {
    "fachada": ("vila-nova-star-fachada-02", 0, None, 1.0),
    "letreiro": ("vila-nova-star-letreiro", 0, None, 0.6),
    "lobby": ("vila-nova-star-lobby", 0, None, 1.0),
    "quarto01": ("vila-nova-star-quarto-01", 0, None, 0.8),
    "enxoval": ("vila-nova-star-enxoval", 0, None, 1.0),
    "quartovista": ("vila-nova-star-quarto-vista", 0, None, 0.8),
    "suite": ("vila-nova-star-suite-sala", 0, None, 0.5),
    "quarto03": ("vila-nova-star-quarto-03", 0, None, 0.9),
    "amenities": ("vila-nova-star-amenities", 0, None, 0.6),
    "restaurante": ("vila-nova-star-restaurante", 0, None, 0.7),
    "corredorA": ("vila-nova-star-corredor", 0, 1.5, 1.0),
    "corredorB": ("vila-nova-star-corredor", 1.5, None, 0.85),
    "quarto02": ("vila-nova-star-quarto-02", 0, None, 0.8),
    "medica": ("vila-nova-star-medica", 0, None, 0.5),
    "centro": ("vila-nova-star-centro-diagnostico", 0, None, 1.0),
    "robo1": ("cirurgia-robotica-01", 0, None, 0.8),
    "robo2": ("cirurgia-robotica-02", 0, None, 0.7),
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
