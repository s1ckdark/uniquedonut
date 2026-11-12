# AI Usage Board (`/usage`) — Design

**Date:** 2026-11-12
**Status:** Approved (per the token-usage reference doc, option 2 — snapshot push)
**Route:** `/usage` (shop: "Token Board")

## Goal

A read-only dashboard of Dave's AI-tool token usage (claude, codex, zai,
antigravity, grok). Source data lives in Postgres on racknerd (Tailscale
only, not publicly reachable) — so the board follows the reference doc's
recommended architecture: the nightly job pushes one aggregated JSON
snapshot into this site's Cloudflare D1; the page reads only that. No
inbound path to the database exists.

## Snapshot flow

1. Dave's nightly job (separate repo/machine) runs the reference doc's
   queries and POSTs one JSON document to `POST /api/usage` with header
   `Authorization: Bearer <USAGE_PUSH_SECRET>` (env var, set via
   `wrangler secret`; never in source).
2. The route validates the payload (`validateUsageSnapshot`), then
   upserts a single row in D1 table `usage_board` (id=1, payload TEXT,
   synced_at) — atomic replace, matching the daily full-replacement model.
3. `GET /api/usage` returns the stored snapshot (or `{snapshot: null}`).
4. Empty state until the first push: the board shows a friendly
   "첫 적재 대기 중" panel instead of charts.

## Snapshot payload

```jsonc
{
  "syncedAt": "2026-11-12T00:00:30+09:00",   // ISO, KST
  "rows": 2700,
  "firstDay": "2025-06-25",
  "lastDay": "2026-11-11",
  "partial": false,
  "pricingAsOf": "2026-11-01",
  "totalTokens": 0,
  "totalUsd": 0.0,
  "daily": [{ "day": "YYYY-MM-DD", "tokens": 0, "usd": 0.0, "costComplete": true }],
  "providers": [{ "provider": "claude", "tokens": 0, "usd": 0.0 }],   // 최근 30일
  "models":    [{ "provider": "claude", "model": "claude-opus-5-5", "tokens": 0, "usd": 0.0 }], // top N
  "heatmap":   [{ "dow": 1, "hour": 0, "tokens": 0 }]   // 1=월…7=일, Z.AI 제외
}
```

Validation (lib): dates `YYYY-MM-DD`, dow 1–7, hour 0–23, non-negative
finite numbers, usd nullable, array caps (daily ≤ 800, providers ≤ 20,
models ≤ 40, heatmap ≤ 168), payload text ≤ 512 KB.

## Board sections (scroll motion via ScrollFX)

1. **Header** — last sync (KST), 단가 기준일, partial 배지, 총 토큰·총
   추정 비용 CountUp.
2. **잔디 캘린더** — full-range daily tokens, GitHub-style, cells fade in
   staggered; tooltip via `title`.
3. **추이 (SVG)** — last 90 days area/line that draws itself on scroll
   (stroke-dashoffset), usd toggle-able? (MVP: tokens only).
4. **최근 30일 제공자별** — GrowBar + share %.
5. **요일×시간 히트맵** — 7×24 CSS grid, log-scale color bins, "Z.AI는
   시간 정보 없음 제외" note.
6. **모덜 TOP** — GrowBar list.
7. **주의 표기** — "API 환산 추정" 배지 정착, cost_complete=false 부분
   합계, Grok −8%, 초기 구간 듬성.

## Files

```
src/lib/usage.ts               # types, validateUsageSnapshot, formatters, provider colors (TDD)
src/lib/usage.test.ts
src/app/api/usage/route.ts     # GET + secret-auth POST, D1 single-row upsert
src/app/usage/page.tsx         # board (client) — empty state aware
src/data/donuts.ts             # shop entry
```

## Testing

Validator (accepts the reference shape, rejects bad dates/dow/hour/
negative/oversized arrays), token/USD formatters (만/억, $), provider
color mapping fallback, calendar bucketing helper (weeks×7 grid layout).
API verified live: POST demo snapshot in dev → GET returns it → board
renders sections.

## Security notes

- Push secret only from env; 401 without exact match.
- D1 access via `prepare().bind()` — no string-interpolated SQL.
- Payload size + schema caps bound the D1 row size.
- Reader-facing data is already aggregate-only (no session/device info).
