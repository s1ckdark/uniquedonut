import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateExpression,
  evaluateEquation,
  validateQuestions,
  quizQuestions,
  TOTAL_QUESTIONS,
  type QuizQuestion,
} from "./math-quiz";

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
  for (const q of quizQuestions.filter((item) => item.kind === "picture")) {
    assert.ok(q.explanation.plates && q.explanation.plates > 0);
    assert.ok(q.explanation.perPlate && q.explanation.perPlate > 0);
  }
});
