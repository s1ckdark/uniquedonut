# Usage League (`/usage` multi-participant) — Design

**Date:** 2026-11-13
**Status:** Approved (WakaTime-model option picked by Dave)
**Route:** `/usage` + `/api/usage*`

## Goal

Turn the personal Token Board into a friends league: each participant
runs the same pipeline on their own machine (loader → local aggregate →
nightly push). No scraping — identity comes from a per-participant push
key. The board keeps Dave's detail view and adds a league ranking.

## Identity & auth

- **Bearer key → participant name** (payload never carries a name).
  - The existing global `USAGE_PUSH_SECRET` maps to the owner **"dave"**
    — the running racknerd cron needs zero changes.
  - Friends get individual keys stored in D1 `usage_participants
    (id, name UNIQUE, key UNIQUE, created_at)`, issued via
    `POST /api/usage/participants` `{name}` with the master key (admin).
  - Key format: 32-hex (`crypto.randomUUID()` minus dashes). Returned
    once at issuance; `GET /api/usage/participants` (admin) lists names
    without keys.
- Name rules: 1–16 chars, letters/digits/hangul/space/-/_ (validated in
  lib, reused by API).

## Storage

- New `usage_snapshots (participant TEXT PRIMARY KEY, payload TEXT,
  synced_at TEXT, updated_at TEXT)` — one row per participant, upserted
  on push (same daily full-replacement model).
- Legacy `usage_board` row (id=1) is read as a "dave" fallback until the
  first push lands in the new table, so the board never goes blank.

## GET /api/usage

```jsonc
{
  "snapshot": {...},        // dave's latest (owner view, may be null)
  "report": {...},          // dave's daily report
  "league": [               // ranked by usd30d desc
    { "name": "dave", "lastDay": "...", "lastSync": "...",
      "totalTokens": 0, "totalUsd": 0, "tokens30d": 0, "usd30d": 0,
      "delta7dPct": 0, "rank": 1 }
  ]
}
```

`tokens30d/usd30d` sum daily rows within 30 days of the snapshot's
lastDay; `delta7dPct` compares the last complete 7 days vs the prior 7.

## POST /api/usage

Same snapshot validation; upsert into `usage_snapshots` under the
key-derived participant name. Response `{ok, participant, syncedAt}`.

## Board page

After the daily-report card: **🏆 리그 랭킹** — one row per participant
(rank medal, name, 30일 $, 30일 토큰, 7일 추세 chip, 최근 갱신). Fairness
note under the section: raw tokens favor cache-heavy providers; the $-axis
is the fair one. Hidden when only one participant exists.

## Testing

Name validator, participant summary (30d window anchored at lastDay,
7d delta), ranking (usd30d desc, tie → tokens30d desc), legacy fallback
shape. API verified live in dev: issue a demo participant key → push a
second snapshot under it → GET shows both + league ordering.

## Security

- Keys are looked up via `prepare().bind()` (no interpolation); key
  comparison happens in SQL/indexed lookup.
- Master key stays env-only; participant keys live only in D1 + the
  one-time issuance response.
- Rate/abuse: MVP relies on invite-only issuance; payloads remain
  aggregate-only (no prompts/files), caps unchanged (512 KB, array caps).
