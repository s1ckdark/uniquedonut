# Camping Challenge (`/camping`) — Design

**Date:** 2026-10-08
**Status:** Approved
**Route:** `/camping` (gino menu: "🏕️ 캠핑 챌린지")

## Goal

A pass-and-play party game for 2–4 kids (initial audience: 6yo boy + two
8yo kids on a camping trip). One shared device; each player takes a turn
solving the same 8-round mixed challenge — memory, logic, math, word —
and the game ends with a campfire podium ranking 🥇🥈🥉. Age-adjusted
difficulty (6세/8세) keeps the youngest competitive. Results can be
saved to the shared D1 leaderboard (topic `camping` 🏕️); ranking itself
is fully local so it works offline at the campsite.

## Game structure

- One game = **8 rounds** = 🧠 memory ×2, 💡 logic ×2, 🔢 math ×2,
  ✏️ word ×2. Round **order** is shuffled from the game seed and is the
  **same for every player** (fair). Round **content** is generated
  per-player (seeded by game seed + player index) so a later player
  cannot copy answers by watching.
- Every round is 4-choice, 10s timeout, speed scoring via the existing
  quiz engine (`pointsForElapsed` with `questionCount: 8` → max 12.5 per
  round, 100 total). Feedback flash, then auto-advance.
- Rematch = same roster, new seed (new round order + new questions).

## Age adjustment

| Round | 6세 | 8세 |
|---|---|---|
| 🧠 memory | flash 4 emoji for 4s → "방금 없었던 것은?" | flash 6 emoji for 5s |
| 💡 logic | simple pattern continue (🍎🍌🍎🍌?) | patterns + odd-one-out, longer sequences |
| 🔢 math | add/sub, answer ≤ 10 | add/sub ≤ 50 + mul tables 2–5 |
| ✏️ word | dictation tier 1 (낱말) with 🔊 speech | dictation tier 2 (짧은 문장) with 🔊 speech |

Memory questions have two variants (drawn alternately): "방금 없었던
것" (answer = the item NOT flashed) and "방금 있었던 것" (answer = one
of the flashed items). Speech fallback shows the text when no Korean
voice is available, as in `/dictation`.

## Logic bank (new content)

`{ prompt, options[4], answer, level: 6 | 8 }` items — two families:
pattern-continue ("🍎🍌🍎🍌🍎 다음은?") and odd-one-out ("어느 것이
다른 그룹?"). ≥6 items per age level; drawn without repeat per game.

## Scoring & ranking

- Per-round speed points capped so the total is ≤ 100.
- Podium ranks by score desc, tie-break by total elapsed seconds asc.
- Podium shows each player's per-category breakdown
  ("🔢 24 · 🧠 22 · 💡 25 · ✏️ 19") as a parent-facing report.
- Difficulty badge per player: `campingDifficulty(age)` ≈ 22 (🌱) for
  6세, 34 (🔥) for 8세.

## Screen flow

1. **Setup** — 2–4 players, name + 6세/8세 toggle each. Roster saved to
   localStorage (`gino-camping-players`). Empty names → 참가자N.
2. **Handoff** — "다음 주자 {name}! 나머지는 화면 안 봐요 ✋" + start
   button. Blocks casual answer-sharing between siblings.
3. **Play** — round header (category emoji + n/8), category intro, flash
   phase for memory rounds (countdown → auto-hide → question), 4-choice
   buttons, 10s gauge, feedback, auto-advance.
4. **Podium** — campfire theme, 🥇🥈🥉 (🎖️ for 4th), score + time +
   category breakdown per player.
5. **Save** — one prompt submits every player to D1 (topic `camping`,
   per-player `difficulty`). Offline → "오프라인 — 순위는 화면에 있어요"
   and continue. Then 🔁 rematch / ✋ 종료.

## Files

```
src/lib/camping.ts             # Pure: logic bank, memory flash builder, game builder, ranking (TDD)
src/lib/camping.test.ts
src/lib/quiz-content.ts        # topicEmoji gains "camping" → 🏕️
src/app/camping/page.tsx       # Setup → handoff → play → podium → save
src/data/gino.ts               # hub entry
```

## Testing

Bank integrity (≥6 per level, 4 unique options, one answer, options
contain no duplicates), seed determinism (same seed → same game), same
category order for all players, different content per player, age
adjustment (6세 math answer ≤ 10; 8세 pool includes mul), ranking with
score/tie-break, total score cap 100, memory flash sets never contain
the answer item in the "없었던 것" variant.
