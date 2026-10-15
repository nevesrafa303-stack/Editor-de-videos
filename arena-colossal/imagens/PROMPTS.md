# Imagens do site — prompts prontos

Catorze imagens, uma por bloco. Cada prompt já carrega a direção de arte do
site, então o conjunto sai coeso em vez de parecer catorze buscas diferentes.

Use em qualquer gerador (Higgsfield, Midjourney, Firefly). Os nomes dos
arquivos importam: `aplicar.mjs` encaixa cada um no lugar certo pelo nome.

---

## Direção de arte — cole no começo de todo prompt

```
Cinematic automotive detailing studio photography. Near-black background,
deep navy shadows, a single warm orange rim light and a cool blue fill from
the opposite side. Shallow depth of field, macro detail, moisture and
micro-reflections on the surface. Moody, expensive, restrained — editorial,
not advertising. No text, no logos, no brand badges, no people's faces.
Shot on a 85mm lens, f/1.8.
```

> **Por que sem texto e sem logo:** qualquer palavra que o gerador inventa
> sai errada e denuncia a imagem. E logotipo de montadora no seu site é
> problema de marca que você não precisa ter.

---

## Os dez serviços — 4:3

Nome do arquivo = slug do serviço. É assim que o script acha o lugar.

| Arquivo | Prompt (depois da direção de arte) |
| --- | --- |
| `lavagem-tecnica.jpg` | Dense white foam sheeting off a glossy black car door, water beading in motion, a wash mitt mid-stroke, droplets suspended in the rim light. |
| `higienizacao-interna.jpg` | Car interior being extracted: a detailing brush lifting dirt from a fabric seat seam, fine fibers catching the light, vacuum nozzle just out of focus. |
| `higienizacao-couro.jpg` | Close macro of gloved hands working cream into black perforated leather seat, the grain of the hide sharp, soft foam applicator. |
| `higienizacao-ar-condicionado.jpg` | Car dashboard air vents in extreme close-up, a thin mist escaping the louvers, chrome slats catching the orange rim light, dark cabin behind. |
| `descontaminacao.jpg` | Clay bar gliding over wet black paint, contamination visibly lifting, the surface split between rough and mirror-smooth. |
| `polimento-tecnico.jpg` | Dual action polisher pad mid-work on black paint, orange compound at the edge of the pad, swirl marks dissolving into a mirror finish. |
| `vitrificacao.jpg` | A single drop of ceramic coating falling from an applicator onto flawless black paint, water beading into tight spheres, surface like liquid glass. |
| `protecao-plasticos.jpg` | Textured black exterior plastic trim, half restored to deep satin and half faded grey, an applicator pad at the boundary. |
| `protecao-pneus.jpg` | Tyre sidewall in macro, deep satin black dressing, tread blocks sharp, the wheel arch dark behind, water droplets on rubber. |
| `restauracao-farois.jpg` | Car headlight close-up, half yellowed and cloudy, half crystal clear, the internal reflector and LED elements visible through the clear side. |

## Os quatro blocos — 16:9

| Arquivo | Prompt |
| --- | --- |
| `hero.jpg` | A dark sports car silhouette in a detailing bay, lit only by a strip light along the flank, floor still wet, reflections stretching toward the camera. |
| `autoridade.jpg` | Paint depth gauge resting on a black fender, its small screen glowing, the measured surface filling the frame — measurement before correction. |
| `inspecao.jpg` | An inspection light raking across black paint at a low angle, revealing fine swirl marks that are invisible head-on. |
| `fachada.jpg` | Exterior of a small premium detailing workshop at dusk, roller door open, warm light spilling onto wet asphalt, one car inside in silhouette. |

---

## Depois de gerar

```bash
# coloque os arquivos em imagens/entrada/ com os nomes acima
node imagens/aplicar.mjs
```

O script converte para WebP no tamanho certo, embute no HTML e regenera o
HTML estático. Nada mais a fazer.

---

## Uma coisa que não vou fazer com imagem gerada

**A seção antes/depois continua esperando foto real sua.** Gerar um "antes e
depois" por IA e publicar como resultado da Arena é inventar prova — é o
tipo de coisa que destrói a confiança no dia em que alguém percebe. As dez
imagens acima são **ambientação**: ilustram o serviço, e em nenhum lugar o
site afirma que aquele carro passou pela sua mão. Antes/depois é diferente:
ali a imagem É a alegação.
