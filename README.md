# Soclover

Multiplayer clover-leaf word puzzle. Create a leaf (five word cards + four clues), then solve others’ leaves in real time.

## Stack

- **Nx** monorepo — Angular 16 client, Node/Express + WebSocket server, shared `lib-soclover`
- **MongoDB** — persisted leaves
- **Firebase Hosting** — client deploy

## Prerequisites

- Node.js (repo uses Angular/Nx 17-era tooling)
- MongoDB locally: `brew services start mongodb-community`

## Develop

```bash
npm install
npm run server     # WebSocket + API on :3055
npm run soclover   # Angular app on :4200
```

Local URLs are controlled by `localserver` in `environments/environment.ts`.

## Projects

| Nx project | Path | Notes |
|------------|------|--------|
| `soclover` | `soclover/` | Angular UI |
| `server` | `server/` | Game server |
| `lib-soclover` | `lib-soclover/` | Shared types / patch helper |

See [AGENTS.md](./AGENTS.md) for architecture notes useful when working with AI in Cursor.
