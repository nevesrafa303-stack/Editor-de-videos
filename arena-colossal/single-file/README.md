# Arena Colossal — site completo em arquivo único

`arena-colossal.html` é o site inteiro: **todas as páginas, todo o CSS, todo o
JavaScript, a logo e as duas fontes** dentro de um arquivo de ~440 KB.

Abre com dois cliques, funciona **sem internet** e não faz **uma única
requisição a terceiros** — nem para o Google Fonts.

A paleta vem da logo da Arena: o laranja do letreiro (`--laranja #ff9500`), o
azul do anel (`--azul #02abff`) e o azul-marinho do fundo do emblema
(`--azul-fundo #132f83`). A própria logo está embutida em base64 e reaparece
na navbar, no preloader, no rodapé, no favicon e como marca d'água das
molduras de foto.

```
#/                         home (15 seções)
#/servicos                 catálogo
#/servico/<slug>           uma página por serviço (10)
#/agendamento              formulário em 5 etapas
#/acompanhar/<id>          acompanhamento do horário
#/privacidade              política de privacidade
qualquer outra             404 com caminho de volta
```

A home é HTML estático — o Google indexa no primeiro byte. As demais páginas
são montadas pelo roteador por hash.

### Abre mesmo com o JavaScript bloqueado

Visualizadores de arquivo, modos de leitura e políticas de CSP bloqueiam
script. Se a página dependesse de JS para aparecer, o arquivo abriria preto.
Ela não depende:

- **A home inteira está no HTML** — as quinze seções, os dez serviços, o
  processo, o FAQ, a navegação e o rodapé. O JS reassume esses blocos ao
  iniciar (cada render limpa o container antes de montar), nunca duplica.
- **O preloader tem três saídas independentes**: o JS remove o nó; sem JS a
  classe `.js` nunca entra no `<html>` e ele não chega a ser exibido; e uma
  animação CSS o retira sozinha caso algo trave no meio.
- **As revelações por scroll só escondem quando há JS para revelá-las** —
  os seletores `[data-rev][data-vis="false"]` estão sob `.js`.
- **Menu, pontos de inspeção e comparador funcionam sem JS.** O menu é um
  checkbox escondido com `<label>`; os seis pontos são radios de um mesmo
  grupo (as setas do teclado navegam de graça); o comparador antes/depois
  varre sozinho, porque `--pos` é registrada com `@property` e por isso pode
  ser animada. Com JavaScript o controle volta a ser do visitante.
- **Diagnóstico e agendamento não fingem funcionar** sem JS: no lugar do
  formulário aparece a explicação de por que ele precisa do navegador.

Sem JavaScript a página entrega ~97% da altura e todo o conteúdo de texto.
O que se perde é o que é interativo por natureza: agenda, diagnóstico,
comparador antes/depois, hotspots e menu mobile.

> **Mudou o `CONFIG`? Regenere.** Esse HTML estático é a saída dos mesmos
> renderizadores que leem o `CONFIG` — WhatsApp, endereço, horário, imagens,
> avaliações. Depois de editar, rode:
>
> ```bash
> node single-file/regenerar-fallback.mjs
> ```
>
> Ele abre o arquivo num Chromium, deixa o JavaScript montar a home e grava
> de volta o resultado — inclusive o link de cada botão de WhatsApp. Nada é
> escrito à mão, então o estático nunca diverge do dinâmico. Precisa do
> Playwright (`npm i -D playwright && npx playwright install chromium`), que é
> ferramenta de build: o arquivo entregue não depende de nada disso.

---

## Configuração

Tudo num bloco só, no início do JavaScript (`const CONFIG`).

| Campo | O que acontece se ficar vazio |
| --- | --- |
| `whatsapp` | **Todo botão de WhatsApp some do site.** Já preenchido: `5547992228325`. |
| `endereco`, `lat`, `lng` | O site mostra só a cidade e troca o mapa pela foto de fachada. Nada de endereço inventado. |
| `googlePlaceId` | Sem link direto para o perfil e para as avaliações. |
| `horarios` | O agendamento avisa que a agenda não está configurada. |
| `imagens` | Todas as molduras ficam no placeholder técnico — e o navegador **não dispara nenhuma requisição**. |
| `apiBase` | O agendamento entrega o pedido pelo WhatsApp (ver abaixo). |
| `avaliacoesEndpoint` | A seção mostra um estado honesto com link para o Google. |

### Imagens

Crie uma pasta `images/` ao lado do HTML e **liste em `CONFIG.imagens` o que
você colocou lá**:

```js
imagens: ['hero.jpg', 'polimento-tecnico.jpg', 'caso-01-antes.jpg'],
```

Nomes esperados: `hero.jpg`, `detalhes.jpg`, `fachada.jpg`,
`caso-0N-antes.jpg` / `caso-0N-depois.jpg` (N = 1..3) e um por serviço com o
mesmo nome do slug (`lavagem-tecnica.jpg`, `vitrificacao.jpg`…).

Atalho: `imagens: 'auto'` tenta carregar tudo (e aceita os 404 no console).

---

## Agenda conectada ao Google Calendar e ao WhatsApp

### Por que não dá para fazer isso só com este arquivo

Chave da Google Calendar API, client secret e token do WhatsApp **não podem
morar aqui**. Este HTML é baixado inteiro por qualquer visitante: uma
credencial no código é uma credencial pública, e quem copiar passa a **criar,
ler e apagar compromissos da agenda da Arena**.

Quem guarda credencial é servidor. Por isso existe o `apiBase`.

### Sem backend (`apiBase: null`) — funciona hoje

O formulário completo continua: serviço, dia, horário, dados, conferência. No
fim, monta a mensagem com tudo preenchido e envia pela conversa do WhatsApp.

A tela final diz **"Pedido pronto para enviar"**, nunca "reservado" — o site
não finge ter reservado o que não reservou. Os horários exibidos são os de
atendimento, com aviso de que a disponibilidade real vem no contato.

### Com backend (`apiBase: 'https://api.seudominio.com.br'`)

Aponte para o backend que já está neste repositório, na pasta `arena-colossal/`
(Next.js + Prisma + Google Calendar + Resend + WhatsApp Cloud API). Ele expõe
exatamente as rotas que este arquivo consome:

| Rota | Papel |
| --- | --- |
| `GET /api/availability?date&service` | grade do dia cruzando banco **e** `freeBusy` do Google Calendar |
| `POST /api/bookings` | reserva em transação serializável (barra reserva dupla), cria o evento no Calendar, avisa o WhatsApp da equipe e dispara os e-mails |
| `POST /api/bookings/confirm` | estado do agendamento para a página de acompanhamento |

Com isso ligado, a tela final passa a dizer **"Agendamento confirmado"**,
oferece o `.ics` e o link de acompanhamento.

O backend precisa liberar CORS para o domínio onde este HTML estiver hospedado.

### Avaliações do Google

A Places API exige chave — e chave no frontend é chave vazada. Aponte
`avaliacoesEndpoint` para uma rota **do seu backend** que consulta o Google e
devolve:

```json
{ "nota": 4.9, "total": 127,
  "avaliacoes": [{ "autor": "Nome", "nota": 5, "data": "2026-03-12", "texto": "..." }] }
```

Todo texto que chega daí entra na página por `textContent`, nunca como HTML:
uma avaliação é conteúdo de terceiro e não pode virar script rodando no site
da Arena.

---

## Segurança implementada aqui

- **Nenhuma credencial no arquivo** — a fronteira é o `apiBase`.
- **Escape de tudo que é externo** — CONFIG, URL e respostas de API.
- **Honeypot** no formulário: campo invisível que só robô preenche.
- **Validação completa no cliente** — e a do servidor continua sendo a que vale.
- **Zero requisição a terceiros**: fontes embutidas, mapa só com `loading="lazy"`,
  analytics apenas se você informar os IDs.
- **`rel="noopener noreferrer"`** em todo link externo.
- A página de acompanhamento **não mostra nome, telefone nem e-mail**: o
  identificador circula por e-mail e barra de endereço e não pode virar chave
  de acesso a dado pessoal.

## Acessibilidade

Funciona sem JavaScript (acima), hierarquia semântica de headings, `alt` em toda imagem, foco visível, menu
fullscreen com foco preso e fechamento por `Esc`, comparador antes/depois
operável por teclado (é um `<input type="range">` real), FAQ em `<details>`
nativo, campos com `aria-invalid` e `aria-describedby`, e
`prefers-reduced-motion` respeitado em todas as animações.

## O que ainda depende de você

- [x] `CONFIG.whatsapp` — `5547992228325`.
- [x] `CONFIG.email` — `edinelson.yeshua@gmail.com` (Gmail pessoal; vale trocar
      por um endereço no domínio da Arena quando ele existir).
- [ ] Horário real de atendimento e as durações de cada serviço (`SERVICOS[].min`).
- [ ] Endereço, quando existir.
- [ ] Fotos reais (`images/` + `CONFIG.imagens`).
- [ ] Revisar os textos de marca: `PADROES`, `PUBLICO`, `FAQ` e os campos
      `etapas` / `indicado` / `naoResolve` de cada serviço. Nada inventa preço,
      prazo ou garantia — mas tudo fala em nome da Arena. O FAQ vira dado
      estruturado no Google: resposta errada ali é resposta errada na busca.
- [ ] Backend, para a agenda conectada de verdade.
