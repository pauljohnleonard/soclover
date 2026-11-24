#!/usr/bin/env bash
# Deploy Soclover to ThinkCentre (paul@192.168.1.66) without touching other PM2 apps.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
HOST="${SOCLOVER_HOST:-paul@192.168.1.66}"
REMOTE_DIR="${SOCLOVER_REMOTE_DIR:-soclover}"
SSH_OPTS=(-o BatchMode=yes -o IdentitiesOnly=yes -i "${HOME}/.ssh/id_rsa")

cd "$ROOT"

echo "==> Building server + client"
npx nx b server --configuration=production
npx nx b soclover --configuration=production

echo "==> Checking remote port 3055 is free or already ours"
ssh "${SSH_OPTS[@]}" "$HOST" bash -s <<'REMOTE_CHECK'
set -euo pipefail
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
if ss -tln | grep -q ':3055'; then
  if pm2 describe soclover >/dev/null 2>&1; then
    echo "port 3055 in use by pm2 soclover — ok to redeploy"
  else
    echo "ERROR: port 3055 is in use by something other than pm2 soclover" >&2
    ss -tlnp | grep 3055 || true
    exit 1
  fi
else
  echo "port 3055 is free"
fi
REMOTE_CHECK

echo "==> Ensuring remote directories"
ssh "${SSH_OPTS[@]}" "$HOST" "mkdir -p ~/${REMOTE_DIR}/server ~/${REMOTE_DIR}/client"

echo "==> Rsync server build"
rsync -az --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  "$ROOT/dist/server/" \
  "$HOST:~/${REMOTE_DIR}/server/"

echo "==> Rsync client build"
rsync -az --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  "$ROOT/dist/soclover/" \
  "$HOST:~/${REMOTE_DIR}/client/"

echo "==> Rsync PM2 ecosystem"
rsync -az \
  -e "ssh ${SSH_OPTS[*]}" \
  "$ROOT/ecosystem.config.cjs" \
  "$HOST:~/${REMOTE_DIR}/ecosystem.config.cjs"

echo "==> Install production deps + restart only soclover"
ssh "${SSH_OPTS[@]}" "$HOST" bash -s <<REMOTE
set -euo pipefail
export NVM_DIR="\$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"
cd "\$HOME/${REMOTE_DIR}/server"
if [ -f package.json ]; then
  npm install --omit=dev
fi
# Preserve OPENAI_API_KEY if already present; ensure mongo URI
if [ ! -f "\$HOME/${REMOTE_DIR}/.env" ]; then
  printf '%s\n' 'MONGODB_URI=mongodb://127.0.0.1:27017/soclover' 'PORT=3055' > "\$HOME/${REMOTE_DIR}/.env"
  echo "Created ~/${REMOTE_DIR}/.env — add OPENAI_API_KEY there if needed"
fi
# Symlink so dotenv ../.env from server/ resolves
ln -sfn "\$HOME/${REMOTE_DIR}/.env" "\$HOME/${REMOTE_DIR}/server/.env" 2>/dev/null || true
cd "\$HOME/${REMOTE_DIR}"
if pm2 describe soclover >/dev/null 2>&1; then
  pm2 restart soclover --update-env
else
  pm2 start ecosystem.config.cjs
fi
pm2 save
pm2 describe soclover | head -30
REMOTE

echo "==> App deploy done. Open http://192.168.1.66:3055"
echo "    Full production (mongo check + nginx smoke): ./deploy_production.sh"
