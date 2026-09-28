# Quiz Arena — Config & Leaderboard (`/quiz`) — Design Addendum

**Date:** 2026-09-28
**Status:** Approved
**Route:** `/quiz` (extends `2026-09-16-quiz-arena-design.md`)

## Goal

Turn the fixed quiz into a configurable game with a persistent leaderboard:
choose option count / times tables / timeout / question count before
playing, then optionally save the run (name, score, total time) to a
leaderboard stored in localStorage.

## Config Screen (replaces the intro card)

| Setting | UI | Default |
|---|---|---|
| 선택지 수 | 2/3/4/5지선다 segmented toggle | 3 |
| 구구단 단 | 2~10 toggle chips (multi) + "직접 입력" number field for 11단+ | [2] |
| 타임아웃 | slider 3–15초 | 5초 |
| 문항수 | slider 5–20문제 | 5문제 |

- At least one table required (start disabled otherwise).
- Question pool: selected tables × 1..9, sampled without repeats until the
  pool runs out; longer games allow repeats.

## Scoring (total always 50)

- Per-question max = 50 / questionCount (default 5 → 10점).
- Speed buckets generalized: `points = perQ × (buckets − elapsedSec) / buckets`
  where buckets = ceil(timeoutSec). Defaults keep the original 10/8/6/4/2.
- Wrong / timeout → 0. Non-integer results show one decimal (e.g. 12.5).

## Leaderboard (localStorage)

- Key `gino-quiz-leaderboard`; entries `{name, score, totalSeconds, date}`,
  capped at 50, sorted score desc → totalSeconds asc.
- After the results screen: "리더보드에 남길까요?" — name input (1–12 chars,
  trimmed) + [저장] / [건너뛰기] → leaderboard table (rank, name, score,
  총시간, date) with the fresh entry highlighted.
- Total time = start-of-game → last answer, measured client-side.
- Leaderboard also viewable from the setup screen ("🏆 리더보드").
- Pure, DOM-free helpers (`sanitizeEntry`, `sortEntries`, `formatTime`) are
  unit-tested; storage wrappers guard `typeof window`.

## Files

```
src/lib/quiz.ts             # rewritten: QuizConfig, DEFAULT_CONFIG, buildQuiz, pointsForElapsed
src/lib/quiz.test.ts        # updated for the new API
src/lib/leaderboard.ts      # new: entry helpers + localStorage wrappers
src/lib/leaderboard.test.ts # pure-helper tests
src/app/quiz/page.tsx       # setup → play → results(+save) → board
src/data/gino.ts            # description update
```

## Note

Storage is client-side by design — survives deploys, no server needed; runs
are per-browser (Gino's device). The earlier JSON-file/DB ideas are dropped.
