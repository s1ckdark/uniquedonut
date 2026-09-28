# Quiz Arena — Four Operations (`/quiz`) — Design Addendum

**Date:** 2026-09-28
**Status:** Approved
**Route:** `/quiz` (extends the config + leaderboard design)

## Goal

Extend the quiz to all four operations with the identical pattern (setup →
timed play → points → leaderboard): ➕ 더하기, ➖ 빼기, ✖️ 곱하기, ➗ 나누기.

## Operand Ranges per Operation

- **✖️ 곱하기** — 단 선택 (2~10 + custom 11+), question `단 × (1..9)` (unchanged).
- **➗ 나누기** — same 단 chips; question `(단 × 1..9) ÷ 단`, quotient is the
  answer (e.g. 14 ÷ 2 = 7). Question stores `{a: dividend, b: divisor}`.
- **➕ 더하기** — 범위 chips 10/20/50/100/1000 (+ custom 10..10000);
  `1..range + 1..range`.
- **➖ 빼기** — same 범위 chips; larger − smaller so the answer is ≥ 0.

Distractors: mul/div keep answer±1..4 (+ neighbor tables for mul); add/sub
use `answer ± step×1..4` where `step = max(1, round(range/25))` (10→1,
100→4, 1000→40) so wrong options aren't trivially close at big ranges.

## Difficulty (0–100, same common parts)

- mul/div: existing table formula (div with the same 단 scores identically).
- add/sub: `clamp(round((log10(range) − 0.5) × 18), 6, 44)` →
  10→9, 20→14, 50→22, 100→27, 1000→44.
- options/timeout/question-count parts unchanged.

## Config & Types

`QuizConfig` gains `op: "add" | "sub" | "mul" | "div"` and `rangeMax`
(used by add/sub; default 10). `DEFAULT_CONFIG` stays `op: "mul", tables: [2]`.

Exports: `opSymbol` (＋ − × ÷) and `opEmoji` (➕➖✖️➗) for rendering;
`distractorStep(rangeMax)` pure helper.

## Leaderboard

Entries gain optional `op` (validated to the four keys; legacy entries
undefined). The board prefixes the name with the op emoji; legacy rows show
✖️ (the only operation before this change).

## Page

Operation selector row on top of setup; the range section swaps between 단
chips (mul/div) and 범위 chips (add/sub). Question text uses the op symbol.
Everything else (timer, scoring, save, board) is op-agnostic.

## Testing

Per-op generation invariants (sum correctness, a ≥ b for sub, divisibility
+ quotient 1..9 for div, operand ≤ range), distractorStep values, difficulty
ordering across ranges, div ≡ mul scoring, leaderboard op validation.
