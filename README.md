# Soclover

Multiplayer clover-leaf word puzzle. Create a leaf (five word cards + four clues), then solve others’ leaves in real time.

## Stack

- **Nx** monorepo — Angular 16 client, Node/Express + WebSocket server, shared `lib-soclover`
- **MongoDB** — persisted leaves
- **Firebase Hosting** — client deploy

## Prerequisites

- Node.js (repo uses Angular/Nx 17-era tooling)
- MongoDB locally: `brew services start mongodb-community`
- Optional: `OPENAI_API_KEY` in a repo-root `.env` for **AI Generate puzzle** on the home screen (`OPENAI_MODEL` defaults to `gpt-4o-mini`)

## Develop

```bash
npm install
# echo 'OPENAI_API_KEY=sk-...' >> .env   # required for Generate
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
