# Plano de Saúde SulAmérica para CNPJ — white-label (HyperFrames)

Filme vertical 1080×1920 (Reels/Stories), 28 s, 30 fps, com locução feminina HeyGen.
**Sem marca de corretora**: pode ser usado por qualquer cliente. Uma cotação só (SulAmérica).

| Cena | Tempo | Conteúdo |
|---|---|---|
| 01-dor | 0–4 s | Fachada do Hospital Nursing Care em tela cheia: "Está pagando **caro** no plano de saúde?" |
| 02-virada | 4–10 s | EXCLUSIVO PARA CNPJ · SulAmérica · comparativo individual × CNPJ · "Valores abaixo do plano individual" |
| 03-hospital | 10–16 s | Card do Hospital Nursing Care (hospital de referência) + Rede D'Or, hospitais de referência, odontológico |
| 04-preco | 16–22 s | 3 vidas a partir de R$ 1.014,97* (trava em 20 s) + rodapé legal |
| 05-cta | 22–28 s | "Pare de pagar caro. Simule agora." + Simulação Gratuita 100% Online |

## Gerar de novo

```bash
python3 tools/voice.py               # falas HeyGen (cache em assets/voice/*.json)
python tools/synth_audio.py          # trilha 120 BPM + efeitos (numpy, scipy, soundfile)
bash tools/assemble.sh               # cenas -> index.html -> transições -> carve da trilha
npx hyperframes check
npx hyperframes render --quality high --output renders/sulamerica-cnpj.mp4
```

Precisa de `api.heygen.com` e `*.heygen.ai` liberados e do segredo de rede `X-Api-Key`.
Neste container o Chrome vem de `HYPERFRAMES_BROWSER_PATH` e o GSAP de `assets/vendor/`.

## Para usar com outro cliente

- Para incluir a marca de um corretor: acrescente o logo em `05-cta` (há espaço abaixo do rodapé).
- Textos e preço: `tools/build-frames.mjs` (cenas) e `tools/voice.py` (falas).

## Fonte dos dados

Briefing LAKS "Copy Criativos 01/09/26", criativos 03/04 (SulAmérica): 3 vidas a partir de
R$ 1.014,97, Atendimento Rede D'Or, Plano odontológico, foto do Hospital Nursing Care; a promessa
"valores abaixo do individual" vem da peça de referência SulAmérica do mesmo briefing.
