#!/usr/bin/env bash
# One-shot production deploy to ThinkCentre + public HTTPS (soclover.drpjl.com).
#
#   ./deploy_production.sh
#
# What it does:
#   1. Build server + Angular client
#   2. Rsync to paul@192.168.1.66:~/soclover and restart PM2 `soclover`
#   3. Ensure PM2 `soclover-mongo` is running (localhost Mongo)
#   4. Sync nginx/DNS helper scripts to the box
#   5. If Cloudflare token is set, upsert DNS for soclover.drpjl.com
#   6. If nginx vhost missing (or --nginx), install/reload nginx + certbot (needs sudo TTY)
#   7. Smoke-test LAN + public URLs
#
# Env (optional):
#   SOCLOVER_HOST=paul@192.168.1.66
#   CLOUDFLARE_API_TOKEN=...     # Zone DNS Edit on drpjl.com
#   CLOUDFLARE_ZONE_ID=...
#   SKIP_NGINX=1                # never touch nginx
#   SKIP_DNS=1                  # never call Cloudflare
#
# Flags:
#   --nginx   Force nginx/certbot install even if vhost already exists
#   --dns     Force Cloudflare DNS upsert (requires CLOUDFLARE_API_TOKEN)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
HOST="${SOCLOVER_HOST:-paul@192.168.1.66}"
REMOTE_DIR="${SOCLOVER_REMOTE_DIR:-soclover}"
DOMAIN="${SOCLOVER_DOMAIN:-soclover.drpjl.com}"
LAN_URL="http://192.168.1.66:3055"
PUBLIC_URL="https://${DOMAIN}"
SSH_OPTS=(-o BatchMode=yes -o IdentitiesOnly=yes -i "${HOME}/.ssh/id_rsa")
FORCE_NGINX=0
FORCE_DNS=0

for arg in "$@"; do
  case "$arg" in
    --nginx) FORCE_NGINX=1 ;;
    --dns) FORCE_DNS=1 ;;
    -h|--help)
      sed -n '2,30p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown flag: $arg (try --nginx or --dns)" >&2
      exit 1
      ;;
  esac
done

cd "$ROOT"

echo ""
echo "========================================"
echo " Soclover production deploy"
echo " Host:   $HOST"
echo " LAN:    $LAN_URL"
echo " Public: $PUBLIC_URL"
echo "========================================"
echo ""

# --- 1–2. Build + rsync + PM2 soclover ---
echo "==> [1/6] App build + rsync + PM2 restart"
"$ROOT/deploy_thinkcentre.sh"

# --- 3. Ensure mongo ---
echo ""
echo "==> [2/6] Ensure soclover-mongo (127.0.0.1:27017)"
ssh "${SSH_OPTS[@]}" "$HOST" bash -s <<'REMOTE_MONGO'
set -euo pipefail
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
MONGO_BIN="$HOME/mongodb/bin/mongod"
DATA_DIR="$HOME/soclover/data/db"
LOG_DIR="$HOME/soclover/logs"
mkdir -p "$DATA_DIR" "$LOG_DIR"
if [ ! -x "$MONGO_BIN" ]; then
  echo "ERROR: $MONGO_BIN missing. Install Mongo once (see AGENTS.md) or re-run initial setup." >&2
  exit 1
fi
if pm2 describe soclover-mongo >/dev/null 2>&1; then
  status="$(pm2 jlist | python3 -c 'import sys,json; apps=json.load(sys.stdin); print(next((a["pm2_env"]["status"] for a in apps if a["name"]=="soclover-mongo"),"missing"))')"
  if [ "$status" != "online" ]; then
    pm2 restart soclover-mongo
  else
    echo "soclover-mongo already online"
  fi
else
  pm2 start "$MONGO_BIN" --name soclover-mongo -- \
    --dbpath "$DATA_DIR" \
    --bind_ip 127.0.0.1 \
    --port 27017 \
    --logpath "$LOG_DIR/mongod.log" \
    --logappend
fi
pm2 save
REMOTE_MONGO

# --- 4. Sync helper scripts ---
echo ""
echo "==> [3/6] Sync scripts/ to remote"
ssh "${SSH_OPTS[@]}" "$HOST" "mkdir -p ~/${REMOTE_DIR}/scripts/nginx"
rsync -az \
  -e "ssh ${SSH_OPTS[*]}" \
  "$ROOT/scripts/" \
  "$HOST:~/${REMOTE_DIR}/scripts/"
ssh "${SSH_OPTS[@]}" "$HOST" "chmod +x ~/${REMOTE_DIR}/scripts/*.sh"

# --- 5. Optional Cloudflare DNS ---
echo ""
echo "==> [4/6] Cloudflare DNS"
if [[ "${SKIP_DNS:-0}" == "1" ]]; then
  echo "SKIP_DNS=1 — skipped"
elif [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] || [[ "$FORCE_DNS" == "1" ]]; then
  if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    echo "ERROR: --dns requires CLOUDFLARE_API_TOKEN" >&2
    exit 1
  fi
  "$ROOT/scripts/cloudflare-dns-soclover.sh"
else
  echo "No CLOUDFLARE_API_TOKEN — assuming DNS already set for ${DOMAIN}"
  if dig @1.1.1.1 +time=2 +short "$DOMAIN" A | grep -q .
  then
    echo "DNS resolves:"
    dig @1.1.1.1 +short "$DOMAIN" A | sed 's/^/  /'
  else
    echo "WARNING: ${DOMAIN} does not resolve yet."
    echo "  Dashboard: A ${DOMAIN} → 149.40.2.134 (Proxied)"
    echo "  Or: CLOUDFLARE_API_TOKEN=... $0 --dns"
  fi
fi

# --- 6. Nginx (only if needed / forced) ---
echo ""
echo "==> [5/6] Nginx + TLS for ${DOMAIN}"
NGINX_PRESENT=0
if ssh "${SSH_OPTS[@]}" "$HOST" "test -f /etc/nginx/sites-enabled/soclover.drpjl.com.conf"; then
  NGINX_PRESENT=1
fi

if [[ "${SKIP_NGINX:-0}" == "1" ]]; then
  echo "SKIP_NGINX=1 — skipped"
elif [[ "$FORCE_NGINX" == "1" || "$NGINX_PRESENT" == "0" ]]; then
  if [[ "$NGINX_PRESENT" == "1" ]]; then
    echo "Forcing nginx reinstall (--nginx)"
  else
    echo "Nginx vhost missing — installing (sudo password required)"
  fi
  # Need a TTY for sudo on the remote
  ssh -t -o IdentitiesOnly=yes -i "${HOME}/.ssh/id_rsa" "$HOST" \
    "cd ~/${REMOTE_DIR} && ./scripts/install-nginx-soclover.sh"
else
  echo "Nginx vhost already present — left unchanged (use --nginx to reinstall)"
fi

# --- 7. Smoke tests ---
echo ""
echo "==> [6/6] Smoke tests"
ssh "${SSH_OPTS[@]}" "$HOST" bash -s <<'REMOTE_SMOKE'
set -euo pipefail
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
echo -n "  local :3055  "
curl -fsS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3055/ || echo "FAIL"
echo -n "  features     "
curl -fsS http://127.0.0.1:3055/features || echo "FAIL"
echo
pm2 describe soclover >/dev/null && echo "  pm2 soclover: ok"
pm2 describe soclover-mongo >/dev/null && echo "  pm2 soclover-mongo: ok"
REMOTE_SMOKE

echo -n "  public HTTPS "
if curl -fsS -o /dev/null -w "%{http_code}\n" --max-time 15 "${PUBLIC_URL}/logon"; then
  :
else
  echo "FAIL (DNS/nginx may still be settling)"
fi

echo ""
echo "========================================"
echo " Deploy complete"
echo "  LAN:    ${LAN_URL}"
echo "  Public: ${PUBLIC_URL}"
echo "========================================"
echo ""
echo "Usual command next time:  ./deploy_production.sh"
echo "Force nginx refresh:      ./deploy_production.sh --nginx"
echo ""
