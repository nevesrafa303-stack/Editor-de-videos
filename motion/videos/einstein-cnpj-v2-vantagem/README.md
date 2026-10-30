# "Se você tem CNPJ, você tem uma vantagem" — Einstein no CNPJ, variação 2 (story 9:16, 51,2 s)

Segunda variação do anúncio do Einstein (a primeira é `../einstein-cnpj-milionario`), com copy diferente
para rodar em teste A/B no Meta Ads com formulário. A estrutura parte da mesma referência (vídeo UGC de
terceiros enviado pelo cliente; só a copy foi modelada, o vídeo não entra no motion). Sem logo de
corretora, para usar com vários clientes.

- **Ângulo:** oportunidade. A V1 quebra a crença ("o Einstein é só pra milionário?"); esta abre com
  um benefício exclusivo de quem tem CNPJ e trata o plano como algo que "quase ninguém usa".
- **Formato único: story 9:16 (1080×1920)**, informações no centro (nada nos 230 px de cima nem
  abaixo de 1536 px).
- **Gancho nos 3 primeiros segundos:** o quadro 0 já mostra "Se você tem CNPJ," e um cartão "SUA
  EMPRESA · CNPJ" com cadeado; no "vantagem" a trilha cai no drop, o cadeado abre com brilho e faíscas
  e aparece o selo "VANTAGEM LIBERADA".
- **CTA:** "Clica no link, preenche o formulário e descobre quanto fica pra você." → botão "Preencha o
  formulário / e descubra quanto fica pra você" e "Clique no link abaixo".

## Roteiro

| Tempo | Fala | Na tela |
|---|---|---|
| 0–4,5 s | "Se você tem CNPJ, você tem uma vantagem que quase ninguém usa." | cartão do CNPJ com cadeado que abre no "vantagem"; "VANTAGEM LIBERADA"; "vantagem" sublinhado em dourado |
| 4,5–9,3 s | "Dá pra ter um plano de saúde com o Einstein na rede… pagando bem menos do que você imagina." | fachada do Einstein com selo "Einstein na rede"; etiqueta "pagando bem menos do que você imagina" |
| 9,3–16,4 s | "O Einstein é o décimo sexto melhor hospital do mundo. E lá, uma diária de internação pode custar vinte mil reais." | "16º" rolando com louro, "MELHOR HOSPITAL DO MUNDO", fonte Newsweek 2026; conta "NO PARTICULAR · Diária de internação R$ 20.000" (mockup) |
| 16,4–32,2 s | "Mas pelo CNPJ, olha só: uma pessoa de trinta anos… na Alice. Um casal… na Amil. E uma família de três… na Bradesco Saúde." | "Mas pelo CNPJ, olha só:" e três cartões de cotação em tela cheia, um por vez, com o valor rolando na fala |
| 32,2–36,8 s | "Ou seja: um dos melhores hospitais do mundo, pelo CNPJ da sua empresa." | átrio do Einstein; "um dos melhores hospitais do mundo,"; selo "pelo CNPJ da sua empresa" |
| 36,8–44,1 s | "A gente compara Alice, Amil, Bradesco, SulAmérica e outras operadoras… e te mostra a melhor opção pro seu perfil." | cubos das 4 operadoras acendendo no nome; "e outras operadoras"; carimbo "MELHOR OPÇÃO PRO SEU PERFIL" |
| 44,1–51,2 s | "Clica no link, preenche o formulário e descobre quanto fica pra você." | "Quanto fica pra você?", fachada com "Planos com o Einstein na rede", cubos, botão do formulário, setas "Clique no link abaixo", texto legal |

### Cotações (as mesmas do vídeo de referência, a pedido do cliente)

| Perfil | Operadora e plano | Detalhes | Valor |
|---|---|---|---|
| 1 pessoa · 30 anos | Alice · Exclusivo | Saúde PME · Apartamento · Coparticipação 30% | R$ 1.345,06/mês |
| Casal | Amil · Black I R1 | Saúde PME · Apartamento · Coparticipação | R$ 2.745,50/mês |
| Família · 3 pessoas | Bradesco Saúde · Nacional Plus 4 | Saúde PME · Apartamento · Coparticipação 30% · 390 hospitais | R$ 4.238,19/mês |

A locução fala os valores arredondados para baixo ("mil trezentos e quarenta e cinco", "dois mil
setecentos e quarenta e cinco", "a partir de quatro mil duzentos e trinta e oito"); a tela mostra o
valor exato. **Antes de veicular:** as cotações são de outra corretora — confirmar com as operadoras
que esses planos estão disponíveis por esses valores e que o Einstein está na rede de cada um. A diária
de R$ 20 mil e o ranking (16º no mundo, Newsweek 2026) também vêm do vídeo e do material do cliente.

### Observações obrigatórias de segurança comercial (CLAUDE.md da raiz)

Só por escrito, texto exato, fora da locução (sem legendas de fala). Letra de 20 px; 22 px logo abaixo
dos preços.

| Cena | Observações |
|---|---|
| Gancho (CNPJ, "vantagem") | Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. |
| Plano com o Einstein (foto) | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Imagem meramente ilustrativa. |
| Ranking e diária (mockup) | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Imagem meramente ilustrativa. |
| Cotações | logo abaixo de cada preço: Valores sujeitos à faixa etária e região. · embaixo: Valores referenciais sujeitos às regras da operadora. · Os valores podem variar conforme perfil do beneficiário. · Cobertura e rede sujeitas à modalidade contratada. · Imagem meramente ilustrativa. |
| "Um dos melhores hospitais" (foto) | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Imagem meramente ilustrativa. |
| Comparação de operadoras | Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. · Imagem meramente ilustrativa. |
| Cartão final | dados das 3 cotações + fonte do ranking · Valores sujeitos à faixa etária e região. · Valores referenciais sujeitos às regras da operadora. · Os valores podem variar conforme perfil do beneficiário. · Cobertura e rede sujeitas à modalidade contratada. · Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. · Imagem meramente ilustrativa. |

## Gerar de novo

```bash
python3 -I tools/prep_voice.py      # vo.wav (1,1× mais rápido, mesmo tom), vo.words.json e vo.dur
python3 -I tools/synth_audio.py     # efeitos + trilha presa à locução; grava tools/grid.json
bash tools/assemble.sh              # index.html + compositions/*.html + carve da trilha
npx hyperframes check
npx hyperframes render --quality high --fps 30 --output renders/einstein-cnpj-v2-story.mp4
```

`tools/lib.mjs` guarda o que é comum às variações 2 e 3 (paleta, ícones, cubos, cotações, observações,
contadores que rolam); `tools/build.mjs` monta as cenas presas às palavras da locução. Masterização em
−14 LUFS, loudnorm em duas passadas, AAC 256k e faststart.

## Áudio

- **Locução**: ElevenLabs Eleven v4, voz "Roberta - Casual Sales" (voz feminina principal do cliente);
  tomada A de 2 (mais variação de entonação), acelerada 1,1× com atempo (sem mudar o tom):
  52,6 s → 48,0 s. Texto em `tools/voice_prompt.txt`; tempos por palavra do Scribe v1.
- **Trilha** sintetizada (`tools/synth_audio.py`, ~97 BPM): curta subida sob "Se você tem CNPJ", drop
  no "vantagem", groove em Lá menor / Fá / Dó / Sol até o fim da comparação, subida antes do CTA e
  refrão no "Clica no link".
- **Carve** 0,35 sob a voz. **Efeitos**: impacto, brilho, sino, contador nos valores, cartões,
  checks, carimbo, pops e whooshes.

## Assets

- Fotos enviadas pelo cliente (`assets/img/`): fachada e átrio do Einstein. Só enquadramento e zoom
  lento, sem tratamento de cor. As outras fotos da pasta ficaram de reserva.
- Cubos das operadoras (Alice, Amil, Bradesco, SulAmérica) iguais aos da V1.
- Tipografia Montserrat e Poppins; paleta azul-meia-noite e champanhe, vermelho para a conta e verde
  para os selos de "liberado / na rede".
