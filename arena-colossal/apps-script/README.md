# Agenda do Google ligada ao site — sem servidor, sem credencial

O site é um arquivo HTML. Ele não pode guardar a chave do Google: qualquer
visitante baixa o arquivo inteiro e lê o que estiver lá dentro. Uma chave no
site é uma chave pública, e quem a copiasse passaria a **criar, ler e apagar
compromissos da agenda da Arena**.

A solução aqui inverte o problema: em vez de o site ter acesso à agenda, um
script roda **dentro da própria conta Google da Arena** e recebe pedidos do
site. Quem autoriza é você, uma vez. Nenhuma chave sai do Google.

```
site (HTML)  ──POST──►  Apps Script (na conta da Arena)  ──►  Google Agenda
                                     │
                                     └──►  e-mail para você e para o cliente
```

O que você ganha:

- os horários que aparecem no site são os **reais**, já descontando a agenda
- o agendamento **cria o evento** direto no Google Agenda
- a tela final diz **"Agendamento confirmado"** em vez de "pedido pronto"
- você e o cliente recebem **e-mail automático**
- o cliente confirma pelo WhatsApp em **um toque**, com a mensagem pronta
- custo: **zero**

---

## Publicar — 10 minutos, tudo no navegador

**1.** Entre em <https://script.google.com> com a conta Google da Arena
(a mesma que é dona da agenda). → **Novo projeto**.

**2.** Apague o conteúdo do editor e cole tudo do arquivo `Codigo.gs` que
está nesta pasta. Dê um nome ao projeto: `Agenda Arena Colossal`.

**3.** Confira o bloco `CFG` no topo. O horário de atendimento, as durações
dos serviços e o endereço já vêm preenchidos — ajuste se a operação real for
diferente. Se a agenda dos atendimentos não for a principal da conta, troque
`CALENDARIO: 'primary'` pelo ID dela (na agenda: *Configurações > Integrar
agenda > ID da agenda*).

**4.** Antes de publicar, teste: no seletor de função escolha **`testar`** e
clique em **Executar**. O Google vai pedir autorização — é aqui que você
concede, uma vez. Aceite. Na tela de aviso de "app não verificado", use
*Avançado > Acessar (não seguro)*: o app é seu, feito por você, não está
publicado para terceiros.

O log deve mostrar o nome da sua agenda e os horários livres de um dia.

**5.** **Implantar > Nova implantação** → engrenagem → **App da Web**:

| Campo | Valor |
| --- | --- |
| Descrição | `Agenda do site` |
| Executar como | **Eu** (a conta da Arena) |
| Quem pode acessar | **Qualquer pessoa** |

> "Qualquer pessoa" assusta, mas é necessário: o visitante do site não tem
> conta Google nem deveria precisar de uma para agendar. O que ele pode fazer
> é só o que o script aceita — nada além disso. Veja "Segurança" abaixo.

**6.** Copie a **URL do app da Web** (termina em `/exec`) e cole no site, no
bloco `CONFIG`:

```js
agendaUrl: 'https://script.google.com/macros/s/AKfy....../exec',
```

**7.** Abra o site e faça um agendamento de teste. O evento tem que aparecer
na sua agenda com o prefixo `[SITE]`, e o e-mail tem que chegar.

> **Sempre que mudar o `Codigo.gs`**: *Implantar > Gerenciar implantações >
> lápis > Versão: Nova versão > Implantar*. A URL continua a mesma. Se você
> criar uma implantação nova em vez de editar, a URL muda e o site para de
> achar a agenda.

---

## Segurança — o que está protegido e o que não está

**Protegido.** O script nunca devolve a sua agenda. A rota de
disponibilidade responde apenas "livre" ou "ocupado" por horário — título,
participantes e descrição dos seus outros compromissos não saem de lá. A
rota de acompanhamento só responde sobre eventos que o próprio site criou
(prefixo `[SITE]`) e não devolve nome, telefone nem e-mail de ninguém: o
identificador circula por e-mail e barra de endereço, e não pode virar chave
de acesso a dado pessoal.

Antes de escrever qualquer coisa na agenda, o script confere: serviço
conhecido, data dentro da janela, horário dentro do expediente, antecedência
mínima respeitada, conflito na agenda, formato de cada campo, e um limite de
pedidos por e-mail por dia. Há uma trava (`LockService`) para dois pedidos no
mesmo instante não virarem dois eventos no mesmo horário.

**Não protegido, e é honesto dizer.** A URL é pública. Quem a descobrir pode
mandar pedidos válidos e ocupar horários de propósito. Não existe segredo
possível dentro de um site estático — qualquer chave que o navegador use, o
visitante lê. O que existe é o custo: o evento nasce marcado `[SITE]`, você
vê tudo na agenda e apagar custa dois toques. Para uma estética automotiva
isso é proporcional. Se um dia virar problema, o caminho é o backend próprio
que já está neste repositório (pasta `arena-colossal/`), com Turnstile e
limite por IP.

---

## O que este desenho **não** faz

**Mensagem automática de WhatsApp enviada pelo sistema.** O Apps Script não
manda WhatsApp. O que o site faz é abrir a conversa com a confirmação já
escrita, e o cliente toca uma vez para enviar — chega na sua conversa com
serviço, data, horário e veículo.

Envio 100% automático exigiria a WhatsApp Cloud API da Meta, e aí esbarra num
detalhe prático: registrar o `47 99222-8325` na Cloud API **tira esse número
do aplicativo WhatsApp Business**, e é justamente o número que o cliente
clica no site. Precisaria de um segundo chip. Minha recomendação é ficar com
o toque único do cliente, que resolve o mesmo problema sem custo.

**Cancelar ou remarcar pelo site.** Hoje isso é feito na conversa. Dá para
acrescentar depois.
