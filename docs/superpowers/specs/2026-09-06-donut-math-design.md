# Donut Math (`/math`) — Design

**Date:** 2026-09-06
**Status:** Approved
**Route:** `/math`

## Goal

A quiz-style page that teaches first graders the principle of
multiplication-as-repeated-addition, with donut visuals and instant
explanations after each answer. Fits the shop's demo pattern: pure
client-side, no server, no keys.

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Flow | Quiz-centered with instant explanation after each answer |
| Answer input | Multiple choice, 4 options, big touch-friendly buttons |
| Content scope | 8 questions covering all four aspects of the principle |
| Wrong answers | Question stays until the child picks correctly (learning reinforcement, no punishment) |
| Score | First-try correct count; results screen with retry |
| Persistence | None — score lives in React state only |

## Non-goals (YAGNI)

- No server, API, or AI provider — fully static client content.
- No user accounts, progress saving, or localStorage.
- No infinite/random question generation — a fixed, hand-authored set of 8.
- No challenge/difficulty stages.
- No sound effects.

## File Structure

```
src/lib/math-quiz.ts          # Question types, fixed question data, validation
src/lib/math-quiz.test.ts     # Unit tests for the validation rules
src/components/QuizCard.tsx   # Presentational: question, options, feedback, explanation
src/app/math/page.tsx         # Quiz state machine (intro → Q1..Q8 → results)
```

- `src/lib/math-quiz.ts` — **pure**: question type definitions, the 8
  hand-authored questions, expression evaluators (e.g. `"2+2+2"` → 6), and
  `validateQuestions()` which enforces the distractor rules below. No DOM,
  no React. Unit-tested.
- `src/components/QuizCard.tsx` — given one question plus interaction state,
  renders the question text, donut visual, four option buttons, and the
  explanation panel. Presentational only.
- `src/app/math/page.tsx` — owns the state machine, score, and navigation.
  Client component, mirrors the visualizer/ascii page structure.

## Question Model

```ts
interface QuizOption {
  label: string;      // e.g. "2 + 2 + 2", "4 × 3"
  value: number;      // evaluated value, e.g. 6, 12
  correct: boolean;
}

interface QuizQuestion {
  id: number;
  kind: "to-addition" | "to-multiplication" | "picture" | "commutative";
  prompt: string;              // Korean, 1st-grade friendly
  options: QuizOption[];       // exactly 4, exactly 1 correct
  explanation: {
    text: string;             // one or two friendly sentences
    plates?: number;          // donut visual: number of plates
    perPlate?: number;        // donuts per plate
    equation?: string;        // e.g. "2 + 2 + 2 = 6"
  };
}
```

The donut visual in explanations renders `plates` rows of `perPlate` donut
emojis with a per-plate count, then the total — the same visual language as
the chat explanation this page is based on.

## The 8 Questions

All answers follow the Korean textbook convention: **`a × b` = "a를 b번 더함"**
(so `3 × 4` = `3 + 3 + 3 + 3`). This convention is stated once in the intro
and applied consistently in every question and explanation.

1. **to-addition** — "2 × 3 을 더하기로 바꾸면?" → `2 + 2 + 2`
2. **to-addition** — "3 × 4 를 더하기로 바꾸면?" → `3 + 3 + 3 + 3`
3. **to-multiplication** — "4 + 4 + 4 를 곱하기로 바꾸면?" → `4 × 3`
4. **to-multiplication** — "2 + 2 + 2 + 2 를 곱하기로 바꾸면?" → `2 × 4`
5. **picture** — 3 plates with 4 donuts each shown; "도넛은 모두 몇 개? 곱하기식으로 고르세요" → `4 × 3` (4개씩 3번)
6. **picture** — 2 plates with 5 donuts each; → `5 × 2`
7. **commutative** — "3 × 4 와 순서만 바뀐 식은?" → `4 × 3`
8. **commutative** — "2 × 5 와 답이 같은 식은?" → `5 × 2`

Q1's explanation mentions that `3 + 3` also gives 6 — a deliberate bridge to
the commutativity questions (value-equal expressions are allowed in
*explanation text*, never as options).

## Distractor Rules (the core correctness rule)

To avoid mathematically ambiguous wrong options confusing a 6-year-old:

1. Every distractor's evaluated `value` **differs** from the correct answer's
   value. A distractor like `3 + 3` (= 6, same value as `2 + 2 + 2`) is
   forbidden — the child would be marked wrong for a mathematically true
   statement.
2. Exactly 4 options per question, exactly 1 flagged `correct`.
3. The correct option's value equals the expected answer.
4. Commutative-pair questions (Q7, Q8) must not include value-equal
   alternates other than the intended answer.

`validateQuestions(questions)` enforces all of this and is unit-tested. The
test suite runs it against the shipped question data, so a bad edit to the
data fails the build's test step.

## State Machine (`page.tsx`)

```
phase: "intro" → "quiz" → "results"
quiz: { index: 0..7, picked: number | null, firstTryCorrect: boolean, score: number }
```

- **intro**: title, one-line concept ("곱하기는 몇 번 더하기!"), 시작 버튼.
- **quiz**: progress "n / 8" bar; QuizCard for current question.
  - Correct pick → 🎉 feedback + explanation panel + "다음 문제" (last
    question: "결과 보기"). Score increments only if it was the first try.
  - Wrong pick → the picked option shakes and dims; gentle retry message
    ("앗! 다시 골라볼까요?"); question stays.
- **results**: score as "first-try correct / 8", donut emoji celebration,
  "다시 풀기" resets everything.

## Component (`QuizCard.tsx`)

Props: question, picked index, whether current pick was correct, callbacks.
Renders:
- Prompt (large, friendly).
- For `picture` kind: the donut grid visual (also shown pre-answer).
- Four option buttons — large rounded pills, Donut palette; correct state
  green glow, wrong state pink shake.
- After correct: explanation panel with donut-plate visual + equation.

Shake animation via a small CSS keyframe added to `globals.css`.

## Styling

Unique Donut tokens, consistent with other demo pages: `#1A0A2E` background,
`#FF6B9D`/`#FFD93D`/`#6BCB77` accents, Bungee Shade header "DONUT MATH",
Fredoka for body text, Space Grotesk for numerals. Big touch targets
(min-height 56px buttons) for small hands.

## Shop Integration

- Add `donut-math` entry to `src/data/donuts.ts` (Chef's Special, route
  `/math`, tags `Math`, `Kids`, price `$7.75`, color `#FFD93D`).
- Home page flavor count: 21 → 22.

## Error Handling

Static content — the failure modes are data mistakes, caught by
`validateQuestions()` in the test suite (option count, answer uniqueness,
value separation). Runtime errors are not expected beyond standard React.

## Testing

`src/lib/math-quiz.test.ts`:
- `evaluateExpression("2 + 2 + 2")` → 6 (and multiplication forms).
- `validateQuestions` accepts the shipped data (guards all rules above).
- A deliberately bad question (value-equal distractor) is rejected — proves
  the validator works.
