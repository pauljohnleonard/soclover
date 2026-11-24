#!/usr/bin/env bash
# Install nginx vhost for soclover.drpjl.com → Soclover :3055 on ThinkCentre.
# Does NOT modify SpeakKit, Jitsi, or cheese-jam site files.
#
#   ssh -t paul@192.168.1.66 'cd ~/soclover && ./scripts/install-nginx-soclover.sh'

set -euo pipefail

DOMAIN="${SOCLOVER_DOMAIN:-soclover.drpjl.com}"
SITE_NAME="soclover.drpjl.com.conf"
AVAILABLE="/etc/nginx/sites-available/${SITE_NAME}"
ENABLED="/etc/nginx/sites-enabled/${SITE_NAME}"
MAP_DEST="/etc/nginx/conf.d/soclover-websocket-map.conf"
WEBROOT="/var/www/html"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE="${SCRIPT_DIR}/nginx/${SITE_NAME}"
MAP_TEMPLATE="${SCRIPT_DIR}/nginx/soclover-websocket-map.conf"

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "This script is for the Linux nginx host (ThinkCentre)." >&2
  exit 1
fi

if ! [[ -t 0 ]]; then
  echo "Run with a TTY so sudo can prompt for your password:" >&2
  echo "  ssh -t paul@192.168.1.66 'cd ~/soclover && ./scripts/install-nginx-soclover.sh'" >&2
  exit 1
fi

if [[ ! -f "${TEMPLATE}" || ! -f "${MAP_TEMPLATE}" ]]; then
  echo "Missing nginx templates under ${SCRIPT_DIR}/nginx/" >&2
  exit 1
fi

if ! curl -fsS "http://127.0.0.1:3055/" >/dev/null; then
  echo "Soclover is not healthy on 127.0.0.1:3055 — start pm2 soclover first." >&2
  exit 1
fi

echo "Installing nginx vhost for ${DOMAIN} (proxy → 127.0.0.1:3055) ..."
echo "Will create/update: ${AVAILABLE} and ${MAP_DEST}"
echo "Will not modify meet/speakkit/cheese-jam configs."

sudo mkdir -p "${WEBROOT}/.well-known/acme-challenge"
sudo cp "${MAP_TEMPLATE}" "${MAP_DEST}"
sudo cp "${TEMPLATE}" "${AVAILABLE}"

if [[ ! -L "${ENABLED}" ]] && [[ ! -e "${ENABLED}" ]]; then
  sudo ln -s "${AVAILABLE}" "${ENABLED}"
  echo "Enabled ${ENABLED}"
else
  echo "Already enabled: ${ENABLED}"
fi

echo "Testing nginx config ..."
sudo nginx -t

echo "Reloading nginx (not restart) ..."
sudo systemctl reload nginx

if [[ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
  echo "Obtaining TLS cert for ${DOMAIN} via certbot ..."
  if ! command -v certbot >/dev/null 2>&1; then
    echo "certbot not found. Install certbot, then re-run this script." >&2
    exit 1
  fi
  sudo certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email --redirect
else
  echo "Cert already exists for ${DOMAIN}; ensuring nginx still valid ..."
  sudo nginx -t
  sudo systemctl reload nginx
fi

echo ""
echo "Checking ${DOMAIN} ..."
curl -fsS -o /dev/null -w "https %{http_code}\n" "https://${DOMAIN}/" || true
echo "Done. Public URL: https://${DOMAIN}/"
