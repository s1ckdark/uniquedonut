# Quiz Arena (`/quiz`) — Design

**Date:** 2026-09-16
**Status:** Approved
**Route:** `/quiz` (gino menu: "⚡ 구구단 챌린지")

## Goal

A points-based educational quiz game for the gino section. Current topic:
구구단 2단. Ten questions in random order, four choices each, a 5-second
timeout per question, and speed-based scoring — perfect run = 50 points.

## Rules & Scoring

- Questions: `2×1 … 2×10`, exactly one of each, order shuffled per game.
- 4 options: the answer + 3 distractors drawn from answer±1..3 (positive,
  unique, never equal to the answer), shuffled.
- Per-question points by elapsed time: under 1s → **5**, 1–2s → **4**,
  2–3s → **3**, 3–4s → **2**, 4–5s → **1**, wrong or ≥5s → **0**.
- Max total: 10 × 5 = **50 points**.
- After answering (or timing out): brief feedback flash (~1s) — correct
  answer highlighted, points popup on correct — then the next question.

## Game Flow

`intro → play ×10 → results`

- **intro**: rules card (10문제 · 5초 · 빠를수록 고득점 · 만점 50점) + start.
- **play**: progress "n/10" + running score, a shrinking 5-second gauge
  (green → yellow → red), the question "2 × 7 = ?", 2×2 option buttons.
- **results**: total /50 with medals (50 🏆 완벽해요! · ≥40 🥇 · ≥25 🥈 ·
  else 🥉) + retry. State only — no persistence.

## File Structure

```
src/lib/quiz.ts            # Pure: buildTimesTableQuiz, pointsForElapsed, shuffle
src/lib/quiz.test.ts       # Boundary + integrity tests
src/app/quiz/page.tsx      # Game state machine with the timer
src/data/gino.ts           # add entry
```

## Extensibility

`buildTimesTableQuiz(table)` is parameterized — when Gino moves to 3단,
passing `3` is the whole change (one constant in the page).

## Testing

`quiz.test.ts`:
- `buildTimesTableQuiz(2)`: 10 questions; the b-values are exactly 1..10;
  every option set has 4 unique positive values including the answer.
- `pointsForElapsed`: 0→5, 999→5, 1000→4, 2500→3, 4999→1, 5000→0, 7000→0.
- `shuffle` preserves the multiset of elements.

## gino Menu

`{ slug: "quiz-arena", name: "구구단 챌린지", description: "5초 안에 맞혀 포인트!", href: "/quiz", emoji: "⚡", color: "#FFD93D" }`.
