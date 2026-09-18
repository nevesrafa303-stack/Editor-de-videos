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

## 1. De onde veio o conteúdo

Todo o texto desta página foi extraído do site publicado em
`draconsuelovasconcelos.com.br`: a bio, a missão, os 8 procedimentos com as
descrições originais, as 3 dúvidas frequentes, o endereço, o horário, o
telefone e o CRO-SC 25523. A paleta foi amostrada pixel a pixel dos prints do
site (ver seção 5).

### 1.1 O que ainda falta — `assets/js/config.js`

Os campos marcados `// ⚠️ CONFIRMAR` são os que não apareciam nos prints:

| Campo | Situação |
|---|---|
| `redes.instagram` | Chutei `@draconsuelovasconcelos` — **confirme o @ real** |
| `redes.facebook` `.youtube` `.pinterest` `.tiktok` | O site atual tem os ícones, mas as URLs não apareciam. `null` esconde o ícone |
| `email` | Não aparece no site atual. `null` faz o item sumir da página inteira |

O mapa já está configurado e aponta para o estabelecimento real:

| Campo | Para que serve |
|---|---|
| `endereco.mapaEmbed` | Desenha o mapa embutido, sem chave de API. A busca é pelo **nome do consultório** — é isso que faz o Google mostrar o card com nome, endereço e nota, em vez de um pin solto |
| `endereco.mapaLink` | Link curto oficial de compartilhamento da ficha (`maps.app.goo.gl/m1uq5LL771gd7M6t7`). Abre direto no app do Maps, no celular. É o destino do botão "Ver no Google Maps" e do botão "Ler as avaliações no Google" |
| `endereco.mapaCanonico` | A mesma ficha na forma longa (CID `14717790678789036027`). Vai só nos dados estruturados (`schema.org/hasMap`), que preferem URL definitiva a encurtador |
| `endereco.rotaLink` | Traça a rota a partir de onde a pessoa estiver |

### 1.2 Horários

`horarios` é escrito em português e é lido duas vezes: aparece na página do
jeito que está e é traduzido automaticamente para os dados estruturados que o
Google usa na ficha do consultório. Então basta editar em um lugar.

O tradutor entende faixas (`Segunda a sábado`, `Segunda até sexta`,
`Sexta a segunda`, com ou sem `-feira`), listas (`Terça e quinta`),
`Todos os dias`, e horas escritas como `09h30 — 18h00` ou `08:00 às 19:00`.
Uma linha sem horário — `Domingo / Fechado` — aparece na página e fica de fora
dos dados estruturados, que é o comportamento correto: lá só entram os dias em
que há atendimento.

O identificador do lugar no Google Maps é
`ftid 0x94d8cde22e7f6527:0xcc4018a4e7c697fb` / CID `14717790678789036027`.

Se quiser controle exato do enquadramento do mapa, no Google Maps abra a ficha
do consultório → **Compartilhar** → **Incorporar um mapa** → copie só o endereço
de dentro de `src="..."` (começa com `https://www.google.com/maps/embed?pb=...`)
e cole em `endereco.mapaEmbed`. Os dois formatos funcionam.

O mapa é uma camada opcional: o cartão com endereço, referência, horários e os
botões de rota é montado primeiro e fica visível mesmo se o mapa não carregar.
Antes de inserir o iframe o site carrega uma imagem pequena do domínio do Maps
como sonda — sem ela, o mapa não entra e não sobra espaço vazio. Isso existe
porque o iframe do Google dispara `load` mesmo quando fica em branco.

Já conferidos e corretos: nome, CRO-SC 25523, WhatsApp (47) 98860-3900,
endereço na Hercílio Luz 642, horário de segunda a sábado 09h30–18h, cidade/UF.

### 1.2 Fotos — `assets/img/`

As fotos são reais e já estão no site. Os dois retratos tiveram o **fundo
removido de verdade** e são WebP com canal alfa — a figura inteira aparece,
sem moldura e sem borda comida.

O recorte está em `ferramentas/recorte.py`. O detalhe que o torna necessário:
o fundo de estúdio atrás dos ombros tem luminância **44** — exatamente a mediana
do cabelo dela. Nenhum limiar de cor separa os dois. A separação é feita por
**textura**: o fundo é liso (alta frequência p99 = 2), o cabelo é feito de fios
(p50 = 8, p90 = 27). Um pixel só é fundo quando é escuro E liso, e a varredura
parte das bordas por inundação, então o cabelo interno nunca é alcançado.

| Arquivo | Onde aparece |
|---|---|
| `consuelo-hero-*.webp` | Primeira dobra |
| `consuelo-sobre-*.webp` | "Afinal, quem sou eu?" |
| `clinica-*.webp` | Seção "A clínica" |
| `caso-labial-*.webp` | Seção "Resultados" |
| `og-capa.jpg` | Miniatura no WhatsApp, Instagram e Facebook |

Cada foto tem três larguras (`srcset`), então o celular baixa a menor e o
desktop a maior.

**Para trocar uma foto por outra**, a partir de `site/`:

```bash
python3 ferramentas/recorte.py originais/retrato-hero.jpg originais/retrato-hero.png
python3 ferramentas/fotos.py
```

O primeiro remove o fundo, o segundo enquadra, gera as três larguras e exporta
WebP preservando a transparência.

> **Limite conhecido:** o recorte funciona quando o sujeito tem contraste ou
> textura contra o fundo. Na foto de corpo inteiro ele falha — a calça preta,
> a sombra do chão e o fundo do estúdio têm a mesma luminância (25 contra 26) e
> a mesma textura, então saem todos juntos. Aquela foto precisa de recorte
> manual; por isso a chamada final não usa imagem.

> **Seção "Resultados":** a imagem é de uma paciente. Ela só pode ficar no ar
> com **termo de autorização de uso de imagem assinado** — é exigência do
> Código de Ética Odontológica, não formalidade. Para tirar do ar, apague a
> seção `<!-- CASO CLÍNICO -->` inteira do `index.html` e o link "Resultados"
> no rodapé.

### 1.3 Textos

Toda a copy está no `index.html`, em blocos comentados por seção. Nada foi
inventado: as frases são as do site atual. Os três selos da primeira dobra
(CRO, nota do Google, cidade) são fatos verificáveis, não estatísticas
estimadas.

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

**Seções** — primeira dobra, faixa de credenciais, "Afinal, quem sou eu?" com
"Paixão que virou carreira", missão "Cuidado que transforma" em 4 blocos, os 8
procedimentos, "O que muda na sua estética" (01/02/03), avaliações do Google,
as 3 dúvidas frequentes, chamada final, localização com formulário e rodapé.

**Scroll e movimento** — barra de progresso de leitura, cabeçalho que encolhe e
se esconde ao descer, revelação progressiva de cada bloco (IntersectionObserver),
animação palavra a palavra no título, parallax nas fotos, scrollspy destacando a
seção ativa no menu, medidor de progresso na seção da missão, faixa de
credenciais em rolagem infinita e botão de voltar ao topo.

**Interações** — acordeão de dúvidas com um item aberto por vez, menu mobile em
tela cheia e formulário que valida os campos e abre o WhatsApp com a mensagem já
montada (nome, procedimento escolhido, observação e telefone).

**Acessibilidade** — HTML semântico, um único `h1` com hierarquia correta, link
"pular para o conteúdo", foco visível, `alt` em todas as imagens, rótulo em todos
os campos, navegação completa por teclado, `prefers-reduced-motion` desligando
todas as animações e **contraste WCAG AA aprovado em 100% dos textos** (auditado
automaticamente em Chromium).

**SEO** — meta description, canonical, Open Graph, Twitter Card, JSON-LD
`schema.org/Dentist` com endereço e horário de funcionamento reais, `robots.txt`
e `sitemap.xml`.

**Responsivo** — layout fluido com `clamp()`, testado de 390px a 1440px, sem
rolagem horizontal. Também tem folha de impressão.

## 5. A paleta — de onde ela veio

As cores não foram escolhidas: foram **medidas nos prints do site publicado**,
amostrando os pixels de cada região da interface. O resultado é que o site é
genuinamente monocromático — o croma máximo medido nas áreas de interface foi
**4 de 255**, ou seja, cinza puro. A única cor da marca é o dourado do logo.

| Token | Cor | Onde foi medido |
|---|---|---|
| `--grafite` | `#121214` | Fundo do estúdio das fotos — com o token igual, o retrato funde com a página |
| `--carvao` | `#3A3A3A` | Fundo das seções escuras |
| `--chumbo` | `#5D5D5D` | Topo do gradiente dos cards |
| `--cinza` | `#6E6E6E` | O cinza dominante do site (`#888888`, 53% dos pixels), escurecido o suficiente para o texto branco passar em contraste |
| `--prata` | `#A5A5A5` | Base do gradiente dos cards e faixas claras |
| `--creme` | `#EBE7DB` | Branco quente do logo |
| `--ouro` | `#C9A96A` | Dourado do monograma e do bordado do jaleco |

O gradiente dos cards (`--grad-card`) reproduz o do site atual: escuro no canto
superior esquerdo, prata no inferior direito.

**Uma correção deliberada:** o cinza original `#888888` com texto branco dá
contraste de 3,5:1 — abaixo do mínimo legal de acessibilidade (4,5:1). Escureci
para `#6E6E6E`, que mantém o mesmo ar da marca e passa com folga. Se preferir o
tom exato do site atual, troque `--cinza` de volta e aceite a perda de
legibilidade.

### Tipografia

O site atual combina um **sans geométrico leve** nos títulos com um **serif
itálico de contraste alto** nos acentos de marca ("É posicionamento", "quem sou
eu?"). Reproduzi isso com **Montserrat 200/300** + **Playfair Display italic**,
carregadas do Google Fonts no `<head>`.

Para trocar qualquer cor ou fonte, edite as variáveis em `:root`, no topo de
`assets/css/style.css`.
