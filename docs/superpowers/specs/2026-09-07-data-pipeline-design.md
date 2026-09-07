# Data Pipeline (`/pipeline`) — Design

**Date:** 2026-09-07
**Status:** Approved
**Route:** `/pipeline`

## Goal

An interactive schematic demo page visualizing how data flows through a
pipeline — concept-centered, donut-themed ("도넛 판매 데이터가 흘러가는 여정").
Animated particles travel between five stage cards; clicking a stage shows an
explanation panel. Fits the shop's demo pattern: pure client-side, no keys.

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Form | Interactive demo page (new route) |
| Content level | Concept-centered 5 stages; no specific tech stack required |
| Interaction | Flow animation + clickable node explanations + play/pause |
| Implementation | HTML stage cards + Canvas particle layer (hybrid) |
| Theme | Unique Donut shop sales data as the running example |

## Non-goals (YAGNI)

- No throughputs/error-path/speed controls (deferred; may add later).
- No real data sources, no server, no persistence.
- No tech-stack nodes (Kafka/Spark etc.) — concept stages only, with
  real-world hints inside the detail panel text.
- No drag/edit of the diagram.

## The 5 Stages

| # | id | name | short (one-liner) | accent |
|---|---|---|---|---|
| 1 | source | 소스 | 판매 기록이 발생하는 곳 | `#FF6B9D` |
| 2 | ingest | 수집 | 흩어진 데이터를 한곳으로 | `#FF8C42` |
| 3 | transform | 처리 | 정제하고 변환하고 집계 | `#FFD93D` |
| 4 | store | 저장 | 창고에 차곡차곡 | `#6BCB77` |
| 5 | serve | 시각화 | 대시보드로 의사결정 | `#00ccff` |

Each stage carries a detail payload for the explanation panel:
- `role` — what the stage does (1–2 sentences)
- `donutStory` — the donut-shop metaphor (kid-friendly)
- `examples` — 2–3 real-world hints (e.g. "실제로는: 스트리밍 수집, 배치 수집")

## File Structure

```
src/lib/pipeline.ts            # Pure: stages data, bezier geometry, particle logic
src/lib/pipeline.test.ts       # Unit tests for all of the above
src/components/PipelineCanvas.tsx  # Canvas rAF particle rendering layer
src/app/pipeline/page.tsx      # Page: stage cards + canvas + detail panel + controls
```

- `src/lib/pipeline.ts` — **pure**, no DOM/React:
  - `stages: PipelineStage[]` (fixed 5)
  - `positionOnSegment(from, to, t): Point` — cubic bezier between two points;
    control points sit at 35%/65% along the segment, each offset by
    `0.15 × length` along the segment's normal, giving a gentle bow that
    works for both horizontal (desktop) and vertical (mobile) segments
  - particle logic: `advanceParticle(p, dtMs)`, `updateParticles(list, dtMs)`
    (advance, move to next segment, remove past the last, cap at 40),
    `nextSpawnDelay()` (random 400–1000ms)
- `src/components/PipelineCanvas.tsx` — given stage center points and a
  `playing` flag, runs a requestAnimationFrame loop and draws glowing
  round particles in stage colors along the segments. No React state per
  frame (refs only). Pausing stops the loop and freezes particles in place.
- `src/app/pipeline/page.tsx` — client page. Lays out the 5 stage cards
  (flex row on desktop, column on mobile), measures card centers relative
  to the container after mount/resize, passes them to the canvas layer
  positioned behind the cards. Clicking a card selects the stage and shows
  the detail panel below. Play/pause button in the controls row.

## Data Flow

1. Page mounts → measures stage card centers → canvas knows the 4 segments.
2. Loop spawns particles at `source` every 400–1000ms (cap 40 total).
3. Each particle advances `t` by `speed * dt` on its segment; at `t ≥ 1` it
   hops to the next segment; after `serve` it is removed.
4. Clicking a stage card sets `selected` → panel shows role/donutStory/examples.
5. Pause stops the rAF loop; particles keep their positions until resume.

## Error Handling

Static content — main failure modes are geometry/mismatches, covered by unit
tests (stage count, unique ids, segment endpoints, particle lifecycle). If
card measurement returns zero sizes (SSR first paint), the canvas simply
skips spawning until real coordinates arrive.

## Testing

`src/lib/pipeline.test.ts`:
- stages: exactly 5, ordered `source → ingest → transform → store → serve`,
  unique ids, non-empty detail fields.
- `positionOnSegment`: t=0 returns `from`, t=1 returns `to`, t=0.5 lies
  between endpoints.
- `advanceParticle`/`updateParticles`: t grows with dt; segment hop at t≥1;
  removal after the last stage; cap of 40 enforced.

## Shop Integration

- Add `data-pipeline` entry to `src/data/donuts.ts` (Chef's Special, route
  `/pipeline`, tags `Data`, `Diagram`, price `$8.00`, color `#00ccff`).
- Home page flavor count: 22 → 23.
