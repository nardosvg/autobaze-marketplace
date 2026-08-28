#!/usr/bin/env bash
# Bootstrap do Mercur em producao — idempotente, pode rodar de novo sem medo.
#
# Cria o que o marketplace precisa pra funcionar e que NAO vem das migrations:
# usuario admin, regiao Brasil/BRL, publishable key ligada ao sales channel,
# shipping profile compartilhado, o atributo global "Condicao" (eixo de
# variante que o sync do AutoBaze exige em todo produto master) e a comissao
# padrao da plataforma.
#
# Uso (na VPS):  bash /opt/mercur/repo/deploy/bootstrap-prod.sh
set -euo pipefail

API=${API:-http://127.0.0.1:9000}
APP_ENV=${APP_ENV:-/opt/operify-app/app.env}
EMAIL=$(grep "^MERCUR_ADMIN_EMAIL=" "$APP_ENV" | cut -d= -f2-)
SENHA=$(grep "^MERCUR_ADMIN_PASSWORD=" "$APP_ENV" | cut -d= -f2-)
[ -n "$EMAIL" ] && [ -n "$SENHA" ] || { echo "ERRO: MERCUR_ADMIN_EMAIL/PASSWORD ausentes em $APP_ENV"; exit 1; }

j() { python3 -c "import sys,json;d=json.load(sys.stdin);print($1)" 2>/dev/null || true; }

echo "1/7 usuario admin"
docker exec mercur-api npx medusa user -e "$EMAIL" -p "$SENHA" >/dev/null 2>&1 \
  && echo "   criado" || echo "   ja existia"

echo "2/7 login"
TOKEN=$(curl -s -X POST "$API/auth/user/emailpass" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$SENHA\"}" | j "d['token']")
[ -n "$TOKEN" ] || { echo "ERRO: login falhou"; exit 1; }
AUTH=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

echo "3/7 regiao Brasil/BRL"
REG=$(curl -s "$API/admin/regions?limit=50" "${AUTH[@]}" | j "next((r['id'] for r in d['regions'] if r['currency_code']=='brl'), '')")
if [ -z "$REG" ]; then
  REG=$(curl -s -X POST "$API/admin/regions" "${AUTH[@]}" \
    -d '{"name":"Brasil","currency_code":"brl","countries":["br"],"payment_providers":["pp_system_default"]}' | j "d['region']['id']")
  echo "   criada: $REG"
else echo "   ja existia: $REG"; fi

echo "4/7 sales channel + publishable key"
SC=$(curl -s "$API/admin/sales-channels?limit=10" "${AUTH[@]}" | j "d['sales_channels'][0]['id']")
[ -n "$SC" ] || SC=$(curl -s -X POST "$API/admin/sales-channels" "${AUTH[@]}" -d '{"name":"Default Sales Channel"}' | j "d['sales_channel']['id']")
PK_ID=$(curl -s "$API/admin/api-keys?limit=20" "${AUTH[@]}" | j "next((k['id'] for k in d['api_keys'] if k['type']=='publishable'), '')")
if [ -z "$PK_ID" ]; then
  RESP=$(curl -s -X POST "$API/admin/api-keys" "${AUTH[@]}" -d '{"title":"Storefront","type":"publishable"}')
  PK_ID=$(echo "$RESP" | j "d['api_key']['id']")
fi
curl -s -X POST "$API/admin/api-keys/$PK_ID/sales-channels" "${AUTH[@]}" -d "{\"add\":[\"$SC\"]}" >/dev/null || true
PK_TOKEN=$(curl -s "$API/admin/api-keys/$PK_ID" "${AUTH[@]}" | j "d['api_key']['token']")
echo "   publishable key: $PK_TOKEN"

echo "5/7 shipping profile"
SP=$(curl -s "$API/admin/shipping-profiles?limit=20" "${AUTH[@]}" | j "next((p['id'] for p in d['shipping_profiles'] if p['name']=='Marketplace Shipping'), '')")
[ -n "$SP" ] || SP=$(curl -s -X POST "$API/admin/shipping-profiles" "${AUTH[@]}" -d '{"name":"Marketplace Shipping","type":"default"}' | j "d['shipping_profile']['id']")
echo "   $SP"

echo "6/7 atributo global Condicao"
ATTR=$(curl -s "$API/admin/product-attributes?limit=20" "${AUTH[@]}" | j "next((a['id'] for a in d['product_attributes'] if a['handle']=='condicao'), '')")
if [ -z "$ATTR" ]; then
  curl -s -X POST "$API/admin/product-attributes" "${AUTH[@]}" -d '{"name":"Condicao","handle":"condicao","type":"multi_select","is_variant_axis":true,"is_filterable":true,"values":[{"name":"Novo","rank":0},{"name":"Usado","rank":1},{"name":"Recondicionado","rank":2}]}' >/dev/null
  echo "   criado"
else echo "   ja existia"; fi

echo "7/7 comissao padrao 10%"
curl -s -X POST "$API/admin/commission-rates/comrate_default" "${AUTH[@]}" \
  -d '{"name":"Comissao padrao AutoBaze","value":10,"include_tax":true,"include_shipping":false,"is_enabled":true}' >/dev/null || true

echo
echo "PRONTO. Guarde a publishable key acima em deploy/.env como"
echo "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY e builde o storefront."
