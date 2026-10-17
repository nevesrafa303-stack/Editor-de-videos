---
format: 1080x1920
duration: 28s
message: "Pagando caro no plano de saúde? Com CNPJ, SulAmérica com hospital de referência por valores abaixo do individual"
arc: Dor → Virada → Hospital → Preço → CTA
audience: quem paga caro em plano de saúde e tem CNPJ
mode: autonomous
music: none
bpm: 120
grid: "1 compasso = 2.0s; todos os cortes caem em barra"
voice: "HeyGen Sofia Brazil - Friendly (pt-BR, feminina)"
---

## Frame 1 — Dor
- scene: Fachada do Hospital Nursing Care em tela cheia; "Está pagando CARO no plano de saúde?" com CARO laranja gigante e risco
- duration: 4s
- poster: 2.8s
- transition_in: cut
- status: animated
- voiceover: "Está pagando caro no plano de saúde?"
- src: compositions/frames/01-dor.html

## Frame 2 — Virada
- scene: Selo EXCLUSIVO PARA CNPJ, pílula SulAmérica, comparativo de barras individual x CNPJ, "Valores abaixo do plano individual"
- duration: 6s
- poster: 4.8s
- transition_in: zoom-through 0.35s
- status: animated
- voiceover: "Com o seu CNPJ, você tem SulAmérica com valores abaixo do individual."
- src: compositions/frames/02-virada.html

## Frame 3 — Hospital
- scene: Foto do Hospital Nursing Care em card com selo "Hospital de referência"; checks: Rede D'Or, hospitais de referência, odontológico
- duration: 6s
- poster: 4.5s
- transition_in: blur-crossfade 0.35s
- status: animated
- voiceover: "Atendimento na Rede D'Or, hospitais de referência e plano odontológico."
- src: compositions/frames/03-hospital.html

## Frame 4 — Preço
- scene: 3 vidas a partir de R$ 1.014,97* (trava em 20 s, linha de compasso) + rodapé legal
- duration: 6s
- poster: 4.8s
- transition_in: zoom-through 0.35s
- status: animated
- voiceover: "Três vidas a partir de mil e catorze e noventa e sete."
- src: compositions/frames/04-preco.html

## Frame 5 — CTA
- scene: "Pare de pagar caro. Simule agora." + botão Simulação Gratuita 100% Online; sem marca de corretora
- duration: 6s
- poster: 4.5s
- transition_in: zoom-through 0.35s
- status: animated
- voiceover: "Faça sua simulação grátis, cem por cento online."
- src: compositions/frames/05-cta.html
