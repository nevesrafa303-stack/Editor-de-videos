# Site — Dra. Vanessa Marinho

Site estático (HTML + CSS + JS, sem build). Publique **o conteúdo desta pasta** na raiz do domínio.

## Antes de publicar (obrigatório)
1. **WhatsApp** — em `assets/js/main.js`, preencha `CONFIG.whatsapp` com 55 + DDD + número (só dígitos).
   Enquanto estiver vazio, os botões abrem o Direct do Instagram.
2. **Domínio** — troque `https://www.dravanessamarinho.com.br` pelo domínio real em
   `index.html` (canonical, og:url, og:image, JSON-LD), `robots.txt` e `sitemap.xml`.
3. **CRO** — confirmar o número (o site usa CRO SC 26480; uma das fotos trazia CRO 12569).
4. **Autorizações** — confirmar a autorização por escrito de cada paciente das fotos.

## Onde hospedar
- **Netlify / Cloudflare Pages**: arraste a pasta. Os cabeçalhos de segurança vêm do `_headers`.
- **Vercel**: importe a pasta. Os cabeçalhos vêm do `vercel.json`.
- **Hostinger / Locaweb / HostGator (Apache)**: envie pelo gerenciador de arquivos para `public_html`.
  O `.htaccess` força HTTPS, aplica os cabeçalhos, cache e compressão.

## O que tem
- Scroll suave (Lenis) e animações guiadas pela rolagem (GSAP + ScrollTrigger), tudo hospedado no próprio site.
- Fontes (Newsreader + Geist + Geist Mono) hospedadas localmente — sem chamadas ao Google.
- Segurança: CSP sem nenhum script ou estilo externo/inline, HSTS, anti-clickjacking, nosniff, Permissions-Policy.
- SEO local: Schema.org `Dentist`, Open Graph, sitemap, robots, título e descrição com a cidade.
- Acessibilidade: navegação por teclado, abas com setas, "pular para o conteúdo",
  respeita "reduzir movimento" do sistema e funciona sem JavaScript.
- LGPD: sem cookies, sem rastreadores, página de privacidade.

## Trocar fotos
As imagens do site ficam em `assets/img/` (WebP, versões `-720` e `-1280`).
As fotos tratadas em JPG estão em `../_fontes/vanessa-marinho/fotos-tratadas/`.
Para substituir, gere o WebP com o mesmo nome (ex.: `cwebp -q 82 foto.jpg -o atendimento-1280.webp`).
