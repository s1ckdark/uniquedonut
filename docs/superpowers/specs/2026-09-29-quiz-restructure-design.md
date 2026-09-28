# Gino Quiz Restructure — Design

**Date:** 2026-09-29
**Status:** Approved (incl. the /quiz → /gugudan URL change)

## Goal

Split the quiz into three focused experiences: a times-tables-only 챌린지,
a daily mixed-ops 산수 놀이터, and story pages with their quizzes embedded
inline.

## 1. 구구단 챌린지 — `/gugudan` (renamed from `/quiz`)

Mul-only: the op selector, add/sub/div branches, range settings, and the
content-topic selector are removed. Kept: 단 chips (2~10 + custom), attack/
free modes, option count, timeout, question count, the shared D1
leaderboard (school included), 100-point scoring. Header becomes
"GUGUDAN / 구구단 챌린지 ⚡".

## 2. 산수 놀이터 — `/arithmetic` (new)

**오늘의 산수**: 10 questions seeded by the date (mulberry32 + YYYYMMDD
seed + level offset) — identical for everyone all day, new set at midnight.
Ops mixed with a guaranteed appearance of all four.

Levels: 🌱 쉬움 (add/sub ≤10, mul/div tables 2–5) · 🔥 보통 (≤50, tables
2–9) · ⚡ 도전 (≤100, tables 2–12). Fixed 10s timeout, 4-choice, attack
mode, same 100-point engine.

**🔥 streak**: completed dates in localStorage; the flame count shows the
consecutive-day run (today or yesterday anchored). Completing the day's set
marks it.

Saves to the shared D1 leaderboard with topic `daily-math` (🧮).

## 3. Story quizzes inline — `ContentQuiz` component

A reusable client component appended to the 8 story pages (🌊🦗🦀🪲🤧💉😴🐎):
idle → "🎬 이야기 퀴즈 풀기 (6문제)" → free-mode play (no timer —
comprehension over speed, fixed 16.7/question → 100) → save prompt
(school + name) → rank confirmation. Saves with the page's topic slug.

## Lib changes (`src/lib/quiz.ts`)

- `type Rng = () => number`; `shuffleWith(arr, rng)` (existing `shuffle`
  stays Math.random); question builders take an rng.
- `buildDailyMathQuiz(dateStr, level, questionCount = 10, optionCount = 4)`
  — deterministic per (date, level).
- `topicEmoji(slug)` in quiz-content (story emojis + `daily-math` → 🧮).

## gino hub

- ⚡ 구구단 챌린지 → `/gugudan`
- 🧮 산수 놀이터 → `/arithmetic` (new entry)
- Story entries unchanged (their quizzes are now on-page).

## Testing

Determinism (same date+level → identical output; different levels differ),
operand bounds per level, all four ops present, option validity; topicEmoji
mapping; existing suites untouched.
