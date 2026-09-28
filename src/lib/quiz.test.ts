import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildTimesTableQuiz,
  pointsForElapsed,
  shuffle,
  TIMEOUT_MS,
} from "./quiz";

test("buildTimesTableQuiz(2): ten questions covering 2×1..2×10", () => {
  const quiz = buildTimesTableQuiz(2);
  assert.equal(quiz.length, 10);
  const bs = quiz.map((q) => q.b).sort((x, y) => x - y);
  assert.deepEqual(bs, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  for (const q of quiz) {
    assert.equal(q.a, 2);
    assert.equal(q.answer, 2 * q.b);
  }
});

test("buildTimesTableQuiz(2): four unique positive options incl. answer", () => {
  for (let run = 0; run < 20; run++) {
    for (const q of buildTimesTableQuiz(2)) {
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4);
      assert.ok(q.options.includes(q.answer));
      for (const opt of q.options) assert.ok(opt > 0);
    }
  }
});

test("pointsForElapsed: per-second buckets, zero at timeout", () => {
  assert.equal(pointsForElapsed(0), 5);
  assert.equal(pointsForElapsed(999), 5);
  assert.equal(pointsForElapsed(1000), 4);
  assert.equal(pointsForElapsed(2500), 3);
  assert.equal(pointsForElapsed(4999), 1);
  assert.equal(pointsForElapsed(TIMEOUT_MS), 0);
  assert.equal(pointsForElapsed(7000), 0);
});

test("shuffle: preserves the multiset of elements", () => {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const out = shuffle(arr);
  assert.deepEqual([...out].sort((a, b) => a - b), arr);
  assert.deepEqual(arr, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "input untouched");
});
