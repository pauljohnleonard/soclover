# Soclover

Multiplayer clover-leaf word puzzle. Create a leaf (five word cards + four clues), then solve others’ leaves in real time.

## Stack

- **Nx** monorepo — Angular 16 client, Node/Express + WebSocket server, shared `lib-soclover`
- **MongoDB** — persisted leaves
- **ThinkCentre** — production host (`https://soclover.drpjl.com` and LAN `:3055`)

## Prerequisites

- Node.js (repo uses Angular/Nx 17-era tooling)
- MongoDB locally: `brew services start mongodb-community` (dev only)
- SSH access: `paul@192.168.1.66` with `~/.ssh/id_rsa`

## Develop

```bash
npm install
npm run server     # WebSocket + API on :3055
npm run soclover   # Angular app on :4200
```

Local URLs are controlled by `localserver` in `environments/environment.ts`.

## Production deploy

```bash
./deploy_production.sh
```

That builds, rsyncs to the ThinkCentre, restarts PM2, and checks `http://192.168.1.66:3055` plus `https://soclover.drpjl.com`.

```bash
./deploy_production.sh --nginx   # (re)install nginx vhost + certbot (asks for sudo)
CLOUDFLARE_API_TOKEN=... ./deploy_production.sh --dns   # upsert DNS if needed
```

## Projects

| Nx project | Path | Notes |
|------------|------|--------|
| `soclover` | `soclover/` | Angular UI |
| `server` | `server/` | Game server |
| `lib-soclover` | `lib-soclover/` | Shared types / patch helper |

See [AGENTS.md](./AGENTS.md) for architecture notes useful when working with AI in Cursor.
