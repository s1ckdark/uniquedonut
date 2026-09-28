# Quiz Arena — Content Topic Quizzes (`/quiz`) — Design Addendum

**Date:** 2026-09-28
**Status:** Approved
**Route:** `/quiz`

## Goal

Let the arena quiz the gino story pages themselves: a topic selector adds
eight content subjects next to math, each with a six-question bank written
from the actual page content.

## Topic Selector (top of setup)

`🧮 산수` (existing four operations) plus content chips: 🌊 달과 바다,
🦗 사마귀 관찰, 🦀 꽃게의 일생, 🪲 수액 나무 친구들, 🤧 감기 이야기,
💉 주사와 방패, 😴 키 크는 잠, 🐎 천고마비.

With a topic selected: op / option-count / table-range sections hide
(content questions are fixed 4-choice); timeout and question-count still
apply.

## Question Bank (`src/lib/quiz-content.ts`)

`ContentTopic { slug, name, emoji, baseDifficulty, questions }` × 8, six
questions each (48 total), each `{ prompt, options[4], answer }` — facts
lifted from the real pages (two high tides per revolution, 암컷 6 마디,
조에아→메가로파, 사슴벌레 턱 vs 장수풍뎅이 머리 뿔, 치료사는 우리 몸,
모의 훈련 백신, 깊은 잠 첫 3시간, 天高馬肥…). baseDifficulty per topic:
달과바다 40, 사마귀 34, 꽃게 34, 수액 34, 주사 32, 감기 30, 잠 30, 천고마비 28.

## Unified Play Question

`PlayQuestion { display, options: string[], answer: string }` — math maps
to `"{a} {sym} {b} = ?"` with numeric options stringified; content maps
prompt + shuffled text options. `buildPlayQuestions(config)` returns them;
the play UI only consumes this shape. `QuizConfig` gains optional `topic`.

## Difficulty

Topic runs: `base + timeoutPts + countPts` (no option part), clamped 0–100.

## Leaderboard

Entries gain optional `topic` (slug pattern `^[a-z0-9-]{1,30}$`); the board
prefixes names with the topic emoji, falling back to op emoji, then ✖️.

## Testing

Bank integrity (8 topics × 6, unique options, answer present, unique slugs),
buildPlayQuestions for math + content (count, shuffles, repeats beyond the
bank), topic difficulty math, leaderboard topic validation.
