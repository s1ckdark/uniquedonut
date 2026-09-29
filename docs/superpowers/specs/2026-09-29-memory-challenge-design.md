# Memory Challenge (`/memory`) — Design

**Date:** 2026-09-29
**Status:** Approved
**Route:** `/memory` (gino menu: "🧠 기억력 챌린지")

## Goal

A memory pair-matching game on the shared quiz platform: an N×N grid of
face-down number cards, flip two at a time to find pairs, with a
configurable time limit and a 100-point score that uploads to the same D1
leaderboard as the other challenges.

## Rules

- Grid sizes: 3×3, 4×4, 5×5, 6×6 (odd grids get one 🍩 bonus card that
  matches itself instantly — otherwise an odd card count can't pair).
- Cards show numbers 1..pairs; a mismatch flips both back after ~900ms.
- Time limit: slider 30–300s (default 60s). Running out ends the game.
- Moves counter shown for fun.
- Scoring (pure `computeMemoryScore`):
  - Completed → `50 + 50 × timeLeft/limit` (50–100; speed matters)
  - Timeout → `50 × found/total` (0–just under 50)
  - The bonus card counts as one unit of found/total.

## Difficulty (0–100, shared tier labels)

`n² + clamp(round((240 − limitSec)/8), 0, 24)` → 3×3/60s ≈ 31 🔥보통,
6×6/30s ≈ 60 ⚡어려움.

## Files

```
src/lib/memory.ts            # Pure: buildMemoryDeck, computeMemoryScore, memoryDifficulty (TDD)
src/lib/memory.test.ts
src/lib/quiz-content.ts      # topicEmoji gains "memory" → 🧠
src/app/memory/page.tsx      # setup → play (3D flip cards, timer) → results → save
src/data/gino.ts             # hub entry
```

Play UI: CSS 3D card flip (perspective + backface-hidden, added to
globals.css, respects prefers-reduced-motion), timer gauge like the other
games, matched cards lock with a green ring. Save prompt identical to the
other challenges (school + name, remembered per device), stored under
topic `memory`.

## Testing

Deck invariants (counts, bonus placement, paired values, unique ids),
score boundaries (complete full/half time, timeout fractions), difficulty
monotonicity. Route/UI verified via SSR + build as usual.
