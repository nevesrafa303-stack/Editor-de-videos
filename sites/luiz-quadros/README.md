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
- Celular: Desempenho 98 · Acessibilidade 100 · Boas práticas 100 · SEO 100 (LCP 2,5 s · TBT 60 ms · CLS 0)
- Desktop: Desempenho 100 · Acessibilidade 100 · Boas práticas 100 · SEO 100

## O que tem (v4 — inteligência imobiliária)
- **Posicionamento**: o corretor do m² mais valorizado do Brasil. Dados reais do Índice FipeZAP
  (Itapema: R$ 15.403/m² em ago/2026, 2º de 56 cidades, +4,97% em 12 meses; 1º lugar em mai–jun/2026).
  **Atualize os números todo mês** (hero, faixa, gráfico, cartões, guia em PDF e og-src.html).
- **Hero**: o valor do m² como peça gráfica atrás do recorte do Luiz, cartão de indicador e faixa de
  cotações estilo mercado financeiro. Ao rolar, a cena recua e o número cresce.
- **Mercado**: gráfico animado do ranking do m² (top 5, jun/2026) e indicadores que contam.
- **Resultados**: R$ 130 milhões preso à rolagem + linha do tempo das conquistas com fotos reais.
- **Método como dossiê**: cinco folhas de documento que se empilham e recebem carimbo "Conferido".
- **Simulador** de fluxo com referência de valorização real.
- **Guia do Investidor (PDF real, 6 páginas)** em `assets/guia-investidor-luiz-quadros.pdf`, gerado de
  `../_fontes/luiz-quadros/guia-src.html` com `node render-guia.mjs`. Livro 3D que gira com a rolagem.
- Reconhecimentos em tela cheia, região com dados, sobre com compromissos, dúvidas e montador de mensagem.
- Tipografia: Schibsted Grotesk + Geist Mono (dados).

## Imagens ilustrativas (Higgsfield)
Foram geradas 6 imagens (orla, baía, interior, obra, chaves, maquete) na conta Higgsfield. A rede do
ambiente de criação bloqueou o download; para trazê-las, rode numa rede liberada:
`../_fontes/luiz-quadros/importar-imagens-ia.sh` (gera `assets/img/ia-*.webp`).

## Fotos
Imagens em `assets/img/` (WebP em mais de um tamanho). Fotos tratadas em JPG em
`../_fontes/luiz-quadros/fotos-tratadas/`, recortadas dos posts do Instagram; os recortes sem fundo
(`*-recorte.png`) foram gerados com rembg (modelo birefnet-portrait). Para ainda mais nitidez,
substitua pelos arquivos originais do ensaio (mesmos nomes) e regere os WebP.
