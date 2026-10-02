"""Gera um HTML único (tudo embutido) para visualizar o site sem servidor.
Uso: python3 build-preview.py ../../luiz-quadros ../../../entregas/luiz-quadros-preview.html"""
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
css = open(os.path.join(root, "assets/css/style.min.css")).read()
css = re.sub(r"url\(\.\./fonts/([^)]+)\)", lambda m: "url(" + uri("assets/fonts/" + m.group(1)) + ")", css)
js = open(os.path.join(root, "assets/js/app.min.js")).read()

html = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>\n', "", html)
html = re.sub(r'<link rel="(preload|manifest|apple-touch-icon)"[^>]*>\n', "", html)
html = html.replace('href="favicon.svg"', 'href="' + uri("favicon.svg") + '"')
html = html.replace('<link rel="stylesheet" href="assets/css/style.min.css">', "<style>" + css + "</style>")
html = html.replace('<script src="assets/js/app.min.js" defer></script>', "<script>" + js.replace("</script", "<\\/script") + "</script>")
html = re.sub(r'\ssrcset="([^"]*)"', "", html)
html = re.sub(r'\ssizes="[^"]*"', "", html)
html = re.sub(r'src="(assets/img/[^"]+)"', lambda m: f'src="{uri(m.group(1))}"', html)
html = html.replace('href="privacidade.html"', 'href="#"')
left = [l.strip()[:90] for l in html.split("\n") if "assets/" in l and "luizquadros.com.br" not in l]
assert not left, left
os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
open(out, "w").write(html)
print(f"{out}: {os.path.getsize(out)/1e6:.2f} MB")
