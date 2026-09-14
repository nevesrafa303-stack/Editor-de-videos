#!/usr/bin/env python3
"""Gera a pagina de referencia a partir dos documentos markdown deste diretorio.

A pagina publicada nao e escrita a mao: sai daqui. Assim documento e pagina nao
podem divergir, que e como documentacao morre.

Uso: python3 docs/build_page.py > /caminho/arquitetura.html
"""
import html
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent


# --------------------------------------------------------------- markdown ---
def inline(text: str) -> str:
    """Converte marcacao inline. Escapa primeiro; nada de HTML cru do markdown."""
    out = html.escape(text, quote=False)
    out = re.sub(r"`([^`]+)`", r"<code>\1</code>", out)
    out = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", out)
    out = re.sub(r"(?<![\w*])\*([^*\n]+)\*(?![\w*])", r"<em>\1</em>", out)
    out = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', out)
    return out


def convert(md: str, level_shift: int = 1) -> str:
    """Markdown -> HTML. Cobre o subconjunto usado nestes documentos."""
    lines = md.split("\n")
    out: list[str] = []
    i = 0
    n = len(lines)

    while i < n:
        line = lines[i]

        # Bloco de codigo (mermaid vira <pre class="mermaid">, que o Artifact
        # renderiza nativamente).
        if line.startswith("```"):
            lang = line[3:].strip()
            i += 1
            buf = []
            while i < n and not lines[i].startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1
            body = "\n".join(buf)
            if lang == "mermaid":
                out.append(f'<pre class="mermaid">{html.escape(body)}</pre>')
            else:
                out.append(
                    f'<div class="code-scroll"><pre><code>{html.escape(body)}</code></pre></div>'
                )
            continue

        # Tabela
        if line.startswith("|") and i + 1 < n and re.match(r"^\|[\s:|-]+\|$", lines[i + 1]):
            header = [c.strip() for c in line.strip("|").split("|")]
            aligns = []
            for spec in lines[i + 1].strip("|").split("|"):
                spec = spec.strip()
                if spec.startswith(":") and spec.endswith(":"):
                    aligns.append("center")
                elif spec.endswith(":"):
                    aligns.append("right")
                else:
                    aligns.append("left")
            i += 2
            rows = []
            while i < n and lines[i].startswith("|"):
                rows.append([c.strip() for c in lines[i].strip("|").split("|")])
                i += 1

            th = "".join(
                f'<th style="text-align:{aligns[k] if k < len(aligns) else "left"}">{inline(c)}</th>'
                for k, c in enumerate(header)
            )
            trs = []
            for row in rows:
                tds = "".join(
                    f'<td style="text-align:{aligns[k] if k < len(aligns) else "left"}">{inline(c)}</td>'
                    for k, c in enumerate(row)
                )
                trs.append(f"<tr>{tds}</tr>")
            out.append(
                '<div class="table-scroll"><table><thead><tr>'
                + th
                + "</tr></thead><tbody>"
                + "".join(trs)
                + "</tbody></table></div>"
            )
            continue

        # Titulo
        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if m:
            lvl = min(len(m.group(1)) + level_shift, 6)
            text = m.group(2)
            slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:60]
            out.append(f'<h{lvl} id="{slug}">{inline(text)}</h{lvl}>')
            i += 1
            continue

        # Regra horizontal
        if re.match(r"^---+$", line):
            out.append("<hr>")
            i += 1
            continue

        # Citacao
        if line.startswith(">"):
            buf = []
            while i < n and lines[i].startswith(">"):
                buf.append(lines[i].lstrip("> ").rstrip())
                i += 1
            out.append(f"<blockquote>{inline(' '.join(buf))}</blockquote>")
            continue

        # Lista (numerada ou nao), com continuacao recuada
        if re.match(r"^\s*(?:[-*]|\d+\.)\s+", line):
            ordered = bool(re.match(r"^\s*\d+\.\s+", line))
            items: list[str] = []
            while i < n and (
                re.match(r"^\s*(?:[-*]|\d+\.)\s+", lines[i])
                or (lines[i].startswith("  ") and lines[i].strip() and items)
            ):
                if re.match(r"^\s*(?:[-*]|\d+\.)\s+", lines[i]):
                    items.append(re.sub(r"^\s*(?:[-*]|\d+\.)\s+", "", lines[i]).strip())
                else:
                    items[-1] += " " + lines[i].strip()
                i += 1
            tag = "ol" if ordered else "ul"
            out.append(f"<{tag}>" + "".join(f"<li>{inline(it)}</li>" for it in items) + f"</{tag}>")
            continue

        # Paragrafo
        if line.strip():
            buf = [line.strip()]
            i += 1
            while i < n and lines[i].strip() and not re.match(
                r"^(#{1,6}\s|\||```|>|---+$|\s*(?:[-*]|\d+\.)\s)", lines[i]
            ):
                buf.append(lines[i].strip())
                i += 1
            out.append(f"<p>{inline(' '.join(buf))}</p>")
            continue

        i += 1

    return "\n".join(out)


def read(name: str) -> str:
    """Le o documento descartando o titulo H1 (a pagina fornece o seu)."""
    text = (HERE / name).read_text(encoding="utf-8")
    return re.sub(r"^#\s+.*\n", "", text, count=1)


SECTIONS = [
    ("decisoes", "Decisões", "01", "adr.md"),
    ("dominios", "Domínios e diagramas", "02", "erd.md"),
    ("permissoes", "Permissões", "03", "permissions.md"),
    ("invariantes", "Invariantes", "04", "invariants.md"),
    ("estrutura", "Estrutura", "05", "folder-structure.md"),
    ("fases", "Fases", "06", "roadmap.md"),
]


# ------------------------------------------------------------------ pagina ---
# Numeros verificados contra o banco depois de aplicar as migrations e rodar a
# suite. Regerar com: psql -f docs/gen_stats.sql
STATS = [
    ("117", "tabelas", "com <code>tenant_id</code> e RLS"),
    ("119", "policies", "isolamento por rede e unidade"),
    ("410", "chaves estrangeiras", "230 constraints <code>check</code>"),
    ("90", "triggers", "invariantes e auditoria"),
    ("78", "testes", "todos passando"),
]

HEAD = """<title>Fundação da Plataforma Clínica</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap">
<style>
:root {
  --ground: #f2f4f3;
  --surface: #ffffff;
  --surface-sunken: #eaeeec;
  --ink: #14201d;
  --ink-soft: #3d4b46;
  --muted: #66736e;
  --line: #d5dcd8;
  --line-strong: #b9c4bf;
  --accent: #a8500d;
  --accent-soft: #f4e7da;
  --structure: #0b6b5e;
  --structure-soft: #dceae7;
  --danger: #9a2c2c;

  --display: "Archivo", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --body: "Source Serif 4", ui-serif, Georgia, "Times New Roman", serif;
  --mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  --rail: 232px;
  --measure: 68ch;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --ground: #111815;
    --surface: #17201d;
    --surface-sunken: #131b18;
    --ink: #e7edea;
    --ink-soft: #c2ccc8;
    --muted: #8b9793;
    --line: #26312d;
    --line-strong: #3a4844;
    --accent: #e08a3c;
    --accent-soft: #2c2016;
    --structure: #5bbdae;
    --structure-soft: #142824;
    --danger: #e08585;
  }
}

:root[data-theme="dark"] {
  --ground: #111815;
  --surface: #17201d;
  --surface-sunken: #131b18;
  --ink: #e7edea;
  --ink-soft: #c2ccc8;
  --muted: #8b9793;
  --line: #26312d;
  --line-strong: #3a4844;
  --accent: #e08a3c;
  --accent-soft: #2c2016;
  --structure: #5bbdae;
  --structure-soft: #142824;
  --danger: #e08585;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--ground);
  color: var(--ink);
  font-family: var(--body);
  font-size: 17px;
  line-height: 1.62;
  -webkit-font-smoothing: antialiased;
}

.shell {
  display: grid;
  grid-template-columns: var(--rail) minmax(0, 1fr);
  gap: 0;
  max-width: 1320px;
  margin: 0 auto;
}

/* ------------------------------------------------------------------ rail -- */
.rail {
  position: sticky;
  top: 0;
  align-self: start;
  height: 100vh;
  overflow-y: auto;
  padding-block: 40px 32px;
  padding-inline: 20px 16px;
  border-right: 1px solid var(--line);
}

.rail-mark {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 26px;
}

.rail nav { display: flex; flex-direction: column; gap: 2px; }

.rail a {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 8px;
  align-items: baseline;
  padding: 7px 8px;
  border-radius: 3px;
  text-decoration: none;
  color: var(--ink-soft);
  font-family: var(--display);
  font-size: 14px;
  font-weight: 500;
  transition: background .15s, color .15s;
}
.rail a:hover { background: var(--surface-sunken); color: var(--ink); }
.rail a.is-current { background: var(--structure-soft); color: var(--ink); }
.rail a span { font-family: var(--mono); font-size: 11px; color: var(--muted); }
.rail a.is-current span { color: var(--structure); }

.rail-foot {
  margin-top: 26px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  font-family: var(--mono);
  font-size: 11px;
  line-height: 1.7;
  color: var(--muted);
}

/* --------------------------------------------------------------- content -- */
main { min-width: 0; padding-block: 40px 96px; padding-inline: 40px; }

.masthead { border-bottom: 2px solid var(--ink); padding-bottom: 26px; }

.eyebrow {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

h1 {
  font-family: var(--display);
  font-weight: 700;
  font-size: clamp(32px, 4.6vw, 50px);
  line-height: 1.04;
  letter-spacing: -0.022em;
  margin: 12px 0 0;
  text-wrap: balance;
}

.standfirst {
  max-width: var(--measure);
  margin: 14px 0 0;
  font-size: 19px;
  color: var(--ink-soft);
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1px;
  margin-top: 30px;
  background: var(--line);
  border: 1px solid var(--line);
}
.stat { background: var(--ground); padding: 14px 16px; }
.stat b {
  display: block;
  font-family: var(--display);
  font-size: 27px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.stat i {
  display: block;
  font-family: var(--display);
  font-style: normal;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-soft);
}
.stat em {
  display: block;
  font-style: normal;
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}
.stat code { font-size: 11px; }

section { padding-top: 62px; scroll-margin-top: 20px; }

.section-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  border-bottom: 1px solid var(--line-strong);
  padding-bottom: 8px;
  margin-bottom: 26px;
}
.section-head b {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--accent);
  font-weight: 500;
}
.section-head h2 {
  font-family: var(--display);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.018em;
  margin: 0;
}

main h3 {
  font-family: var(--display);
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.012em;
  line-height: 1.22;
  margin: 46px 0 12px;
  text-wrap: balance;
  max-width: var(--measure);
}
main h4 {
  font-family: var(--display);
  font-size: 16px;
  font-weight: 600;
  margin: 30px 0 8px;
  max-width: var(--measure);
}
main h5 {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 24px 0 6px;
}

main p, main ul, main ol, main blockquote { max-width: var(--measure); }
main p { margin: 0 0 14px; }
main ul, main ol { margin: 0 0 16px; padding-left: 20px; }
main li { margin-bottom: 7px; }
main li::marker { color: var(--structure); }

main hr {
  border: 0;
  border-top: 1px solid var(--line);
  margin: 40px 0 0;
}
/* A regra ja separa; o titulo seguinte nao precisa somar a propria margem. */
main hr + h3 { margin-top: 26px; }

blockquote {
  margin: 0 0 18px;
  padding: 12px 16px;
  background: var(--structure-soft);
  border-left: 3px solid var(--structure);
  font-size: 15px;
  color: var(--ink-soft);
}

a { color: var(--structure); text-decoration-thickness: 1px; text-underline-offset: 2px; }

code {
  font-family: var(--mono);
  font-size: 0.86em;
  background: var(--surface-sunken);
  padding: 1px 5px;
  border-radius: 3px;
  color: var(--ink-soft);
}

strong { font-weight: 600; color: var(--ink); }

/* ----------------------------------------------------------- tabelas ------ */
.table-scroll, .code-scroll {
  overflow-x: auto;
  margin: 0 0 22px;
  border: 1px solid var(--line);
  background: var(--surface);
}
table { border-collapse: collapse; width: 100%; font-size: 14px; }
thead th {
  font-family: var(--display);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--muted);
  background: var(--surface-sunken);
  padding: 9px 12px;
  white-space: nowrap;
  border-bottom: 1px solid var(--line-strong);
}
tbody td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
  vertical-align: top;
}
tbody tr:last-child td { border-bottom: 0; }
tbody tr:hover td { background: var(--surface-sunken); }
td code { background: transparent; padding: 0; color: var(--structure); }

.code-scroll pre { margin: 0; padding: 16px; }
.code-scroll code {
  background: transparent;
  padding: 0;
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--ink-soft);
  white-space: pre;
}

pre.mermaid {
  background: var(--surface);
  border: 1px solid var(--line);
  padding: 18px;
  margin: 0 0 24px;
  overflow-x: auto;
  text-align: center;
}

:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}

/* ------------------------------------------------------------- estreito --- */
@media (max-width: 900px) {
  .shell { grid-template-columns: 1fr; }
  .rail {
    position: static;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--line);
    padding-inline: 20px;
  }
  .rail nav { flex-direction: row; flex-wrap: wrap; gap: 4px; }
  .rail a { grid-template-columns: auto auto; padding: 6px 10px; border: 1px solid var(--line); }
  .rail-foot { display: none; }
  main { padding-inline: 20px; }
  body { font-size: 16px; }
}
</style>"""


def build() -> str:
    rail_links = "".join(
        f'<a href="#{sid}" data-target="{sid}"><span>{num}</span>{label}</a>'
        for sid, label, num, _ in SECTIONS
    )
    stats = "".join(
        f"<div class='stat'><b>{value}</b><i>{label}</i><em>{note}</em></div>"
        for value, label, note in STATS
    )
    body = "".join(
        f'<section id="{sid}"><div class="section-head"><b>{num}</b><h2>{label}</h2></div>'
        f"{convert(read(fname))}</section>"
        for sid, label, num, fname in SECTIONS
    )

    return f"""{HEAD}
<div class="shell">
  <aside class="rail">
    <div class="rail-mark">CRM · odonto + HOF</div>
    <nav aria-label="Seções">{rail_links}</nav>
    <div class="rail-foot">
      PostgreSQL 16<br>
      SQL versionado<br>
      RLS forçado<br>
      78 testes verdes
    </div>
  </aside>

  <main>
    <header class="masthead">
      <div class="eyebrow">Arquitetura e modelagem · v2</div>
      <h1>Fundação da Plataforma Clínica</h1>
      <p class="standfirst">
        Modelo de dados, decisões estruturais e regras de negócio de um CRM/ERP
        multi-rede para clínicas de odontologia e harmonização facial. O schema
        deste documento foi aplicado num PostgreSQL de verdade e as invariantes
        foram testadas — os números abaixo saíram do catálogo do banco, não de
        uma estimativa.
      </p>
      <div class="stats">{stats}</div>
    </header>
    {body}
  </main>
</div>

<script>
(function () {{
  var links = Array.prototype.slice.call(document.querySelectorAll('.rail a'));
  var sections = links
    .map(function (a) {{ return document.getElementById(a.dataset.target); }})
    .filter(Boolean);

  function mark() {{
    var current = sections[0];
    for (var i = 0; i < sections.length; i++) {{
      if (sections[i].getBoundingClientRect().top <= 120) current = sections[i];
    }}
    links.forEach(function (a) {{
      a.classList.toggle('is-current', a.dataset.target === current.id);
    }});
  }}

  mark();
  window.addEventListener('scroll', mark, {{ passive: true }});
}})();
</script>"""


if __name__ == "__main__":
    sys.stdout.write(build())
