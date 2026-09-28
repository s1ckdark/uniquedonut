# Quiz Leaderboard on Cloudflare D1 — Design

**Date:** 2026-09-28
**Status:** Approved ("d1으로 리더보드를 쓰자")
**Route:** `/api/quiz/leaderboard` (new) + `/quiz` changes

## Goal

Move the quiz leaderboard from localStorage (per-device) to Cloudflare D1
(serverless SQLite) so every device shares one board and records survive
browser resets. Free tier is ample for this scale.

## Architecture

- **Binding**: `d1_databases: [{ binding: "DB", database_name:
  "uniquedonut-db", database_id: <user fills after `wrangler d1 create`> }]`
  in wrangler.jsonc. Local dev works via `initOpenNextCloudflareForDev()`
  (miniflare) with any placeholder id; only remote deploy needs the real id.
- **Schema** (auto-bootstrapped, idempotent, first request per environment):
  `scores (id INTEGER PK, name TEXT, score REAL, total_seconds REAL,
  difficulty INTEGER NULL, op TEXT NULL, topic TEXT NULL, created_at TEXT)`.
  All rows are kept; reads take the top 50.
- **Route handler** `src/app/api/quiz/leaderboard/route.ts`:
  - `GET` → top 50 `ORDER BY score DESC, total_seconds ASC, created_at DESC`,
    mapped to the client entry shape (`totalSeconds`, `date` = created_at).
  - `POST` → validate the body with the shared pure `sanitizeEntry`, insert,
    respond `{ id, entries }` (fresh top list) so the client highlights the
    new row by id.
  - Uses `getCloudflareContext()` from `@opennextjs/cloudflare`; minimal
    local D1 type declarations (no extra type package).
- **Client lib** `src/lib/leaderboard.ts`: pure helpers (sanitize/sort/
  format) stay; `loadLeaderboard`/`addEntry` (localStorage) are replaced by
  `fetchLeaderboard()` and `submitScore(entry)` hitting the API, sanitizing
  responses again as defense in depth. `LeaderboardEntry` gains `id?`.
- **Page** `/quiz`: `openBoard`/`saveScore` become async with a small
  loading state and an error message + retry when the API fails; the fresh
  row is highlighted by `id`.

## Testing

Pure-helper tests unchanged and still passing. API verified manually via
curl in dev (miniflare D1): POST then GET round-trip, invalid POST → 400.

## Remote setup (user, one-time, ~3 min)

1. `npx wrangler login`
2. `npx wrangler d1 create uniquedonut-db` → copy `database_id`
3. Paste it into `wrangler.jsonc`, then `npm run deploy`. The table
   auto-creates on the first request.
