# Site — Dra. Consuelo Vasconcelos

Site institucional de página única, em **HTML + CSS + JavaScript puros**.
Sem build, sem framework, sem dependência de servidor: é só subir a pasta.

```
site/
├── index.html              ← a página inteira (conteúdo editável no HTML)
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/style.css       ← todo o design (tokens de cor, tipografia, componentes)
    ├── js/config.js        ← ⚠️ ÚNICO ARQUIVO OBRIGATÓRIO DE EDITAR
    ├── js/main.js          ← comportamento (scroll, carrossel, comparador, formulário)
    └── img/                ← imagens (placeholders SVG para substituir)
```

---

## 1. Antes de publicar — o que é obrigatório trocar

### 1.1 `assets/js/config.js`

Todos os dados de contato ficam num único objeto. Os pontos marcados com
`// ⚠️ TROCAR` **precisam** ser preenchidos com os dados reais:

| Campo | O que é |
|---|---|
| `cro` / `responsavelTecnico` | Nº de inscrição no Conselho — exigido pelo Código de Ética |
| `whatsapp` | Só dígitos, com DDI e DDD: `5585999998888` |
| `telefoneExibicao` | Como o número aparece escrito: `(85) 99999-8888` |
| `email` | E-mail de contato |
| `endereco.*` | Rua, bairro/cidade, CEP, link e embed do Google Maps |
| `redes.*` | URLs das redes. Deixe `null` para o ícone não aparecer |
| `cidade` / `uf` | Usados no SEO estruturado (schema.org) |

O site inteiro (links de WhatsApp, e-mail, mapa, rodapé, JSON-LD) lê daqui —
não é preciso caçar o número em vários lugares.

### 1.2 Fotos — `assets/img/`

As imagens atuais são **placeholders SVG** com o aviso "SUBSTITUA POR FOTO REAL".
Troque pelos arquivos reais mantendo os mesmos nomes (ou ajuste o `src` no HTML):

| Arquivo | Onde aparece | Proporção sugerida |
|---|---|---|
| `retrato-hero.svg` | Primeira dobra | retrato, 5:6.4 |
| `retrato-sobre.svg` | Seção "Sobre" | retrato, 4:5 |
| `clinica-01/02/03.svg` | Galeria da clínica | paisagem, 4:3 |
| `caso-antes.svg` / `caso-depois.svg` | Comparador de resultados | quadrado, 1:1 |
| `og-capa.svg` | Miniatura no WhatsApp/Facebook | 1200×630 |

Use `.webp` ou `.jpg` para fotos reais (melhor compressão). Exemplo:
`<img src="assets/img/retrato-hero.webp" ...>`.

> **Antes e depois:** o Código de Ética Odontológica restringe a divulgação de
> imagens de pacientes. Publique apenas casos com **termo de autorização de uso
> de imagem assinado** e mantenha o aviso de que resultados variam. Se preferir
> não publicar, remova a seção `#resultados` do `index.html` e o link
> correspondente no menu e no rodapé.

### 1.3 Textos

Toda a copy está escrita direto no `index.html`, em português, em blocos
comentados por seção. Os números da primeira dobra (`12+ anos`, `2.400+
atendimentos`, `98% de retorno`) estão no atributo `data-contador` — ajuste para
os números reais ou remova o bloco `.hero__provas`.

---

## 2. Como publicar

Qualquer hospedagem de arquivos estáticos serve. O conteúdo da pasta `site/`
vai para a raiz do domínio.

**Hospedagem tradicional (Hostinger, Locaweb, cPanel):** envie o conteúdo de
`site/` para `public_html/` via FTP ou pelo gerenciador de arquivos.

**Netlify / Vercel / Cloudflare Pages:** conecte o repositório, defina o
diretório de publicação como `site` e deixe o comando de build vazio.

**GitHub Pages:** publique a partir da branch escolhida, pasta `/site`.

Lembre de forçar **HTTPS** e o redirecionamento `www` → domínio principal
(ou o contrário) na hospedagem.

## 3. Ver localmente

```bash
cd site
python3 -m http.server 8080
# abra http://localhost:8080
```

Abrir o `index.html` direto pelo navegador (`file://`) também funciona, mas o
`config.js` carrega melhor por HTTP.

---

## 4. O que já está implementado

**Scroll e movimento** — barra de progresso de leitura, cabeçalho que encolhe e
se esconde ao descer, revelação progressiva de cada bloco (IntersectionObserver),
animação palavra a palavra no título, contadores animados, parallax nas fotos,
scrollspy destacando a seção ativa no menu, medidor de progresso na seção
"Método", faixa de credenciais em rolagem infinita e botão de voltar ao topo.

**Interações** — comparador antes/depois arrastável (mouse, toque e teclado),
carrossel de depoimentos com autoplay, setas, pontos, swipe e navegação por
setas do teclado, acordeão de dúvidas com um item aberto por vez, menu mobile
em tela cheia e formulário que valida os campos e abre o WhatsApp com a
mensagem já montada.

**Acessibilidade** — HTML semântico, um único `h1` com hierarquia correta,
link "pular para o conteúdo", foco visível, `alt` em todas as imagens, rótulos
em todos os campos, navegação completa por teclado e respeito total a
`prefers-reduced-motion` (todas as animações desligam).

**SEO** — meta description, canonical, Open Graph e Twitter Card, JSON-LD
`schema.org/Dentist` gerado a partir do `config.js`, `robots.txt` e `sitemap.xml`.

**Responsivo** — layout fluido com `clamp()`, testado de 390px a 1440px, sem
rolagem horizontal. Também tem folha de impressão.

---

## 5. Personalizar o design

As cores e a tipografia estão em `:root`, no topo do `assets/css/style.css`.
Trocar a paleta inteira é mudar essas variáveis:

```css
--ink:#101A17;    /* verde quase preto — fundos escuros */
--verde:#1B332C;  /* verde da marca */
--ouro:#C2A15E;   /* dourado — destaques e botões */
--areia:#F2EEE7;  /* off-white quente */
```

As fontes (**Fraunces** para títulos, **Manrope** para texto) vêm do Google
Fonts, carregadas no `<head>`. Para hospedar localmente e ganhar performance,
baixe os `.woff2`, coloque em `assets/fonts/` e troque o `<link>` por um
`@font-face`.
