# Versão 2 — arena-colossal-v2.html

Mesma Arena, outra conversa. A v1 apresenta o serviço; a v2 leva ao
agendamento. É uma página só, sem rotas, sem diagnóstico, sem FAQ: hero,
três afirmações, três provas, as dez linhas de serviço, o formulário e o
rodapé.

O motor é o mesmo. Catálogo, utilidades, grade de horários e o formulário
de cinco passos são copiados dos blocos da v1 na montagem, sem fork. Mudou
o preço, o horário ou o texto de um serviço na v1, basta remontar.

## Como remontar

```
node v2/construir.mjs    # monta arena-colossal-v2.html
node v2/fallback.mjs     # grava o conteúdo estático (rodapé, links)
```

Os dois, nessa ordem, sempre. `construir.mjs` sobrescreve o arquivo inteiro,
então o `fallback.mjs` precisa rodar depois para o site continuar legível sem
JavaScript.

## O que é da v2 e o que vem da v1

| Vem daqui | Vem da v1 |
| --- | --- |
| `template.html` — marcação e CSS | fontes, logo, favicon, vídeo e pôster |
| `boot.js` — rodapé, nav, revelação | as dez fotos de serviço |
| `Anton-latin.woff2` — título | `CONFIG`, catálogo e textos |
| | grade de horários e agendamento |

`TEXTOS`, em `construir.mjs`, corrige as duas frases da v1 que apontavam para
coisas que a v2 não tem (a ferramenta de diagnóstico e a rota de
acompanhamento). Se a v1 reescrever essas frases, a montagem falha dizendo
qual delas mudou — de propósito, para ninguém publicar um link morto.

## Avaliações do Google

A seção de reputação lê o perfil real: nota, total e até cinco avaliações. O
mesmo endereço do Apps Script serve as duas coisas, muda só a rota — o
`boot.js` monta `?rota=avaliacoes` a partir do `CONFIG.agendaUrl`, então não há
um segundo endereço para configurar.

Sem a rota respondendo, a seção mostra o estado honesto com link para o
perfil. Nenhum depoimento é escrito no arquivo, nem como exemplo.

O `fallback.mjs` grava `#revBox` **sempre** nesse estado honesto, mesmo quando
a rota está ligada: avaliação congelada no HTML envelhece, e sem JavaScript o
certo é mandar para a fonte. Com JavaScript o renderizador limpa o bloco e
põe os dados de agora.

Como ligar a chave da Places API: `arena-colossal/apps-script/README.md`.

## Endpoint da agenda

`CONFIG.agendaUrl` fica **vazio** no repositório, que é público. O endereço do
Apps Script é preenchido só no arquivo entregue. Ver
`arena-colossal/apps-script/README.md`.

## Antes de publicar

```
node v2/construir.mjs && node v2/fallback.mjs
```

e confira: sem JavaScript o rodapé aparece e os botões de WhatsApp têm href;
com JavaScript o rodapé não duplica.
