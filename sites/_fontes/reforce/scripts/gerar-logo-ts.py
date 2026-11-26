"""Copia os caminhos de logo-reforce.svg e marca-r.svg para o site (src/lib/logo-paths.ts e src/app/icon.svg).

Uso (de sites/_fontes/reforce): python3 -I scripts/gerar-logo-ts.py
"""
import os
import re

aqui = os.path.join(os.path.dirname(__file__), "..")
site = os.path.join(aqui, "..", "..", "reforce", "src")


def caminhos(arq):
    t = open(os.path.join(aqui, arq)).read()
    vb = re.search(r'viewBox="([^"]+)"', t).group(1)
    ps = re.findall(r'<path fill="[^"]+"(?: fill-rule="[^"]+")? d="([^"]+)"', t)
    return vb, [re.sub(r"(\d+\.\d)\d", r"\1", p) for p in ps]


lvb, (ll, lb) = caminhos("logo-reforce.svg")
mvb, (mr, mb) = caminhos("marca-r.svg")
open(os.path.join(site, "lib", "logo-paths.ts"), "w").write(
    "// Gerado por sites/_fontes/reforce/scripts/gerar-logo-ts.py a partir do logo vetorizado do PDF institucional.\n"
    f'export const LOGO_VIEWBOX = "{lvb}";\nexport const LOGO_LETRAS = "{ll}";\nexport const LOGO_BLOCO = "{lb}";\n'
    f'export const MARCA_VIEWBOX = "{mvb}";\nexport const MARCA_R = "{mr}";\nexport const MARCA_BLOCO = "{mb}";\n'
)
open(os.path.join(site, "app", "icon.svg"), "w").write(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-28 -30 188 184">'
    '<rect x="-28" y="-30" width="188" height="184" rx="40" fill="#011417"/>'
    f'<path fill="#fff" fill-rule="evenodd" d="{mr}"/><path fill="#00bda1" d="{mb}"/></svg>'
)
print("ok")
