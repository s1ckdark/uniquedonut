# Dictation Challenge (`/dictation`) — Design

**Date:** 2026-10-03
**Status:** Approved
**Route:** `/dictation` (gino menu: "📝 받아쓰기")

## Goal

A listen-and-pick dictation game: the word is spoken aloud (browser
speechSynthesis, ko-KR), and the child picks the correct spelling from
four choices — distractors are realistic Korean misspelling traps
(사이시옷, 된소리, 두음법칙, 안/않, 되/돼, 띄어쓰기, 겹받침).

## Mechanics

- 🔊 재생 button speaks the word (rate ~0.85 for clarity); replays freely.
- 4 text choices, one correct; 10 questions, 10s timeout, speed-based
  100-point scoring — same engine as arithmetic/gugudan.
- Fallback: when speechSynthesis or a Korean voice is unavailable, the
  word is shown on screen instead (맞춤법 고르기 모드).
- Save to the shared D1 leaderboard with topic `dictation` (📝), school +
  name prompt as elsewhere.

## Tiers

🌱 낱말 (1-2학년), 🔥 짧은 문장·헷갈리는 낱말 (3-4학년), ⚡ 어려운
낱말·문장 (5-6학년). Bank: ≥8 entries per tier, each `{ word, distractors[3] }`.
Difficulty: tier base 16/26/36 + timeout 12 + count 5 → 33/43/53.

## Files

```
src/lib/dictation.ts          # Pure: word bank, buildDictationQuestions, difficulty (TDD)
src/lib/dictation.test.ts
src/lib/quiz-content.ts       # topicEmoji gains "dictation" → 📝
src/app/dictation/page.tsx    # Setup → play (speech + 4-choice) → results → save
src/data/gino.ts              # hub entry
```

## Testing

Bank integrity (3 tiers × ≥8, exactly 3 distractors, unique, distractors
differ from the answer), question building (count, 4 unique options
including the answer, shuffle), difficulty ordering across tiers.
