# Plano empresarial no CNPJ — rede premium de São Paulo (story 9:16, 34,8 s)

Motion com locução para anúncio de formulário no Meta Ads. O vídeo apresenta o plano empresarial no
CNPJ com atendimento nos principais hospitais de São Paulo, mostra os atendimentos, a comparação entre
operadoras e a melhor opção para o perfil, e fecha com a chamada para o formulário.

- **Formato único: story 9:16 (1080×1920)**, a pedido do cliente. As informações ficam no centro da
  tela: o conteúdo principal ocupa de ~450 a ~1400 px, com o centro perto de 900 px. Nada fica nos
  230 px de cima nem abaixo de 1536 px, porque a interface do Stories/Reels cobre essas áreas.
- **Qualificação do lead**: o vídeo começa com "Se você tem CNPJ". O CNPJ volta no cartão "Plano
  empresarial no seu CNPJ", no perfil ("Empresa com CNPJ") e no selo do cartão final ("PLANO
  EMPRESARIAL · CNPJ"). Assim, quem não tem CNPJ se filtra antes de abrir o formulário.

## Roteiro

| Tempo | Fala | Na tela |
|---|---|---|
| 0–2,9 s | "Se você tem CNPJ, presta atenção." | "Se você tem CNPJ," e o cartão "SUA EMPRESA" já no quadro 0 (miniatura). Quando ele diz "CNPJ", a palavra dá um soco com brilho, o número do CNPJ é "digitado" no cartão e entra o selo verde "Plano empresarial". |
| 2,9–9,0 s | "Você pode ser atendido nas melhores redes hospitalares de São Paulo… com um plano empresarial no seu CNPJ." | Fundo em mosaico com as fotos dos 5 hospitais, em colunas que correm em sentidos opostos. Cada palavra do texto entra na fala, e o cartão "Plano empresarial / no seu CNPJ" aparece no "com um plano". |
| 9,0–15,0 s | "Atendimento no Sírio-Libanês… no São Luiz Itaim e Morumbi… no Vila Nova Star… e no Oswaldo Cruz." | Drop da trilha. Cada hospital ganha um cartão com foto quando é dito ("01 / 05"…), e os cartões vão empilhando. Abaixo, a lista de chips com check vai se completando. |
| 15,0–17,9 s | "Pra cirurgias, exames e internação." | "PRINCIPAIS ATENDIMENTOS" com um eletrocardiograma que se desenha. Os três atendimentos entram com ícone e check no momento da fala. |
| 17,9–24,3 s | "E o melhor: a gente compara as principais operadoras… Omint, SulAmérica, Bradesco e Amil…" | Os 4 cubos das operadoras chegam apagados no "operadoras" e cada um acende quando é dito. Depois uma faixa de luz passa pelo quadro e marca as quatro. |
| 24,3–26,5 s | "e te apresenta a melhor opção pro seu perfil." | As 4 operadoras convergem para o cartão "SEU PERFIL": Empresa com CNPJ, Quantidade de vidas, Idades e Hospitais de preferência. O selo "MELHOR OPÇÃO" entra no "opção". Nenhuma operadora aparece como vencedora. |
| 26,5–27,5 s | "Tem interesse?" | Pergunta grande no centro, com anéis pulsando. |
| 27,5–34,8 s | "Clica no link aqui embaixo e preenche o formulário, que a nossa equipe entra em contato com você." | Cartão final: "As melhores redes hospitalares de São Paulo", os 5 hospitais com check, o botão "Preencha o formulário / Nossa equipe entra em contato", "Clique no link abaixo" com setas e o texto legal. |

### De onde vem cada informação

O texto vem do roteiro do cliente: rede hospitalar em São Paulo, plano empresarial no CNPJ, os cinco
hospitais, cirurgias, exames e internação, a comparação entre Omint, SulAmérica, Bradesco e Amil, a
melhor opção pelo perfil, "Tem interesse?" e o formulário. Para soar falado e qualificar o lead, a
locução acrescenta duas coisas:

- o gancho "Se você tem CNPJ, presta atenção.";
- a ponte "E o melhor:".

O cartão "SEU PERFIL" detalha "com base no seu perfil" com os dados que costumam entrar numa
cotação (empresa, vidas, idades, hospitais). Ele não traz preço, não promete nada novo e não aponta
uma operadora como a melhor.

### Observações obrigatórias de segurança comercial (CLAUDE.md da raiz)

Só por escrito, com o texto exato, em letra pequena (20 px), fora da locução. O vídeo não tem
legendas da fala, porque o texto na tela acompanha a locução.

| Cena | Observações |
|---|---|
| Gancho (CNPJ) | Consulte condições e elegibilidade. |
| Mosaico (redes hospitalares, fotos) | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Imagem meramente ilustrativa. |
| Hospitais (fotos) | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Imagem meramente ilustrativa. |
| Atendimentos (cirurgias, exames, internação) | Cobertura e rede sujeitas à modalidade contratada. |
| Operadoras (cubos com os logos) | Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. · Imagem meramente ilustrativa. |
| Perfil (vidas, idades) | Os valores podem variar conforme perfil do beneficiário. · Valores sujeitos à faixa etária e região. · Consulte condições e elegibilidade. |
| Cartão final | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Cobertura e rede sujeitas à modalidade contratada. · Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. · Os valores podem variar conforme perfil do beneficiário. · Valores sujeitos à faixa etária e região. · Imagem meramente ilustrativa. |

## Gerar de novo

```bash
python3 -I tools/prep_voice.py      # vo.wav (48 kHz), vo.words.json e vo.dur a partir da tomada A
python3 -I tools/make_tile.py       # cubos 3D da Omint e da Amil
python3 -I tools/synth_audio.py     # efeitos + trilha presa à locução; grava tools/grid.json
bash tools/assemble.sh              # index.html + compositions/*.html + carve da trilha
npx hyperframes check
npx hyperframes render --quality high --fps 30 --output renders/sp-rede-premium-story.mp4
```

`tools/build.mjs` monta as 8 cenas e o fundo. Os tempos vêm de `at()`/`seq()` sobre
`assets/voice/vo.words.json`, e a duração e as âncoras da trilha de `tools/grid.json`. A
masterização fica em −14 LUFS, com loudnorm em duas passadas, AAC 256k e faststart.

## Áudio

- **Locução**: ElevenLabs, modelo Eleven v4, voz masculina "Jhony Tygas" (pt-BR), com tom de
  autoridade e caloroso. Foram duas tomadas, e a escolhida foi a A, que tem mais variação de
  entonação. Os tempos por palavra vêm do Scribe v1. O tratamento é leve: passa-altas, compressão
  suave e presença em 3,2 kHz.
- **Trilha** sintetizada em `tools/synth_audio.py` (~92 BPM):
  - intro elegante com piano em Lá menor / Fá / Dó no gancho;
  - subida em Sol no "com um plano empresarial no seu CNPJ";
  - drop em Dó maior no "Atendimento no Sírio-Libanês";
  - groove na lista de hospitais, nos atendimentos e nas operadoras;
  - nova subida no "Tem interesse?";
  - refrão no "Clica no link" e acorde final depois da última palavra.
- **Carve** com força 0,35 sob a voz.
- **Efeitos** (ElevenLabs Sound Effects v2, dos anúncios anteriores): impacto, cartão, checks, pop,
  whoosh, riser, carimbo, brilho e chime.

## Assets

- **Fotos dos hospitais** (enviadas pelo cliente): Sírio-Libanês, São Luiz Itaim, São Luiz Morumbi,
  Vila Nova Star e Oswaldo Cruz. Só recebem enquadramento e zoom lento, sem tratamento de cor.
- **Cubos das operadoras**:
  - SulAmérica: enviado pelo cliente.
  - Bradesco: o cubo que já estava no repositório (`sites/_fontes/laks`).
  - Omint: gerado em `tools/make_tile.py` com o logo enviado pelo cliente.
  - Amil: gerado com o logo branco usado nos anúncios Amil anteriores. O cubo antigo tinha só ~100 px
    de face e ficava borrado ampliado.
- **Tipografia**: Montserrat e Poppins. **Paleta**: azul-meia-noite, champanhe e branco.
