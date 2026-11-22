# Soclover — agent notes

Multiplayer clover-leaf word puzzle. Players create a “leaf” (5 cards × 4 words + 4 clues), then others rearrange cards to match the clues. Real-time sync over WebSockets; completed leaves persist in MongoDB.

## Workspace layout (Nx monorepo)

| Path | Role |
|------|------|
| `soclover/` | Angular 16 client (`prefix: soclover`) |
| `server/` | Express + `ws` game server (port **3055**) |
| `lib-soclover/` | Shared types + `applyPatch` (`@soclover/lib-soclover`) |
| `environments/` | Client env (`WSS_URL`, `API_URL`); toggle `localserver` |

Path alias: `@soclover/lib-soclover` → `lib-soclover/src/index.ts` (see `tsconfig.base.json`).

## Run locally

```bash
brew services start mongodb-community   # mongodb://localhost:27017/soclover
# Optional: OPENAI_API_KEY in repo-root .env (AI Generate on home)
npm run server                          # nx serve server
npm run soclover                        # nx serve soclover → http://0.0.0.0:4200
```

Set `localserver = true` in `environments/environment.ts` for local WS/API.

## Deploy

- Client: `./deploy_soclover.sh` → `nx b soclover --configuration=production` + Firebase Hosting (`dist/soclover`)
- Server: `./deploy_server.sh` → build + `scp` to `soclover-server.drpjl.com` (needs `PAULS_SERVER_KEY.pem`, gitignored)

Prod URLs (when `localserver` is false): `wss://soclover-server.drpjl.com/soclover`, `https://soclover-server.drpjl.com/soclover`.

## Domain model (shared)

- **Card**: `words[4]`, `slot`, `heapSlot`, UI fields (`guessOrientation`, `guessSlot`, `dragPos`, …)
- **Leaf**: player’s hand — `cards`, `clues[4]`, `submitted`, `solved`
- **Game**: `{ focusPlayerName?, leaves: Leaf[] }`
- **MessageType**: WebSocket protocol (`SEND_LOGON`, `NEW_LEAF`, `PATCH`, `SEND_LEAF_WITH_CLUES`, `STATE`, …)

Keep shared contracts in `lib-soclover`. Client UI-only constants live in `soclover/src/app/leafData.ts`.

## Client architecture

- Routes: `/logon`, `/home`, `/makeleaf`, `/solve`, `/browse` (`app.routes.ts`; most gated by `ConnectionService.canActivate`)
- **ConnectionService** — WebSocket to server
- **ModelService** — game state, patches, active players
- **UiService** — setting vs solving mode, petal focus, solve checks
- **LayoutService** — viewport / leaf sizing
- Board is SVG-driven clover UI (`leaf` component + `leafData`)

## Server architecture

- `main.ts` — HTTP + WS upgrade; REST: `/users-that-have-leaves`, `/fetch-leaves`, `/fetch-leaf/:id`
- **WaitingRoom** → **SocloverRoom** → **GameController**
- **makeHand()** — random 5-card hands from word lists under `server/src/assets/` / `words.ts`
- **MongoDB** singleton — saves submitted leaves via `HandModel`

## Conventions for agents

- Prefer small, focused changes; match existing Angular NgModule style (not standalone-by-default).
- Do not commit `.env`, `*.pem`, or secrets.
- Shared protocol/types → `lib-soclover`; do not duplicate enums/interfaces in client or server.
- Patches sync card UI state via `applyPatch` — preserve that shape when changing sync behavior.
- Existing code is somewhat WIP (many “WIP” commits); improve clarity when touching a file, but avoid drive-by refactors.
