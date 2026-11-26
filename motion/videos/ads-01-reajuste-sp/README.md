# Ads 01 · reajuste (story 9:16, 49,4 s)

Edição do vídeo "Ads 01 vídeo", recebido pelo Google Drive em 26/11/2026. Um apresentador fala direto para a câmera
sobre o reajuste do plano de saúde e o plano empresarial pelo CNPJ, com hospitais de São Paulo.

**Original:** iPhone, 2160×3840, HDR HLG, 60 fps, 59,4 s, com quatro tomadas já emendadas (duas abertas, sentado, e
duas de selfie).

**O que foi feito:**
- cortes;
- tratamento da voz;
- legenda palavra a palavra;
- painel de infográficos sincronizado com a fala;
- trilha;
- efeitos sonoros;
- cartão final.

A fala é a do apresentador; nada foi regravado nem gerado. O anúncio leva ao formulário do Meta.

## Cortes (59,4 s → 46,9 s de fala + 2,5 s de cartão final)

| Corte | Por quê |
|---|---|
| "Se você tem CNPJ ~~e duas vidas ou mais~~, dá pra sair dessa." | **Regra do formulário:** o `CLAUDE.md` diz que ele só aceita CNPJ/MEI com **3 vidas ou mais**. Falar "duas vidas" leva ao formulário quem vai ser barrado. |
| "É exclusivo pra CNPJ ~~e a partir de duas vidas~~." | **Mesma regra.** Na tela, o selo e o cartão final dizem "a partir de 3 vidas". |
| "Nosso time de especialistas compara as principais operadoras…" passou para **antes** do "É exclusivo pra CNPJ. Clica no link…" | **CTA no fim:** o vídeo termina no pedido do formulário. |
| Saiu o fecho "E não se esqueça, a saúde da sua família ou empresa está em nossos planos." | **Final mais forte:** o vídeo fecha no CTA, com 49 s em vez de quase 60 s. |
| Pausas encurtadas e respirações tiradas entre as frases | **Ritmo:** a fala fica mais ágil. |

**Onde cada corte cai:**
- **Troca de tomada:** cai no painel subindo ou descendo.
- **Mesma tomada:** cai num punch-in (o "dá pra sair dessa" e as duas emendas do bloco final).
- **"Clica no link":** a fala entra 0,2 s antes da troca de tomada. O vídeo segura o primeiro quadro da tomada nova.

A lista exata está em `tools/cuts.json` e o mapa original → editado em `tools/timeline.json`.

**Se o formulário passar a aceitar 2 vidas:** dá para voltar a fala original. Basta trocar os pontos de corte de `s3`
e `s8` em `tools/cuts.json`.

## Voz

O áudio do iPhone foi tratado em `tools/prep_voice.sh`:
- **Ganho por tomada:** de −1,2 a +2,7 dB, porque as tomadas vieram com volumes diferentes.
- **Filtros:** passa-altas, redução leve de ruído e −3 dB em 400 Hz (o som de "caixa" da sala).
- **Nitidez das consoantes:** +3 dB em 3,2 kHz e +2 dB acima de 8 kHz.
- **Dinâmica:** de-esser, compressão 3:1 e expansor leve nas pausas.
- **Nível:** −16 LUFS.

Resultado: a faixa de 2,5 a 6 kHz subiu 5,5 dB em relação ao original, e a fala fica mais clara no celular.

**Limpeza por IA (não aplicada):**
- O Enhance Speech do Adobe foi pedido, mas o resultado não volta por este conector.
- O Isolador de Voz do ElevenLabs precisava de 991 créditos e a conta tinha 555, então não rodou.

Com créditos, o isolador tira também o eco da sala. A troca é só de arquivo: o áudio isolado entra no lugar de
`raw48.wav` em `tools/assemble.py`.

## Roteiro e infográficos

| Tempo | Fala | Na tela |
|---|---|---|
| 0–5,2 s | "Se o plano de saúde subiu de novo esse ano, então presta atenção nos próximos segundos." | Tela cheia (plano aberto), aproximação lenta e punch-ins no "subiu" e no "atenção". |
| 5,2–11,5 s | "Todo ano chega o reajuste e a mensalidade pesa no orçamento, e você continua com a mesma rede… ou pior." | O painel desce (selfie embaixo): "Todo ano chega o" e o carimbo laranja **REAJUSTE**. As barras da mensalidade sobem. Entram os cartões "Pesa no orçamento" e "A mesma rede… ou pior", que fica vermelho e treme no "pior". |
| 11,5–14,2 s | "Se você tem CNPJ, dá pra sair dessa." | Tela cheia (selfie). O selo "EXCLUSIVO PARA CNPJ/MEI" pulsa no "CNPJ" e há um punch-in no corte. |
| 14,2–17,1 s | "O plano empresarial tem outras regras e preços." | Painel: "Pelo CNPJ, o **PLANO EMPRESARIAL** tem outras", com os cartões "Regras" e "Preços". |
| 17,1–24,6 s | "Em muitos casos, uma rede melhor, como hospitais São Luiz, São Camilo, BP, dependendo do plano." | "Uma rede **melhor**", três cartões que viram no nome de cada hospital e o selo "dependendo do plano". |
| 24,6–32,3 s | "E os benefícios vêm junto. Telemedicina 24 horas, cobertura nacional e, em vários planos, reembolso de consultas." | "E os benefícios **vêm junto**" com ✓ Telemedicina 24 h, ✓ Cobertura nacional e ✓ Reembolso de consultas ("em vários planos"). |
| 32,3–36,5 s | "Não é trocar por trocar, é parar de pagar mais sem necessidade." | Tela cheia (frase-tese), punch-ins no "parar" e no "mais". |
| 36,5–42,2 s | "Nosso time de especialistas compara as principais operadoras pra você ou sua empresa." | Painel: "Nosso time de especialistas" e "compara as principais operadoras". Três cartões ("Opção 1, 2, 3") com barras de rede, preço e benefícios; uma lupa passa por eles e a opção 2 ganha o selo "✓ a melhor pra você". Não há nomes nem valores. |
| 42,2–44,5 s | "É exclusivo pra CNPJ." | Selo grande "Exclusivo para **CNPJ/MEI**" carimbado, mais "a partir de 3 vidas". |
| 44,5–46,6 s | "Clica no link abaixo e preenche o formulário." | "Clique no link abaixo" com setas. O botão "Solicite sua cotação / Preencha o formulário" é apertado no "formulário", e entra "✓ Exclusivo para CNPJ/MEI · a partir de 3 vidas". |
| 46,6–49,4 s | (sem fala) | Cartão final: o painel cresce até o pé da tela, com "Pelo CNPJ, com" e os cartões "Rede de referência\*", "Telemedicina 24 h" e "Cobertura nacional". |

**Topo fixo do começo ao fim:**
- a tarja "PLANOS DE SAÚDE";
- o selo "EXCLUSIVO PARA CNPJ/MEI";
- "a partir de 3 vidas · São Paulo".

O selo pulsa nos dois "CNPJ" da fala.

**CTA:** só de formulário, sem WhatsApp nem balão de conversa.

**Paleta:** azul-marinho e verde-água. O anúncio não é de uma operadora só, então não usa a paleta de nenhuma.

## Rede e afirmações: conferir antes de subir

- **São Luiz, São Camilo e BP:** são falas do apresentador, sempre com "dependendo do plano". Na tela aparecem só os
  nomes, em cartões iguais, sem foto (não há foto livre do São Camilo de São Paulo).
  - **Fonte da rede:** este vídeo não vem de uma cotação, então não há fonte de rede por hospital.
  - **O que o `CLAUDE.md` pede:** confirmar com o cliente qual plano da cotação tem cada um, na acomodação da cotação.
    Quem chegar pelo anúncio deve receber uma cotação com esses hospitais.
  - **Exemplo já registrado no `CLAUDE.md`:** o Bradesco Efetivo Plus tem São Camilo Ipiranga e Santana em enfermaria.
- **"Uma rede melhor":** a fala diz "em muitos casos", e o texto legal do painel acompanha.
- **"Reembolso de consultas":** a fala diz "em vários planos". Isso aparece embaixo do item e na nota do cartão final.
- **"Compara as principais operadoras":** o gráfico é ilustrativo, sem marca nem valor.

## Observações obrigatórias (texto exato, só na tela)

| Trecho | Observações |
|---|---|
| Gancho, tela cheia | Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. |
| Reajuste e mensalidade | Valores referenciais sujeitos às regras da operadora. · Os valores podem variar conforme perfil do beneficiário. |
| "Se você tem CNPJ", tela cheia | Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. |
| Plano empresarial: regras e preços | Valores referenciais sujeitos às regras da operadora. · Valores sujeitos à faixa etária e região. |
| Rede e hospitais | A rede credenciada pode variar conforme plano contratado. · Consulte a disponibilidade da rede hospitalar. |
| Benefícios | Cobertura e rede sujeitas à modalidade contratada. · A rede credenciada pode variar conforme plano contratado. |
| Frase-tese ("pagar mais"), tela cheia | Valores referenciais sujeitos às regras da operadora. · Os valores podem variar conforme perfil do beneficiário. |
| Operadoras | Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. |
| Exclusivo para CNPJ | Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. |
| CTA e cartão final | Planos de saúde empresariais para CNPJ/MEI, a partir de 3 vidas. Hospitais citados como exemplos de rede, conforme o plano. · Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. · Valores referenciais sujeitos às regras da operadora. · Valores sujeitos à faixa etária e região. · A rede credenciada pode variar conforme plano contratado. · Cobertura e rede sujeitas à modalidade contratada. |

Não entra "Imagem meramente ilustrativa.": o vídeo só mostra o próprio apresentador e gráficos, sem foto de hospital,
de outras pessoas ou imagem gerada.

**Tamanho e posição do texto legal:**
- tem 19 px;
- com o painel, fica logo acima da legenda;
- em tela cheia, fica numa caixa escura logo abaixo do cabeçalho (y ≈ 500);
- tudo fica entre 230 e 1536 px.

**`hyperframes check`:** passa sem erros. Os avisos que ficaram:
- zonas laterais do TikTok e do YouTube Shorts;
- letra legal abaixo de 28 px (de propósito);
- tempo de leitura do texto legal;
- arquivo de legendas grande.

## Áudio

- **Voz:** ver acima. O vídeo entra mudo e a voz tratada vai num `<audio>` separado.
- **Trilha:** sintetizada em Si menor, ~103 BPM, presa à fala (`tools/synth_audio.py`):
  - piano no gancho e na dor do reajuste;
  - subida no "Se você tem CNPJ, dá pra sair dessa";
  - groove a partir de "O plano empresarial";
  - respiro de piano na frase-tese;
  - nova subida no "É exclusivo pra CNPJ";
  - refrão no "Clica no link";
  - acorde final no cartão final.

  Ela fica abaixo da voz com compressão pela própria voz (`tools/duck_bgm.sh`). Medido: a voz fica de 15 a 21 dB
  acima da trilha.
- **Efeitos:** 39 ao todo, os mesmos efeitos do ElevenLabs dos outros anúncios:
  - whoosh nas trocas;
  - relógio no "próximos segundos";
  - carimbo no "reajuste", no "CNPJ" e no "exclusivo";
  - subida nas barras da mensalidade;
  - pop nos cartões e nos hospitais;
  - check nos benefícios;
  - brilho e sino na comparação;
  - toque no botão;
  - sino no cartão final.
- **Master:** −14 LUFS, pico −1,5 dBTP.

## Gerar de novo

```bash
bash tools/prep_video.sh "<Ads 01 vídeo .mp4>" <pasta de trabalho>   # tone-mapping, cortes -> assets/video/src.mp4
python3 -I tools/clean_words.py <pasta de trabalho>/voice_cut_raw.wav   # tools/words.json (whisper medium já rodado)
bash tools/prep_voice.sh <pasta de trabalho>/voice_cut_raw.wav          # assets/audio/voice.wav
<venv>/python -I tools/synth_audio.py                                   # trilha e efeitos (numpy, scipy, soundfile)
bash tools/duck_bgm.sh                                                  # trilha abaixada sob a voz
node tools/build.mjs                                                    # index.html + compositions/
npx hyperframes check
npx hyperframes render --quality high --fps 30 --sdr --output renders/ads-01-reajuste-sp.mp4
```

O whisper rodou no áudio já cortado: `tools/transcript-medium.json`. A transcrição do original está em
`tools/transcript-original-medium.json`.
