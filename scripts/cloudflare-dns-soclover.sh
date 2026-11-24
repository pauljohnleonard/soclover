#!/usr/bin/env bash
# Create/update Cloudflare DNS A record: soclover.drpjl.com → ThinkCentre public IP (proxied).
#
# Requires:
#   export CLOUDFLARE_API_TOKEN='...'   # Zone.DNS Edit on drpjl.com
# Optional:
#   CLOUDFLARE_ZONE_ID=...
#   SOCLOVER_ORIGIN_IP=149.40.2.134   # default: cheese-jam origin
#   SOCLOVER_DOMAIN=soclover.drpjl.com
#   SOCLOVER_PROXIED=true             # orange cloud (default true)

set -euo pipefail

DOMAIN="${SOCLOVER_DOMAIN:-soclover.drpjl.com}"
ORIGIN_IP="${SOCLOVER_ORIGIN_IP:-149.40.2.134}"
PROXIED="${SOCLOVER_PROXIED:-true}"
API="https://api.cloudflare.com/client/v4"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Set CLOUDFLARE_API_TOKEN (Zone DNS Edit for drpjl.com)." >&2
  echo "Dashboard alternative: A ${DOMAIN} → ${ORIGIN_IP} (Proxied)." >&2
  exit 1
fi

auth_hdr=(-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json")

zone_id="${CLOUDFLARE_ZONE_ID:-}"
if [[ -z "${zone_id}" ]]; then
  zone_id="$(curl -fsS "${auth_hdr[@]}" \
    "${API}/zones?name=drpjl.com" | python3 -c 'import sys,json; r=json.load(sys.stdin); print(r["result"][0]["id"] if r.get("success") and r["result"] else "")')"
fi
if [[ -z "${zone_id}" ]]; then
  echo "Could not resolve Cloudflare zone id for drpjl.com" >&2
  exit 1
fi
echo "Zone id: ${zone_id}"

existing="$(curl -fsS "${auth_hdr[@]}" \
  "${API}/zones/${zone_id}/dns_records?type=A&name=${DOMAIN}")"
record_id="$(printf '%s' "${existing}" | python3 -c 'import sys,json; r=json.load(sys.stdin); print(r["result"][0]["id"] if r.get("success") and r["result"] else "")')"

payload="$(python3 - <<PY
import json
print(json.dumps({
  "type": "A",
  "name": "${DOMAIN}",
  "content": "${ORIGIN_IP}",
  "ttl": 1,
  "proxied": ${PROXIED},
  "comment": "Soclover on ThinkCentre"
}))
PY
)"

if [[ -n "${record_id}" ]]; then
  echo "Updating existing A record ${record_id} ..."
  curl -fsS -X PUT "${auth_hdr[@]}" \
    --data "${payload}" \
    "${API}/zones/${zone_id}/dns_records/${record_id}" | python3 -c 'import sys,json; r=json.load(sys.stdin); assert r.get("success"), r; print("OK", r["result"]["name"], r["result"]["content"], "proxied="+str(r["result"]["proxied"]))'
else
  echo "Creating A record ..."
  curl -fsS -X POST "${auth_hdr[@]}" \
    --data "${payload}" \
    "${API}/zones/${zone_id}/dns_records" | python3 -c 'import sys,json; r=json.load(sys.stdin); assert r.get("success"), r; print("OK", r["result"]["name"], r["result"]["content"], "proxied="+str(r["result"]["proxied"]))'
fi

echo "DNS set. After nginx+certbot: https://${DOMAIN}/"
