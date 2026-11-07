"""Gera as tabelas do README do banco a partir de indice.json (e confere se cada arquivo existe).

  python -I tools/gerar_indice.py

Reescreve, no README.md, o trecho entre <!-- tabelas --> e <!-- /tabelas -->.
"""
import json, os, subprocess
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
idx = json.load(open(os.path.join(B, "indice.json"), encoding="utf-8"))

def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p],
                                capture_output=True, text=True).stdout)
def br(x):
    return f"{x:.1f}".replace(".", ",")
def origem(o):
    head, span, s = o.rsplit(" ", 2)
    return f"{head} {span.replace('.', ',')} {s}"

def tabela(pasta, obs):
    rows = sorted((d for d in idx if d["arquivo"].startswith(pasta + "/")), key=lambda d: (d["hospital"], d["arquivo"]))
    lin = ["| Arquivo | Hospital | O que aparece | Duração | Origem |" + (" Obs. |" if obs else ""),
           "|---|---|---|---|---|" + ("---|" if obs else "")]
    for d in rows:
        p = os.path.join(B, "hospitais", d["arquivo"])
        if not os.path.exists(p):
            raise SystemExit(f"falta o arquivo: {d['arquivo']}")
        lin.append(f"| `{d['arquivo']}` | {d['hospital']} | {d['descricao']} | {br(dur(p))} s | {origem(d['origem'])} |"
                   + (f" {d.get('obs', '')} |" if obs else ""))
    return "\n".join(lin), len(rows)

v, nv = tabela("vertical", True)
f, nf = tabela("faixa", False)
bloco = f"""<!-- tabelas -->
## Tela cheia — `vertical/` (e o mesmo trecho em `recorte-topo/`) · {nv} cortes

{v}

## Faixas — `faixa/` · {nf} cortes

{f}
<!-- /tabelas -->"""
p = os.path.join(B, "README.md")
s = open(p, encoding="utf-8").read()
i, j = s.index("<!-- tabelas -->"), s.index("<!-- /tabelas -->") + len("<!-- /tabelas -->")
open(p, "w", encoding="utf-8").write(s[:i] + bloco + s[j:])
print(f"README: {nv} verticais, {nf} faixas")
