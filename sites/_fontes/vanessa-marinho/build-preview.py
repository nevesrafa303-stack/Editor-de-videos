"""Gera um HTML único (tudo embutido) para visualizar o site sem servidor.
Uso: python3 build-preview.py <pasta-do-site> <arquivo-saida.html>"""
import base64, os, re, sys

root, out = sys.argv[1], sys.argv[2]
MIME = {".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2"}
cache = {}

def uri(rel):
    if rel not in cache:
        data = open(os.path.join(root, rel), "rb").read()
        cache[rel] = f"data:{MIME[os.path.splitext(rel)[1]]};base64," + base64.b64encode(data).decode()
    return cache[rel]

html = open(os.path.join(root, "index.html")).read()
css = open(os.path.join(root, "assets/css/style.css")).read()
css = re.sub(r"url\(\.\./fonts/([^)]+)\)", lambda m: "url(" + uri("assets/fonts/" + m.group(1)) + ")", css)

js = open(os.path.join(root, "assets/js/main.js")).read()
names = re.findall(r"\b[ad]: '([\w-]+-(?:720|1280))'", js)
imgs = "const IMGS={" + ",".join(f'"{n}":"{uri("assets/img/" + n + ".webp")}"' for n in dict.fromkeys(names)) + "};\n"
js = imgs + js.replace("'assets/img/' + c.d + '.webp'", "IMGS[c.d]").replace("'assets/img/' + c.a + '.webp'", "IMGS[c.a]")
vendor = "".join(open(os.path.join(root, "assets/vendor", f)).read() + "\n" for f in ["gsap.min.js", "ScrollTrigger.min.js", "lenis.min.js"])

html = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>\n', "", html)
html = re.sub(r'<link rel="(preload|manifest|apple-touch-icon)"[^>]*>\n', "", html)
html = html.replace('href="favicon.svg"', 'href="' + uri("favicon.svg") + '"')
html = html.replace('<link rel="stylesheet" href="assets/css/style.css">', "<style>" + css + "</style>")
html = html.replace('<script src="assets/js/boot.js"></script>', "<script>" + open(os.path.join(root, "assets/js/boot.js")).read() + "</script>")
html = re.sub(r'(<script src="assets/[^"]+" defer></script>\n)+', lambda m: "<script>" + vendor + "</script>\n<script>" + js + "</script>\n", html)
html = re.sub(r'\ssrcset="([^"]*)"', lambda m: ' srcset="' + m.group(1).split(",")[0].split(" ")[0] + '"', html)
html = re.sub(r'\ssizes="[^"]*"', "", html)
html = re.sub(r'(src|srcset|data-img)="(assets/img/[^"]+)"', lambda m: f'{m.group(1)}="{uri(m.group(2))}"', html)
html = html.replace('href="privacidade.html"', 'href="#"')
left = [l.strip()[:90] for l in html.split("\n") if "assets/" in l and "og.jpg" not in l and "apple-touch" not in l]
assert not left, left
open(out, "w").write(html)
print(f"{out}: {os.path.getsize(out)/1e6:.2f} MB")
