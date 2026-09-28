import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_CONFIG,
  buildQuiz,
  pointsForElapsed,
  shuffle,
  type QuizConfig,
} from "./quiz";

test("DEFAULT_CONFIG: 3 choices, table 2, 5s, 5 questions", () => {
  assert.deepEqual(DEFAULT_CONFIG.tables, [2]);
  assert.equal(DEFAULT_CONFIG.optionCount, 3);
  assert.equal(DEFAULT_CONFIG.timeoutMs, 5000);
  assert.equal(DEFAULT_CONFIG.questionCount, 5);
});

test("buildQuiz: default config — five 2단 questions with 3 options", () => {
  for (let run = 0; run < 20; run++) {
    const quiz = buildQuiz(DEFAULT_CONFIG);
    assert.equal(quiz.length, 5);
    for (const q of quiz) {
      assert.equal(q.a, 2);
      assert.ok(q.b >= 1 && q.b <= 9);
      assert.equal(q.answer, 2 * q.b);
      assert.equal(q.options.length, 3);
      assert.equal(new Set(q.options).size, 3);
      assert.ok(q.options.includes(q.answer));
      for (const opt of q.options) assert.ok(opt > 0);
    }
  }
});

test("buildQuiz: 5-choice and multi-table / custom-table configs", () => {
  const five: QuizConfig = { ...DEFAULT_CONFIG, optionCount: 5, questionCount: 4 };
  for (const q of buildQuiz(five)) assert.equal(q.options.length, 5);

  const multi: QuizConfig = { ...DEFAULT_CONFIG, tables: [2, 3] };
  for (const q of buildQuiz(multi)) assert.ok([2, 3].includes(q.a));

  const custom: QuizConfig = { ...DEFAULT_CONFIG, tables: [11] };
  for (const q of buildQuiz(custom)) assert.equal(q.answer, 11 * q.b);
});

test("buildQuiz: repeats allowed when questions exceed the pool", () => {
  const long: QuizConfig = { ...DEFAULT_CONFIG, tables: [2], questionCount: 20 };
  assert.equal(buildQuiz(long).length, 20);
});

test("pointsForElapsed: default buckets 10/8/6/4/2, zero at timeout", () => {
  assert.equal(pointsForElapsed(0, DEFAULT_CONFIG), 10);
  assert.equal(pointsForElapsed(999, DEFAULT_CONFIG), 10);
  assert.equal(pointsForElapsed(1000, DEFAULT_CONFIG), 8);
  assert.equal(pointsForElapsed(2500, DEFAULT_CONFIG), 6);
  assert.equal(pointsForElapsed(4999, DEFAULT_CONFIG), 2);
  assert.equal(pointsForElapsed(5000, DEFAULT_CONFIG), 0);
  assert.equal(pointsForElapsed(7000, DEFAULT_CONFIG), 0);
});

test("pointsForElapsed: scales with question count and timeout", () => {
  // 4 questions → 12.5 per question
  const four: QuizConfig = { ...DEFAULT_CONFIG, questionCount: 4 };
  assert.equal(pointsForElapsed(0, four), 12.5);
  // 3-second timeout → 3 buckets of a 5-question game (10 pts each)
  const fast: QuizConfig = { ...DEFAULT_CONFIG, timeoutMs: 3000 };
  assert.equal(pointsForElapsed(0, fast), 10);
  assert.equal(pointsForElapsed(1000, fast), 6.7);
  assert.equal(pointsForElapsed(2000, fast), 3.3);
  assert.equal(pointsForElapsed(3000, fast), 0);
});

test("shuffle: preserves the multiset of elements", () => {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const out = shuffle(arr);
  assert.deepEqual([...out].sort((a, b) => a - b), arr);
  assert.deepEqual(arr, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "input untouched");
});
