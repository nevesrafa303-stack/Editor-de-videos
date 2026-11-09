#!/usr/bin/env python3
"""
Prepara os vídeos reais de hospitais do banco (criativos/_banco-de-videos/hospitais/), uso autorizado segundo o cliente:
- fachadas e interiores em tela cheia: versão recorte-topo/ (cortada acima da legenda, sem reparo), 720x912;
- atendimento (consultório, exames, equipe): versão faixa/ (720x392).
Cortes curtos são desacelerados (fator < 1) com mistura de quadros.

  python3 -I tools/prep_clips.py [nome ...]   -> assets/video/<nome>.mp4 (30 fps, H.264, sem áudio)
"""
import os, subprocess, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
BANK = os.path.join(ROOT, "..", "..", "..", "criativos", "_banco-de-videos", "hospitais")
OUT = os.path.join(ROOT, "assets", "video")
os.makedirs(OUT, exist_ok=True)
# nome: (arquivo do banco, início, duração no original (None = até o fim), velocidade)
CLIPS = {
    # fachadas (gancho)
    "f_einstein": ("recorte-topo/einstein-fachada-01", 0, None, 0.5),
    "f_einstein_porta": ("recorte-topo/einstein-logo-porta", 0, None, 0.5),
    "f_einstein_marq": ("recorte-topo/einstein-marquise", 0, None, 0.45),
    "f_sirio": ("recorte-topo/sirio-libanes-predio-03", 0, None, 0.5),
    "f_sirio_ent": ("recorte-topo/sirio-libanes-entrada-robotica", 0, None, 0.5),
    "f_sirio_torre": ("recorte-topo/sirio-libanes-predio-02", 0, None, 0.6),
    "f_vns": ("recorte-topo/vila-nova-star-fachada-02", 0, None, 0.8),
    "f_vns_letreiro": ("recorte-topo/vila-nova-star-letreiro", 0, None, 0.6),
    # interiores e atendimento
    "i_einstein_atrio": ("recorte-topo/einstein-atrio", 0, None, 0.6),
    "i_sirio_recepcao": ("recorte-topo/sirio-libanes-recepcao-03", 0, None, 0.65),
    "i_vns_quarto": ("recorte-topo/vila-nova-star-quarto-02", 0, None, 0.8),
    "i_vns_corredor": ("recorte-topo/vila-nova-star-corredor", 0, None, 0.65),
    "i_robotica": ("recorte-topo/cirurgia-robotica-01", 0, None, 0.6),
    "a_medico_tablet": ("faixa/einstein-checkup-medico-tablet", 0, None, 0.9),
    "a_ultrassom": ("faixa/einstein-checkup-ultrassom", 0, None, 0.7),
    "a_esteira": ("faixa/einstein-checkup-esteira", 0, None, 0.45),
    "a_enfermeira": ("faixa/einstein-checkup-enfermeira", 0, None, 0.6),
    "a_consulta": ("faixa/medico-consulta", 0, None, 1.0),
    "a_equipe": ("faixa/equipe-cirurgica", 0, None, 0.5),
    "a_recepcao": ("faixa/checkup-recepcao", 0, None, 0.8),
}
ONLY = set(sys.argv[1:])  # nomes opcionais: refaz só esses cortes
for name, (src, ss, dur, speed) in CLIPS.items():
    if ONLY and name not in ONLY: continue
    vf = f"setpts=PTS/{speed}" + (",minterpolate=fps=30:mi_mode=blend" if speed < 1 else "") + ",fps=30,format=yuv420p"
    cmd = ["ffmpeg", "-v", "error", "-y", "-ss", str(ss), "-i", os.path.join(BANK, src + ".mp4")]
    if dur: cmd += ["-t", str(dur)]
    cmd += ["-an", "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-g", "30", "-keyint_min", "30", "-movflags", "+faststart", os.path.join(OUT, name + ".mp4")]
    subprocess.run(cmd, check=True)
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(OUT, name + ".mp4")],
                             capture_output=True, text=True).stdout)
    print(f"{name:18s} {src:44s} x{speed:<4} {d:5.2f} s")
