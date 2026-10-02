# Site — Luiz Quadros · Imóveis na Planta (Itapema e Porto Belo)

Site estático de alto desempenho. Publique **o conteúdo desta pasta** na raiz do domínio.

## Antes de publicar (obrigatório)
1. **WhatsApp**: em `assets/js/main.js`, preencha `CONFIG.whatsapp` (55 + DDD + número, só dígitos).
   Enquanto estiver vazio, os botões abrem o Direct do Instagram (@luizquadrosde) e copiam a mensagem.
2. **Domínio**: troque `https://www.luizquadros.com.br` pelo domínio real em `index.html`
   (canonical, og:url, og:image, JSON-LD), `robots.txt`, `sitemap.xml` e `.well-known/security.txt`.
3. **Rode o build** (abaixo) sempre que editar `main.js`, `style.css` ou `boot.js`.
4. **Confirmar com o Luiz**: textos da carta e dos compromissos, datas dos reconhecimentos,
   a frase sobre VGV divulgado pelo O Novo Imobiliário, autorização de uso das fotos
   (B.Balas e colegas na foto) e se o O Novo Imobiliário exige CRECI jurídico no rodapé.

## Build (gera os arquivos de produção)
```bash
cd ../_fontes/luiz-quadros
npm install
npm run build          # app.min.js, style.min.css, boot inline + hash na CSP
node render-og.mjs     # (opcional) refaz og.jpg e ícones a partir de og-src.html / icon-src.html
python3 build-preview.py ../../luiz-quadros ../../../entregas/luiz-quadros-preview.html   # prévia em arquivo único
```

## Meta Pixel (opcional, com consentimento — LGPD)
1. Preencha `CONFIG.metaPixelId` em `assets/js/main.js` e rode o build.
2. Libere a Meta na CSP (nos 4 lugares: `index.html`, `_headers`, `vercel.json`, `.htaccess`):
   - `script-src` → acrescente `https://connect.facebook.net`
   - `img-src` → acrescente `https://www.facebook.com`
   - `connect-src` → acrescente `https://www.facebook.com https://connect.facebook.net`
3. O aviso de privacidade aparece; o Pixel só carrega após "Aceitar". Todo clique de contato dispara `Contact`.

## Onde hospedar
- **Netlify / Cloudflare Pages**: arraste a pasta. Cabeçalhos em `_headers`.
- **Vercel**: importe a pasta. Cabeçalhos em `vercel.json`.
- **Hostinger / Locaweb / HostGator (Apache)**: envie para `public_html`. O `.htaccess` força HTTPS,
  aplica cabeçalhos, cache e compressão.

## Qualidade (Lighthouse 12, servidor com compressão)
- Celular: Desempenho 97 · Acessibilidade 100 · Boas práticas 100 · SEO 100 (LCP 2,5 s · TBT 50 ms · CLS 0)
- Desktop: Desempenho 100 · Acessibilidade 100 · Boas práticas 100 · SEO 100

## O que tem (v2)
- Tipografia Bodoni Moda (títulos, números) + Plus Jakarta Sans (texto), hospedadas localmente.
  Preto, ouro e marfim, sem linhas de fundo.
- **Hero fixado**: nome "Luiz Quadros" gigante atrás do recorte da foto; ao rolar, o nome se abre e a cena recua.
- **R$ 130 milhões**: palco fixado em que o número conta com a rolagem e a barra dourada enche.
- Faixa de credenciais cuja velocidade e inclinação acompanham a rolagem.
- Manifesto que acende palavra por palavra; **cartões da tese que se empilham** e recuam.
- **Método em rolagem horizontal** fixada, com contador de etapa e barra de progresso.
- **Reconhecimentos**: a foto cresce até ocupar a tela enquanto "Dois meses. / Dois títulos." se afastam.
- Sobre com recorte do retrato sobre disco dourado; compromissos, dúvidas, montador de mensagem.
- Abertura animada (contador "R$ 130 mi") só em telas grandes, uma vez por sessão.
- **Simulador de fluxo na planta** e **montador de mensagem** que geram texto pronto para o WhatsApp.
- No celular, os palcos fixados viram rolagem natural; com "reduzir movimento", tudo fica estático.
- Segurança (CSP com hash, HSTS etc.), SEO (Schema.org, OG, sitemap), acessibilidade e LGPD como na v1.

## Fotos
Imagens em `assets/img/` (WebP em mais de um tamanho). Fotos tratadas em JPG em
`../_fontes/luiz-quadros/fotos-tratadas/`, recortadas dos posts do Instagram; os recortes sem fundo
(`*-recorte.png`) foram gerados com rembg (modelo birefnet-portrait). Para ainda mais nitidez,
substitua pelos arquivos originais do ensaio (mesmos nomes) e regere os WebP.
