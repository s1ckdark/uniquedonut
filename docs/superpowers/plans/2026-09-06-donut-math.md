# Donut Math Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/math` quiz page that teaches first graders multiplication-as-repeated-addition with donut visuals and instant explanations.

**Architecture:** Pure client-side page matching the shop's demo pattern. Question data + validation live in pure, unit-tested functions in `src/lib/math-quiz.ts`. A presentational `QuizCard` renders one question; the page owns the intro → quiz → results state machine. No server, no keys, no persistence.

**Tech Stack:** Next.js 16 app router (`"use client"` page), React 19, Tailwind v4, TypeScript. Tests via existing `node:test` + `tsx` (`npm test`).

**Spec:** `docs/superpowers/specs/2026-09-06-donut-math-design.md`

## Global Constraints

- Korean textbook convention everywhere: `a × b` = "a를 b번 더함" (3 × 4 = 3+3+3+3).
- Every distractor's value differs from the correct answer's value (no value-equal options).
- Exactly 4 options per question, exactly 1 correct.
- Fixed 8 questions; no randomization, no localStorage.
- Unique Donut tokens: `#1A0A2E` bg, `#FF6B9D`/`#FFD93D`/`#6BCB77` accents, Bungee Shade header "DONUT MATH", Fredoka body, min-height 56px option buttons.
- Use `×` (U+00D7) and `–`/`-` consistently in labels; the evaluator handles `+` and `×` only.

---

## Task 1: Expression evaluator (TDD)

**Files:**
- Create: `src/lib/math-quiz.ts`
- Test: `src/lib/math-quiz.test.ts`

**Interfaces:**
- Produces: `evaluateExpression(expr: string): number`, `evaluateEquation(eq: string): boolean` — used by Tasks 2 and 3.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/math-quiz.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateExpression, evaluateEquation } from "./math-quiz";

test("evaluateExpression: sums plus-separated numbers", () => {
  assert.equal(evaluateExpression("2 + 2 + 2"), 6);
  assert.equal(evaluateExpression("4 + 4 + 4"), 12);
});

test("evaluateExpression: multiplies ×-separated numbers", () => {
  assert.equal(evaluateExpression("4 × 3"), 12);
  assert.equal(evaluateExpression("5 × 2"), 10);
});

test("evaluateExpression: single number parses", () => {
  assert.equal(evaluateExpression("12"), 12);
});

test("evaluateEquation: both sides equal is true", () => {
  assert.ok(evaluateEquation("2 + 2 + 2 = 6"));
  assert.ok(evaluateEquation("4 × 3 = 12"));
});

test("evaluateEquation: unequal sides is false", () => {
  assert.ok(!evaluateEquation("2 + 2 + 2 = 7"));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot find module `./math-quiz`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/math-quiz.ts`:
```ts
// Donut Math quiz: types, evaluator, validator, and the shipped questions.
// Pure module — no DOM, no React. Unit-tested via math-quiz.test.ts.

export type QuestionKind =
  | "to-addition"
  | "to-multiplication"
  | "picture"
  | "commutative";

export interface QuizOption {
  label: string; // e.g. "2 + 2 + 2", "4 × 3"
  value: number; // evaluated value; cross-checked against label by the validator
  correct: boolean;
}

export interface QuizExplanation {
  text: string; // one or two friendly sentences
  plates?: number; // donut visual: number of plates
  perPlate?: number; // donuts per plate
  equation?: string; // e.g. "2 + 2 + 2 = 6"
}

export interface QuizQuestion {
  id: number;
  kind: QuestionKind;
  prompt: string;
  options: QuizOption[];
  explanation: QuizExplanation;
}

/** Evaluate a simple expression of integers joined by " + " or " × "
 *  (never mixed). Quiz labels are always one of these two shapes. */
export function evaluateExpression(expr: string): number {
  const trimmed = expr.trim();
  if (trimmed.includes("×")) {
    return trimmed
      .split("×")
      .map((part) => Number(part.trim()))
      .reduce((a, b) => a * b, 1);
  }
  return trimmed
    .split("+")
    .map((part) => Number(part.trim()))
    .reduce((a, b) => a + b, 0);
}

/** True when both sides of "left = right" evaluate to the same number. */
export function evaluateEquation(eq: string): boolean {
  const [left, right] = eq.split("=");
  if (right === undefined) return false;
  return evaluateExpression(left) === evaluateExpression(right);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — new evaluator tests (plus all prior suites).

- [ ] **Step 5: Commit**

```bash
git add src/lib/math-quiz.ts src/lib/math-quiz.test.ts
git commit -m "feat(math): add expression evaluator for quiz labels"
```

---

## Task 2: Question validator (TDD)

**Files:**
- Modify: `src/lib/math-quiz.ts`
- Test: `src/lib/math-quiz.test.ts`

**Interfaces:**
- Consumes: `evaluateExpression`, `evaluateEquation` from Task 1.
- Produces: `validateQuestions(questions: QuizQuestion[]): string[]` — returns violation messages; empty array = valid. Used by Task 3's data test and any future edits.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/math-quiz.test.ts` (extend the import):
```ts
import { validateQuestions, type QuizQuestion } from "./math-quiz";

// Helper: minimal well-formed question for mutation tests.
function goodQuestion(): QuizQuestion {
  return {
    id: 1,
    kind: "to-addition",
    prompt: "2 × 3 을 더하기로 바꾸면?",
    options: [
      { label: "2 + 2 + 2", value: 6, correct: true },
      { label: "2 + 3", value: 5, correct: false },
      { label: "3 + 3 + 3", value: 9, correct: false },
      { label: "2 + 2", value: 4, correct: false },
    ],
    explanation: {
      text: "2를 3번 더하는 거예요!",
      plates: 3,
      perPlate: 2,
      equation: "2 + 2 + 2 = 6",
    },
  };
}

test("validateQuestions: accepts a well-formed question", () => {
  assert.deepEqual(validateQuestions([goodQuestion()]), []);
});

test("validateQuestions: rejects wrong option count", () => {
  const q = goodQuestion();
  q.options = q.options.slice(0, 3);
  assert.ok(validateQuestions([q]).length > 0);
});

test("validateQuestions: rejects zero or multiple correct flags", () => {
  const noCorrect = goodQuestion();
  noCorrect.options[0].correct = false;
  assert.ok(validateQuestions([noCorrect]).length > 0);

  const twoCorrect = goodQuestion();
  twoCorrect.options[1].correct = true;
  assert.ok(validateQuestions([twoCorrect]).length > 0);
});

test("validateQuestions: rejects value-equal distractor", () => {
  const q = goodQuestion();
  q.options[1] = { label: "3 + 3", value: 6, correct: false }; // 6 === 6
  assert.ok(validateQuestions([q]).length > 0);
});

test("validateQuestions: rejects option value not matching its label", () => {
  const q = goodQuestion();
  q.options[0].value = 7; // label "2 + 2 + 2" evaluates to 6
  assert.ok(validateQuestions([q]).length > 0);
});

test("validateQuestions: rejects explanation equation that is false", () => {
  const q = goodQuestion();
  q.explanation.equation = "2 + 2 + 2 = 7";
  assert.ok(validateQuestions([q]).length > 0);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `validateQuestions` not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `src/lib/math-quiz.ts`:
```ts
/** Validate quiz data integrity. Returns a list of violations; empty = valid.
 *  Rules (see spec): 4 options, exactly 1 correct, distractor values differ
 *  from the answer's value, option.value matches its label, explanation
 *  equations hold, ids unique. */
export function validateQuestions(questions: QuizQuestion[]): string[] {
  const violations: string[] = [];
  const seenIds = new Set<number>();

  for (const q of questions) {
    const tag = `Q${q.id}`;
    if (seenIds.has(q.id)) violations.push(`${tag}: duplicate id`);
    seenIds.add(q.id);

    if (q.options.length !== 4) {
      violations.push(`${tag}: expected 4 options, got ${q.options.length}`);
    }
    const correct = q.options.filter((o) => o.correct);
    if (correct.length !== 1) {
      violations.push(`${tag}: expected exactly 1 correct option, got ${correct.length}`);
      continue;
    }

    const answer = correct[0];
    for (const opt of q.options) {
      if (evaluateExpression(opt.label) !== opt.value) {
        violations.push(`${tag}: option "${opt.label}" value ${opt.value} != evaluated ${evaluateExpression(opt.label)}`);
      }
      if (!opt.correct && opt.value === answer.value) {
        violations.push(`${tag}: distractor "${opt.label}" equals answer value ${answer.value}`);
      }
    }

    if (q.explanation.equation && !evaluateEquation(q.explanation.equation)) {
      violations.push(`${tag}: explanation equation "${q.explanation.equation}" is false`);
    }
  }
  return violations;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/math-quiz.ts src/lib/math-quiz.test.ts
git commit -m "feat(math): add question data validator"
```

---

## Task 3: The 8 shipped questions (TDD)

**Files:**
- Modify: `src/lib/math-quiz.ts`
- Test: `src/lib/math-quiz.test.ts`

**Interfaces:**
- Consumes: types from Task 1, `validateQuestions` from Task 2.
- Produces: `quizQuestions: QuizQuestion[]` (8 items) and `TOTAL_QUESTIONS = 8` — used by the page (Task 5) and QuizCard (Task 4).

All answers follow `a × b` = "a를 b번 더함".

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/math-quiz.test.ts` (extend the import):
```ts
import { quizQuestions, TOTAL_QUESTIONS } from "./math-quiz";

test("shipped quiz data passes the validator", () => {
  assert.deepEqual(validateQuestions(quizQuestions), []);
});

test("shipped quiz has 8 questions covering all four kinds twice", () => {
  assert.equal(quizQuestions.length, TOTAL_QUESTIONS);
  assert.equal(TOTAL_QUESTIONS, 8);
  const counts = new Map<string, number>();
  for (const q of quizQuestions) {
    counts.set(q.kind, (counts.get(q.kind) ?? 0) + 1);
  }
  assert.equal(counts.get("to-addition"), 2);
  assert.equal(counts.get("to-multiplication"), 2);
  assert.equal(counts.get("picture"), 2);
  assert.equal(counts.get("commutative"), 2);
});

test("picture questions carry plate data for the visual", () => {
  for (const q of quizQuestions.filter((q) => q.kind === "picture")) {
    assert.ok(q.explanation.plates && q.explanation.plates > 0);
    assert.ok(q.explanation.perPlate && q.explanation.perPlate > 0);
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `quizQuestions` not exported.

- [ ] **Step 3: Write the question data**

Append to `src/lib/math-quiz.ts`. Option values verified against the evaluator; distractor values all differ from the answer value:
```ts
export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    kind: "to-addition",
    prompt: "2 × 3 을 더하기로 바꾸면?",
    options: [
      { label: "2 + 2 + 2", value: 6, correct: true },
      { label: "2 + 3", value: 5, correct: false },
      { label: "3 + 3 + 3", value: 9, correct: false },
      { label: "2 + 2", value: 4, correct: false },
    ],
    explanation: {
      text: "2 × 3 은 “2를 3번 더하기”예요. 도넛 2개씩 3접시면 모두 6개! (소식: 3 + 3 도 6이 된답니다. 무슨 마법인지 7번 문제에서 만나요!)",
      plates: 3,
      perPlate: 2,
      equation: "2 + 2 + 2 = 6",
    },
  },
  {
    id: 2,
    kind: "to-addition",
    prompt: "3 × 4 를 더하기로 바꾸면?",
    options: [
      { label: "3 + 3 + 3 + 3", value: 12, correct: true },
      { label: "3 + 3 + 3", value: 9, correct: false },
      { label: "4 + 4", value: 8, correct: false },
      { label: "3 + 4", value: 7, correct: false },
    ],
    explanation: {
      text: "3 × 4 는 “3을 4번 더하기”! 사탕 3개씩 4줄이면 모두 12개예요.",
      plates: 4,
      perPlate: 3,
      equation: "3 + 3 + 3 + 3 = 12",
    },
  },
  {
    id: 3,
    kind: "to-multiplication",
    prompt: "4 + 4 + 4 를 곱하기로 바꾸면?",
    options: [
      { label: "4 × 3", value: 12, correct: true },
      { label: "4 + 3", value: 7, correct: false },
      { label: "3 × 3", value: 9, correct: false },
      { label: "4 × 4", value: 16, correct: false },
    ],
    explanation: {
      text: "4가 3번 반복되었죠? “4를 3번”은 4 × 3 !",
      plates: 3,
      perPlate: 4,
      equation: "4 × 3 = 12",
    },
  },
  {
    id: 4,
    kind: "to-multiplication",
    prompt: "2 + 2 + 2 + 2 를 곱하기로 바꾸면?",
    options: [
      { label: "2 × 4", value: 8, correct: true },
      { label: "2 + 4", value: 6, correct: false },
      { label: "4 × 4", value: 16, correct: false },
      { label: "2 × 2", value: 4, correct: false },
    ],
    explanation: {
      text: "2가 4번 반복! “2를 4번”은 2 × 4 이에요.",
      plates: 4,
      perPlate: 2,
      equation: "2 × 4 = 8",
    },
  },
  {
    id: 5,
    kind: "picture",
    prompt: "도넛은 모두 몇 개일까요? 곱하기식으로 고르세요!",
    options: [
      { label: "4 × 3", value: 12, correct: true },
      { label: "3 + 4", value: 7, correct: false },
      { label: "3 × 3", value: 9, correct: false },
      { label: "4 × 4", value: 16, correct: false },
    ],
    explanation: {
      text: "도넛 4개씩 3접시! “4를 3번” 더하면 4 + 4 + 4 = 12, 곱하기로는 4 × 3 이에요.",
      plates: 3,
      perPlate: 4,
      equation: "4 + 4 + 4 = 12",
    },
  },
  {
    id: 6,
    kind: "picture",
    prompt: "도넛은 모두 몇 개일까요? 곱하기식으로 고르세요!",
    options: [
      { label: "5 × 2", value: 10, correct: true },
      { label: "2 + 5", value: 7, correct: false },
      { label: "5 × 5", value: 25, correct: false },
      { label: "2 × 2", value: 4, correct: false },
    ],
    explanation: {
      text: "도넛 5개씩 2접시! “5를 2번” 더하면 5 + 5 = 10, 곱하기로는 5 × 2 예요.",
      plates: 2,
      perPlate: 5,
      equation: "5 + 5 = 10",
    },
  },
  {
    id: 7,
    kind: "commutative",
    prompt: "3 × 4 와 순서만 바뀐 식은?",
    options: [
      { label: "4 × 3", value: 12, correct: true },
      { label: "3 + 4", value: 7, correct: false },
      { label: "4 × 4", value: 16, correct: false },
      { label: "3 × 5", value: 15, correct: false },
    ],
    explanation: {
      text: "3 × 4 와 4 × 3 은 답이 똑같이 12! 같은 도넛을 가로로 세나 세로로 세나 개수는 그대로랍니다.",
      plates: 3,
      perPlate: 4,
      equation: "3 × 4 = 4 × 3",
    },
  },
  {
    id: 8,
    kind: "commutative",
    prompt: "2 × 5 와 답이 같은 식은?",
    options: [
      { label: "5 × 2", value: 10, correct: true },
      { label: "2 + 5", value: 7, correct: false },
      { label: "5 × 5", value: 25, correct: false },
      { label: "2 × 6", value: 12, correct: false },
    ],
    explanation: {
      text: "2 × 5 = 10, 5 × 2 도 10! 순서를 바꿔도 답은 같아요. 손가락 5개씩 두 손을 떠올려보세요.",
      plates: 2,
      perPlate: 5,
      equation: "2 × 5 = 5 × 2",
    },
  },
];

export const TOTAL_QUESTIONS = quizQuestions.length;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — validator accepts the shipped data (this is the load-bearing test: a bad data edit now fails CI).

- [ ] **Step 5: Commit**

```bash
git add src/lib/math-quiz.ts src/lib/math-quiz.test.ts
git commit -m "feat(math): add the 8 shipped quiz questions"
```

---

## Task 4: QuizCard component + shake animation

**Files:**
- Create: `src/components/QuizCard.tsx`
- Modify: `src/app/globals.css` (append shake keyframes)

**Interfaces:**
- Consumes: `QuizQuestion` type from Task 3.
- Produces: default export `QuizCard` with props `{ question: QuizQuestion; picked: number | null; wasCorrect: boolean; onPick: (index: number) => void; showExplanation: boolean }` — used by the page (Task 5).

- [ ] **Step 1: Add the shake animation to globals.css**

Append to `src/app/globals.css`:
```css
/* Wrong-answer shake for the math quiz */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}
```

- [ ] **Step 2: Create the component**

Create `src/components/QuizCard.tsx`:
```tsx
"use client";

import type { QuizQuestion } from "@/lib/math-quiz";

interface QuizCardProps {
  question: QuizQuestion;
  picked: number | null;
  wasCorrect: boolean;
  showExplanation: boolean;
  onPick: (index: number) => void;
}

function DonutPlates({ plates, perPlate }: { plates: number; perPlate: number }) {
  return (
    <div className="my-4 flex flex-col items-center gap-1">
      {Array.from({ length: plates }).map((_, i) => (
        <div key={i} className="flex items-center gap-1">
          <span className="mr-1 text-xs text-white/40">접시 {i + 1}</span>
          {Array.from({ length: perPlate }).map((_, j) => (
            <span key={j} className="text-2xl">🍩</span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function QuizCard({
  question,
  picked,
  wasCorrect,
  showExplanation,
  onPick,
}: QuizCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <p
        className="text-center text-2xl font-bold"
        style={{ fontFamily: "'Fredoka', cursive", color: "#FEFEFE" }}
      >
        {question.prompt}
      </p>

      {question.kind === "picture" && question.explanation.plates && question.explanation.perPlate && (
        <DonutPlates
          plates={question.explanation.plates}
          perPlate={question.explanation.perPlate}
        />
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((opt, i) => {
          const isPicked = picked === i;
          const state = showExplanation && opt.correct
            ? "correct"
            : isPicked && !wasCorrect
              ? "wrong"
              : "idle";
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onPick(i)}
              disabled={showExplanation}
              className={`min-h-[56px] rounded-2xl border-2 px-6 py-3 text-2xl font-bold transition cursor-pointer ${
                state === "correct"
                  ? "border-[#6BCB77] bg-[#6BCB77]/20 text-[#6BCB77]"
                  : state === "wrong"
                    ? "animate-shake border-[#FF6B9D]/40 bg-[#FF6B9D]/10 text-white/40"
                    : "border-white/15 bg-black/30 text-white hover:border-[#FFD93D] hover:scale-[1.02]"
              }`}
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {picked !== null && !wasCorrect && !showExplanation && (
        <p className="mt-4 text-center text-lg text-[#FF6B9D]">
          앗! 다시 골라볼까요? 🤔
        </p>
      )}

      {showExplanation && (
        <div className="mt-6 rounded-2xl border border-[#6BCB77]/30 bg-[#6BCB77]/10 p-4">
          <p className="text-center text-xl font-bold text-[#6BCB77]">
            딩동댕! 🎉
          </p>
          {question.explanation.plates && question.explanation.perPlate && (
            <DonutPlates
              plates={question.explanation.plates}
              perPlate={question.explanation.perPlate}
            />
          )}
          {question.explanation.equation && (
            <p
              className="text-center text-2xl font-black text-[#FFD93D]"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {question.explanation.equation}
            </p>
          )}
          <p className="mt-2 text-center text-base leading-relaxed text-white/80">
            {question.explanation.text}
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/QuizCard.tsx src/app/globals.css
git commit -m "feat(math): add QuizCard component with donut explanations"
```

---

## Task 5: /math page state machine

**Files:**
- Create: `src/app/math/page.tsx`

**Interfaces:**
- Consumes: `quizQuestions`, `TOTAL_QUESTIONS` from Task 3; `QuizCard` from Task 4.

- [ ] **Step 1: Create the page**

Create `src/app/math/page.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import QuizCard from "@/components/QuizCard";
import { quizQuestions, TOTAL_QUESTIONS } from "@/lib/math-quiz";

type Phase = "intro" | "quiz" | "results";

export default function MathPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [firstTryDone, setFirstTryDone] = useState(false);
  const [score, setScore] = useState(0);

  const question = quizQuestions[index];

  function start() {
    setPhase("quiz");
    setIndex(0);
    setPicked(null);
    setShowExplanation(false);
    setFirstTryDone(false);
    setScore(0);
  }

  function handlePick(i: number) {
    if (showExplanation) return;
    const correct = question.options[i].correct;
    setPicked(i);
    setWasCorrect(correct);
    if (correct) {
      if (!firstTryDone) setScore((s) => s + 1);
      setShowExplanation(true);
    } else {
      setFirstTryDone(true);
    }
  }

  function next() {
    if (index + 1 >= TOTAL_QUESTIONS) {
      setPhase("results");
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
    setWasCorrect(false);
    setShowExplanation(false);
    setFirstTryDone(false);
  }

  return (
    <div className="min-h-screen bg-[#1A0A2E] text-[#FEFEFE]">
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/shop"
            className="rounded-full bg-[#FF6B9D]/15 px-4 py-2 text-sm font-bold text-[#FF6B9D] transition hover:scale-105"
          >
            ← Shop
          </Link>
          {phase === "quiz" && (
            <span className="font-mono text-sm text-white/50">
              {index + 1} / {TOTAL_QUESTIONS}
            </span>
          )}
        </div>

        <header className="mb-8 text-center">
          <h1
            className="text-4xl font-black leading-none md:text-6xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#FFD93D",
              textShadow: "0 0 20px rgba(255,217,61,0.5), 3px 3px 0px #FF6B9D",
            }}
          >
            DONUT MATH
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            곱하기 마법 배우기 🍩×✨
          </p>
        </header>

        {phase === "intro" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-5xl">🍩</p>
            <p
              className="mt-4 text-2xl font-bold"
              style={{ fontFamily: "'Fredoka', cursive" }}
            >
              곱하기는 <span className="text-[#FF6B9D]">몇 번 더하기</span> 마법!
            </p>
            <p className="mt-3 text-white/70">
              2 × 3 은 “2를 3번 더하기” 라는 뜻이에요.
              <br />
              도넛을 보면서 8문제를 풀어보아요!
            </p>
            <button
              type="button"
              onClick={start}
              className="mt-6 rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#FF8C42] px-10 py-4 text-xl font-black text-black transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              시작하기 🍩
            </button>
          </div>
        )}

        {phase === "quiz" && (
          <>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#FFD93D] transition-all"
                style={{ width: `${((index + (showExplanation ? 1 : 0)) / TOTAL_QUESTIONS) * 100}%` }}
              />
            </div>
            <QuizCard
              question={question}
              picked={picked}
              wasCorrect={wasCorrect}
              showExplanation={showExplanation}
              onPick={handlePick}
            />
            {showExplanation && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={next}
                  className="rounded-full bg-[#6BCB77] px-8 py-3 text-lg font-black text-black transition hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {index + 1 >= TOTAL_QUESTIONS ? "결과 보기 🎉" : "다음 문제 →"}
                </button>
              </div>
            )}
          </>
        )}

        {phase === "results" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-6xl">{score >= 6 ? "🏆" : score >= 4 ? "🍩" : "💪"}</p>
            <p
              className="mt-4 text-3xl font-black"
              style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
            >
              {score} / {TOTAL_QUESTIONS} 문제 첫 번에 맞혔어요!
            </p>
            <p className="mt-2 text-white/70">
              {score >= 6
                ? "와! 곱하기 마법사네요!"
                : score >= 4
                  ? "잘했어요! 조금만 더 연습해요!"
                  : "괜찮아요! 도넛을 하나씩 세면서 다시 해봐요!"}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={start}
                className="rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#FF8C42] px-8 py-3 text-lg font-black text-black transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                다시 풀기 🍩
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: build succeeds, `/math` route present.

- [ ] **Step 3: Commit**

```bash
git add src/app/math/page.tsx
git commit -m "feat(math): add /math quiz page"
```

---

## Task 6: Shop listing + flavor count

**Files:**
- Modify: `src/data/donuts.ts`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add the donut entry**

In `src/data/donuts.ts`, add after the `weather-atelier` entry (before the closing `];` of `allDonuts`):
```ts
  {
    slug: "donut-math",
    name: "Donut Math",
    description: "Multiplication magic, one donut at a time",
    route: "/math",
    category: "Chef's Special",
    tags: ["Math", "Kids"],
    price: "$7.75",
    color: "#FFD93D",
  },
```

- [ ] **Step 2: Update the flavor count**

In `src/app/page.tsx`, change `21 flavors available` to `22 flavors available`.

- [ ] **Step 3: Verify it builds**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/data/donuts.ts src/app/page.tsx
git commit -m "feat(math): list Donut Math in shop"
```

---

## Task 7: Final verification

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: all suites pass (math + prior ascii/ansi/weather tests).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: `/math` route present, build succeeds.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev` and open `http://localhost:<port>/math`:
1. Intro screen renders; "시작하기" starts Q1.
2. Pick a wrong option → it shakes, retry message appears, question stays.
3. Pick the correct option → 🎉 explanation with donut plates + equation; "다음 문제" advances.
4. Progress bar and "n / 8" counter advance; wrong-first questions do not increment first-try score.
5. After Q8 → results screen shows score and "다시 풀기" resets.
6. `/shop` shows the "Donut Math" card linking to `/math`.

- [ ] **Step 4: Commit any smoke-test fixes**

```bash
git add -A
git commit -m "chore(math): final smoke-test fixes"
```
(Only if changes were needed.)
