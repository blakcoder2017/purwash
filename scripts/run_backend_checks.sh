#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://localhost:5000/api"

json_post() {
  local url=$1
  local body=$2
  curl -sS -X POST "$url" -H "Content-Type: application/json" -d "$body"
}

json_get() {
  local url=$1
  local token=$2
  curl -sS -X GET "$url" -H "Authorization: Bearer $token"
}

echo "== Auth: Rider =="
RIDER_LOGIN=$(json_post "$BASE_URL/auth/login" '{"email":"info@zolid.online","password":"Westafrica1"}')
RIDER_TOKEN=$(echo "$RIDER_LOGIN" | node -e "let data='';process.stdin.on('data',d=>data+=d);process.stdin.on('end',()=>{try{const j=JSON.parse(data);console.log((j.data&&j.data.token)||'')}catch(e){console.log('')}});")
if [ -z "$RIDER_TOKEN" ]; then
  echo "Rider login failed" >&2
  exit 1
fi

if [ "${SKIP_PARTNER_LOGIN:-0}" = "1" ]; then
  echo "== Auth: Partner (skipped) =="
  PARTNER_TOKEN=""
else
  echo "== Auth: Partner =="
  PARTNER_PASSWORD="password123"
  # #region agent log
  printf '{"sessionId":"debug-session","runId":"pre-fix","hypothesisId":"H15","location":"scripts/run_backend_checks.sh:27","message":"partner_login_payload_meta","data":{"passwordLength":%s},"timestamp":%s}\n' \
    "${#PARTNER_PASSWORD}" \
    "$(perl -MTime::HiRes=time -e 'printf("%d", time*1000)')" \
    >> /Users/macbookpro/Documents/seproject/purwash/.cursor/debug.log 2>/dev/null || true
  # #endregion
  PARTNER_LOGIN=$(json_post "$BASE_URL/auth/login" "{\"email\":\"partner1@gmail.com\",\"password\":\"$PARTNER_PASSWORD\"}")
  PARTNER_TOKEN=$(echo "$PARTNER_LOGIN" | node -e "let data='';process.stdin.on('data',d=>data+=d);process.stdin.on('end',()=>{try{const j=JSON.parse(data);console.log((j.data&&j.data.token)||'')}catch(e){console.log('')}});")
  if [ -z "$PARTNER_TOKEN" ]; then
    echo "Partner login failed" >&2
    exit 1
  fi
fi

echo "== Pricing =="
json_post "$BASE_URL/orders/calculate" '{"items":[{"name":"Shirt","price":5,"quantity":2}]}' >/dev/null

echo "== Wallet (Rider) =="
json_get "$BASE_URL/wallet" "$RIDER_TOKEN" >/dev/null

if [ -n "$PARTNER_TOKEN" ]; then
  echo "== Wallet (Partner) =="
  json_get "$BASE_URL/wallet" "$PARTNER_TOKEN" >/dev/null
fi

echo "== Pending Orders (Rider) =="
json_get "$BASE_URL/v1/manage/orders/pending" "$RIDER_TOKEN" >/dev/null

if [ -n "$PARTNER_TOKEN" ]; then
  echo "== Pending Orders (Partner) =="
  json_get "$BASE_URL/v1/manage/orders/pending" "$PARTNER_TOKEN" >/dev/null
fi

echo "== History (Rider) =="
json_get "$BASE_URL/v1/manage/orders/history?limit=20" "$RIDER_TOKEN" >/dev/null

if [ -n "$PARTNER_TOKEN" ]; then
  echo "== History (Partner) =="
  json_get "$BASE_URL/v1/manage/orders/history?limit=20" "$PARTNER_TOKEN" >/dev/null
fi

echo "Checks completed."
