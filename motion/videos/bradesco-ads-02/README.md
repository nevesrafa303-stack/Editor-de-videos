# Ads 02 Bradesco (story 9:16, 35,9 s)

Edição do vídeo do apresentador de camisa Bradesco Saúde/Mediservice que veio pelo Google Drive em 19/11/2026
("Ads 02 Bradesco", 1080×1920, 30 fps, já com cortes secos e um selo pequeno da Bradesco no canto).

**O que entrou:**
- legenda palavra a palavra;
- painel de infográficos sincronizado com a fala;
- trilha;
- efeitos sonoros.

A fala é a original. O formato é o mesmo do `caio-ads-01` e do `bradesco-ads-01-friday`, na paleta da Bradesco Saúde
(vermelho #cc092f + branco). O anúncio leva ao formulário do Meta.

## Como a tela funciona

- **Tela cheia:** no gancho (0–6,0 s) e na pergunta "Quer saber quanto custaria…" (27,2–31,3 s), o vídeo fica 230 px
  abaixo do topo, com o cabeçalho acima da cabeça e punch-ins no "caro", na "boa notícia" e no "custaria".
- **Painel de infográficos:** nos outros trechos, o painel vermelho desce e o rosto fica inteiro na metade de baixo.
- **Cabeçalho fixo:** "PLANOS DE SAÚDE", "EXCLUSIVO PARA CNPJ/MEI" e "a partir de 3 vidas". O selo pulsa no "CNPJ" e
  no "três pessoas".
- **Legenda:** caixa branca, com a palavra falada em vermelho.
  - Palavras-chave sempre em vermelho: CNPJ, caro, boa notícia, insegurança, assusta, preços, Bradesco, região,
    empresarial, três pessoas, equilibrado, abrangência nacional, empresa, botão e formulário.
  - Correção da transcrição: "preencha".

## Roteiro e infográficos

| Tempo | Fala | Na tela |
|---|---|---|
| 0–6,0 s | "Você que tem um CNPJ e está pagando caro no seu plano de saúde, eu tenho uma boa notícia para você." | Tela cheia com punch-ins |
| 6,0–15,4 s | "Eu sei que trocar de plano de saúde pode gerar insegurança e contratar um novo plano de saúde muitas vezes assusta pelos preços das operadoras." | "Eu sei que… ?". Cartão "Trocar de plano gera **insegurança**", com o ícone tremendo na palavra. Cartão "O **preço** das operadoras **assusta**". |
| 15,4–27,7 s | "Mas a boa notícia é que a Bradesco Saúde trouxe aqui para a nossa região uma opção de plano de saúde empresarial com o mínimo de três pessoas, com o custo equilibrado, mantendo a mesma abrangência nacional." | "Mas a · BOA NOTÍCIA!" com subida e impacto. Logo da Bradesco Saúde e "Chegou à nossa região". Depois quatro blocos entram na palavra: Plano empresarial · A partir de 3 pessoas · Custo equilibrado · Abrangência nacional. |
| 27,2–31,3 s | "Quer saber quanto custaria um plano desses para você ou para a sua empresa?" | O painel sobe; tela cheia com punch-in |
| 31,3–35,9 s | "Clique no botão abaixo, preencha o formulário e fale agora mesmo com a nossa equipe." | Botão "Solicite sua cotação / Preencha o formulário" apertado no "formulário", "✓ Exclusivo para CNPJ/MEI · a partir de 3 vidas" e o texto legal |

**CTA na tela:** só de formulário. A fala diz "fale com a nossa equipe", mas na tela não há WhatsApp nem balão.

## Confirmar antes de subir

- **O produto:** a fala combina com o material oficial do **Bradesco Saúde Efetivo Plus** (agosto/2026): "Ainda mais
  opções de atendimento, cobertura nacional e custo competitivo, para empresas a partir de 3 pessoas". Cópia em
  `criativos/cotacoes-sulamerica-bradesco-sp/fontes/`.
  - Na tela não aparece o nome do produto nem hospitais, porque o vídeo não os diz.
  - Confirmar com o cliente se é o Efetivo Plus.
- **"Nossa região":** é fala do cliente. Na tela ficou "Chegou à nossa região", sem nome de cidade. Se o cliente
  disser a região, dá para trocar por ela.

## Observações obrigatórias (texto exato, só na tela)

| Trecho | Observações |
|---|---|
| Gancho, tela cheia ("pagando caro") | Consulte condições e elegibilidade. · Valores referenciais sujeitos às regras da operadora. |
| A dor (preços) | Valores referenciais sujeitos às regras da operadora. · Os valores podem variar conforme perfil do beneficiário. |
| Boa notícia e benefícios | Cobertura e rede sujeitas à modalidade contratada. · Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. |
| Pergunta, tela cheia | Consulte condições e elegibilidade. · Valores sujeitos à faixa etária e região. |
| CTA (fim) | Plano de saúde empresarial Bradesco Saúde para empresas a partir de 3 vidas, com abrangência nacional conforme o plano contratado. · Exclusivo para CNPJ/MEI. · Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. · Valores referenciais sujeitos às regras da operadora. · Cobertura e rede sujeitas à modalidade contratada. |

O texto legal tem 19 px e fica entre 230 e 1536 px. O `hyperframes check` passa sem erros.

## Áudio

- **Voz:** o áudio original, tratado com passa-altas, compressão leve e nível de fala (`tools/prep_voice.sh`).
- **Trilha:** sintetizada em Lá menor, ~104 BPM (`tools/synth_audio.py`).
  - O piano fica contido durante a "dor".
  - O groove entra na virada "Mas a boa notícia".
  - O refrão entra no "Clique no botão".
  - Fica abaixo da voz (`tools/duck_bgm.sh`, volume 1,4).
- **Efeitos:** 20 ao todo.
  - whoosh nas trocas;
  - cartões na dor;
  - subida + impacto na "boa notícia";
  - pop no logo, na região e nos quatro blocos;
  - toque no botão.

## Gerar de novo

```bash
python3 -I tools/clean_words.py
bash tools/prep_voice.sh
<venv>/python -I tools/synth_audio.py
bash tools/duck_bgm.sh
node tools/build.mjs
npx hyperframes check
npx hyperframes render --quality high --fps 30 --sdr --output renders/bradesco-ads-02.mp4
```
