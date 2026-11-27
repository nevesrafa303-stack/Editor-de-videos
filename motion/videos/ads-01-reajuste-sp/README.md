# Ads 01 · reajuste (story 9:16, 56,5 s) · v2, sem efeito de cor

Edição do vídeo "Ads 01 vídeo", recebido pelo Google Drive em 26/11/2026. Um apresentador fala direto para a câmera
sobre o reajuste do plano de saúde e o plano empresarial pelo CNPJ, com hospitais de São Paulo.

**Original:** iPhone, 2160×3840, HDR HLG, 60 fps, 59,4 s. Tem quatro tomadas já emendadas: duas abertas (sentado) e
duas de selfie.

**v2 (27/11/2026), pedido do cliente:**
- "corta só as partes que têm pausa, para ter um vídeo contínuo";
- "destaca quem está falando";
- "destaca melhor os hospitais".

A v1 (cortes de frases, painel cobrindo metade da tela) está no histórico do git.

## Corte: só as pausas (59,4 s → 53,9 s de fala + 2,6 s de cartão final)

**A fala:**
- está inteira e na ordem original, com o fecho "E não se esqueça, a saúde da sua família ou empresa está em nossos
  planos";
- inclui o "CNPJ ou MEI e duas vidas ou mais", que fica como gravado.

**O que saiu:**
- 17 pausas de 0,26 s ou mais, encurtadas para 0,12 s (vírgula) ou 0,2 s (fim de frase);
- as respirações longas.

**Onde cada corte cai:**
- **Troca de tomada:** a troca já existe no original e fica como está.
- **Mesma tomada:** o corte vira um "punch". O enquadramento alterna entre normal e mais perto a cada corte, então o
  pulo não aparece e o rosto ganha destaque.
- **"Não é trocar por trocar":** a fala começa 1 quadro antes da troca de tomada. O vídeo segura o 1º quadro da tomada
  nova.

Os pontos de corte estão em `tools/cuts.json` e o mapa original → editado em `tools/timeline.json`.

### 2 vidas × regra do formulário

O `CLAUDE.md` diz que o formulário do Meta só aceita CNPJ/MEI com **3 vidas ou mais**. Perguntado em 27/11/2026, o
cliente escolheu manter a fala com "duas vidas" e escrever **"a partir de 2 vidas"** na tela:
- no cabeçalho;
- no cartão do "exclusivo";
- no cartão final;
- no texto legal.

**Confirmar antes de subir:** que a trava do formulário aceita 2 vidas. Se aceitar, atualizar a regra no `CLAUDE.md`.

## Destaque do apresentador

**Tela e cor:**
- **Tela cheia o tempo todo:** nenhum painel cobre o rosto.
- **Imagem original:** sem correção de cor, vinheta ou escurecimento. A v2 tinha uma correção de retrato e um
  escurecimento no topo e no pé, e o cliente pediu a cor original (27/11/2026).
- **Conversão de HDR para SDR igual ao Drive:** o original é HDR (HLG) e precisa virar SDR para o Meta.
  - **O problema:** a conversão usada até a v3 (mobius com pico nominal de 100 nits) deixava a imagem clara e lavada:
    parede quase branca, camisa cinza.
  - **A calibração:** a conversão nova foi ajustada contra a miniatura do próprio Google Drive, no mesmo quadro
    (0,07 s), em cinco regiões: parede, rosto, camisa, ar-condicionado e cortina.
  - **O valor:** mobius com 350 nits, saturação 0,9 e contraste 1,05, com erro médio de ~5 níveis em 255. Fica em
    `tools/prep_video.sh`.
  - **O resultado:** parede cinza, camisa preta e pele natural, como no Drive.

**Zoom:**
- muda a cada corte de pausa: plano aberto 1,00 ↔ 1,07, selfie 1,00 ↔ 1,06;
- punch-in rápido nas palavras fortes: subiu, atenção, reajuste, pior, CNPJ, dá, empresarial, melhor, parar, mais,
  exclusivo, formulário, compara, família e nossos;
- nos planos abertos o zoom parte de um ponto abaixo do rosto, para o queixo não descer sobre os cartões.

**Onde fica cada informação:**
- **Topo:** selos curtos logo abaixo do cabeçalho, na parede acima da cabeça.
- **Terço inferior:** cartões, só nos planos abertos, abaixo do queixo.
- **Pé:** texto legal logo acima da legenda.

## Hospitais em destaque

No "como hospitais São Luiz, São Camilo, BP, dependendo do plano" (21,7–26,0 s):
- **Tela cheia:** entra uma tela azul-marinho com "Hospitais de referência em SP".
- **Um cartão por nome:** cada hospital tem um cartão grande (nome em 112 px, ícone de hospital, "Hospital · São
  Paulo"). O cartão entra girando no instante em que o nome é falado, com impacto e brilho.
- **Fecho:** no "dependendo do plano", os três se juntam numa fileira com o carimbo laranja "Dependendo do plano".
- **Apresentador:** fica visível num círculo com anel verde-água o tempo todo.

**Sem foto:** os três cartões não têm foto, porque não existe foto de uso livre do São Camilo de São Paulo. Os do São
Luiz e do BP existem em `criativos/`. Se o cliente enviar uma foto do São Camilo, dá para pôr as fachadas reais nos
três cartões.

## Roteiro e grafismos

| Tempo | Fala | Na tela |
|---|---|---|
| 0–5,2 s | "Se o plano de saúde subiu de novo esse ano, então presta atenção nos próximos segundos." | Selos "Subiu de novo?" (laranja) e "Presta atenção". |
| 5,2–11,5 s | "Todo ano chega o reajuste, e a mensalidade pesa no orçamento, e você continua com a mesma rede, ou pior." | Selos em sequência: "Todo ano chega o" → carimbo **REAJUSTE** → "Pesa no orçamento" → "A mesma rede…" → **"…ou pior"** (vermelho). |
| 11,5–16,3 s | "Se você tem CNPJ ou MEI, e duas vidas ou mais, dá pra sair dessa." | "✓ CNPJ ou MEI" e "2 vidas ou +" → carimbo verde "Dá pra sair dessa". O selo do cabeçalho pulsa no "CNPJ"; o "a partir de 2 vidas" pulsa no "duas". |
| 16,3–19,1 s | "O plano empresarial tem outras regras e preços." | Cartão "Plano empresarial" com ✓ "outras regras" e ✓ "outros preços". |
| 19,1–21,7 s | "Em muitos casos, uma rede melhor, como" | Selos "Em muitos casos" → "Uma rede melhor". |
| 21,7–26,0 s | "hospitais São Luiz, São Camilo, BP, dependendo do plano." | Hospitais em tela cheia (ver acima). |
| 26,0–33,3 s | "E os benefícios vêm junto. Telemedicina 24 horas, cobertura nacional e, em vários planos, reembolso de consultas." | Selo "Os benefícios vêm junto". Três cartões entram um a um com ✓: Telemedicina 24 h, Cobertura nacional e Reembolso de consultas ("em vários planos"). |
| 33,3–37,3 s | "Não é trocar por trocar, é parar de pagar mais sem necessidade." | Selos "Não é trocar por trocar" → carimbo laranja "É parar de pagar mais", com punch-ins. |
| 37,3–41,3 s | "É exclusivo para CNPJ ou MEI, e a partir de duas vidas." | Cartão carimbado "Exclusivo para **CNPJ/MEI**" + "A partir de **2 vidas**". |
| 41,3–43,4 s | "Clica no link abaixo e preenche o formulário." | Selo "Clique no link abaixo". O botão "Solicite sua cotação / Preencha o formulário" é apertado no "formulário". |
| 43,4–48,5 s | "Nosso time de especialistas compara as principais operadoras para você ou sua empresa." | Selo "Nosso time de especialistas". Comparador ilustrativo (Opção 1, 2, 3, sem marca nem valor); a opção 2 ganha "✓ pra você". |
| 48,5–53,8 s | "E não se esqueça, a saúde da sua família ou empresa está em nossos planos." | Selfie: selos "Sua família" e "Sua empresa" → carimbo verde "Em nossos planos". |
| 53,8–56,5 s | (sem fala) | Cartão final: botão "Solicite sua cotação", "Exclusivo para CNPJ/MEI · a partir de 2 vidas", "Rede de referência\*, Telemedicina 24 h, Cobertura nacional", o apresentador sorrindo no círculo e o texto legal. |

**Topo fixo do começo ao fim:**
- a tarja "PLANOS DE SAÚDE";
- o selo "EXCLUSIVO PARA CNPJ/MEI";
- "a partir de 2 vidas · São Paulo".

**CTA:** só de formulário, sem WhatsApp nem balão de conversa.

**Paleta:** azul-marinho e verde-água. O anúncio não é de uma operadora só, então não usa a paleta de nenhuma.

## Rede e afirmações: conferir antes de subir

- **São Luiz, São Camilo e BP:** são falas do apresentador, sempre com "dependendo do plano".
  - **Fonte da rede:** não há, porque o vídeo não vem de uma cotação.
  - **O que o `CLAUDE.md` pede:** confirmar com o cliente qual plano da cotação tem cada um, na acomodação da cotação.
  - **Exemplo já registrado no `CLAUDE.md`:** o Bradesco Efetivo Plus tem São Camilo Ipiranga e Santana em enfermaria.
- **"Uma rede melhor":** a fala diz "em muitos casos", e o selo e o texto legal acompanham.
- **"Reembolso de consultas":** a fala diz "em vários planos". Isso aparece no cartão e na nota do cartão final.
- **Comparador de operadoras:** é ilustrativo, sem marca nem valor.
- **"2 vidas":** ver acima.

## Observações obrigatórias (texto exato, só na tela)

| Trecho | Observações |
|---|---|
| Gancho | Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. |
| Reajuste e mensalidade | Valores referenciais sujeitos às regras da operadora. · Os valores podem variar conforme perfil do beneficiário. |
| CNPJ/MEI e 2 vidas | Consulte condições e elegibilidade. · Valores sujeitos à faixa etária e região. |
| Plano empresarial: regras e preços | Valores referenciais sujeitos às regras da operadora. · Valores sujeitos à faixa etária e região. |
| Rede melhor e hospitais | A rede credenciada pode variar conforme plano contratado. · Consulte a disponibilidade da rede hospitalar. |
| Benefícios | Cobertura e rede sujeitas à modalidade contratada. · A rede credenciada pode variar conforme plano contratado. |
| "Pagar mais" | Valores referenciais sujeitos às regras da operadora. · Os valores podem variar conforme perfil do beneficiário. |
| Exclusivo, CTA e operadoras | Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. |
| Fecho (família ou empresa) | Consulte condições e elegibilidade. · Cobertura e rede sujeitas à modalidade contratada. |
| Cartão final | Planos de saúde empresariais para CNPJ/MEI, a partir de 2 vidas. Hospitais citados como exemplos de rede, conforme o plano. · Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. · Valores referenciais sujeitos às regras da operadora. · Valores sujeitos à faixa etária e região. · A rede credenciada pode variar conforme plano contratado. · Consulte a disponibilidade da rede hospitalar. · Cobertura e rede sujeitas à modalidade contratada. |

Não entra "Imagem meramente ilustrativa.": o vídeo só mostra o próprio apresentador e gráficos, sem foto de hospital,
de outras pessoas ou imagem gerada.

**Tamanho e posição:**
- o texto legal tem 19 px e fica logo acima da legenda;
- tudo fica entre 230 e 1536 px.

**`hyperframes check`:** passa sem erros. Os avisos que ficaram:
- zonas de interface do TikTok e do YouTube Shorts (a regra do cliente, 230–1536 px, é cumprida);
- letra legal abaixo de 28 px (de propósito);
- tempo de leitura de alguns selos curtos;
- arquivo de legendas grande.

## Áudio

- **Voz:** o áudio do iPhone, sem regravação (`tools/prep_voice.sh`):
  - ganho por tomada (as tomadas vieram com volumes diferentes);
  - passa-altas, redução leve de ruído e −3 dB em 400 Hz (o som de "caixa" da sala);
  - +3 dB em 3,2 kHz e +2 dB acima de 8 kHz (nitidez das consoantes);
  - de-esser, compressão e expansor nas pausas;
  - nível de −16 LUFS.

  **Limpeza por IA (não aplicada):** o Enhance Speech do Adobe não devolve o resultado por este conector, e o Isolador
  de Voz do ElevenLabs precisava de 991 créditos (a conta tinha 555).
- **Trilha:** sintetizada em Si menor, ~96 BPM, presa à fala (`tools/synth_audio.py`):
  - piano no gancho e na dor;
  - subida no "dá pra sair dessa";
  - groove a partir de "O plano empresarial";
  - respiro de piano na frase-tese;
  - nova subida no "exclusivo";
  - refrão no "Clica no link" e de novo no fecho;
  - acorde final no cartão final.

  Ela fica abaixo da voz com compressão pela própria voz (`tools/duck_bgm.sh`).
- **Efeitos:** 46, os mesmos efeitos do ElevenLabs dos outros anúncios:
  - pop nos selos;
  - carimbo nos destaques;
  - whoosh, impacto e brilho em cada hospital;
  - check nos benefícios;
  - toque no botão;
  - sino no comparador e no cartão final.
- **Master:** −14 LUFS, pico −1,5 dBTP.

## Gerar de novo

```bash
bash tools/prep_video.sh "<Ads 01 vídeo .mp4>" <pasta de trabalho>   # tone-mapping + cortes -> assets/video/src.mp4
python3 -I tools/clean_words.py <pasta de trabalho>/voice_cut_raw.wav   # tools/words.json (whisper medium já rodado)
bash tools/prep_voice.sh <pasta de trabalho>/voice_cut_raw.wav          # assets/audio/voice.wav
<venv>/python -I tools/synth_audio.py                                   # trilha e efeitos (numpy, scipy, soundfile)
bash tools/duck_bgm.sh                                                  # trilha abaixada sob a voz
node tools/build.mjs                                                    # index.html + compositions/
npx hyperframes check
npx hyperframes render --quality high --fps 30 --sdr --output renders/ads-01-reajuste-sp-v2.mp4
```

O whisper rodou no áudio já cortado: `tools/transcript-medium.json`. A transcrição do original está em
`tools/transcript-original-medium.json`.
