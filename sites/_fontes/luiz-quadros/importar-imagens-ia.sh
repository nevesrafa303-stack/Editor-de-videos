#!/usr/bin/env bash
# Baixa as imagens ilustrativas geradas no Higgsfield e gera os WebP do site.
# Rode numa rede que permita d8j0ntlcm91z4.cloudfront.net.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p ia
U=https://d8j0ntlcm91z4.cloudfront.net/user_3HjPRjGO0xy7uCsl2JBRp9SrcY1
declare -A F=(
  [orla]=hf_20261002_195059_d6cc6671-1c07-4e16-b95b-dbbf21da89df
  [baia]=hf_20261002_195155_a76916fe-5490-4f1f-9c8a-cc2a38afe6c1
  [interior]=hf_20261002_195155_71c4a51a-21de-4a7f-80f5-efede7ef6a77
  [obra]=hf_20261002_195155_8af18a06-82a0-494e-b944-f6555b0fd156
  [chaves]=hf_20261002_195156_8da273c7-5844-476c-a22b-b0260cda0554
  [maquete]=hf_20261002_195155_a5248e8b-79ef-4b5c-a346-a0b2b527b0d9
)
for n in "${!F[@]}"; do
  curl -fsS -o "ia/$n.png" "$U/${F[$n]}.png"
  for w in 720 1280; do convert "ia/$n.png" -resize "${w}x>" -quality 78 -define webp:method=6 "../../luiz-quadros/assets/img/ia-$n-$w.webp"; done
  echo "ok: $n"
done
