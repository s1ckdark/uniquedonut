import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_CONFIG,
  buildQuiz,
  buildPlayQuestions,
  pointsForElapsed,
  shuffle,
  difficultyScore,
  difficultyLabel,
  distractorStep,
  type QuizConfig,
} from "./quiz";
import { findTopic } from "./quiz-content";

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

test("pointsForElapsed: default buckets 20/16/12/8/4, zero at timeout", () => {
  assert.equal(pointsForElapsed(0, DEFAULT_CONFIG), 20);
  assert.equal(pointsForElapsed(999, DEFAULT_CONFIG), 20);
  assert.equal(pointsForElapsed(1000, DEFAULT_CONFIG), 16);
  assert.equal(pointsForElapsed(2500, DEFAULT_CONFIG), 12);
  assert.equal(pointsForElapsed(4999, DEFAULT_CONFIG), 4);
  assert.equal(pointsForElapsed(5000, DEFAULT_CONFIG), 0);
  assert.equal(pointsForElapsed(7000, DEFAULT_CONFIG), 0);
});

test("pointsForElapsed: scales with question count and timeout", () => {
  // 4 questions → 25 per question
  const four: QuizConfig = { ...DEFAULT_CONFIG, questionCount: 4 };
  assert.equal(pointsForElapsed(0, four), 25);
  // 3-second timeout → 3 buckets of a 5-question game (20 pts each)
  const fast: QuizConfig = { ...DEFAULT_CONFIG, timeoutMs: 3000 };
  assert.equal(pointsForElapsed(0, fast), 20);
  assert.equal(pointsForElapsed(1000, fast), 13.3);
  assert.equal(pointsForElapsed(2000, fast), 6.7);
  assert.equal(pointsForElapsed(3000, fast), 0);
});

test("shuffle: preserves the multiset of elements", () => {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const out = shuffle(arr);
  assert.deepEqual([...out].sort((a, b) => a - b), arr);
  assert.deepEqual(arr, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "input untouched");
});

test("difficultyScore: default config = 31 (table 4 + options 5 + timeout 22)", () => {
  assert.equal(difficultyScore(DEFAULT_CONFIG), 31);
});

test("difficultyScore: each setting raises the score", () => {
  const fiveChoice: QuizConfig = { ...DEFAULT_CONFIG, optionCount: 5 };
  assert.equal(difficultyScore(fiveChoice), 31 + 10); // options 5 → 15

  const fast: QuizConfig = { ...DEFAULT_CONFIG, timeoutMs: 3000 };
  assert.equal(difficultyScore(fast), 31 + 2); // timeout 22 → 24 (cap)

  const slow: QuizConfig = { ...DEFAULT_CONFIG, timeoutMs: 15000 };
  assert.equal(difficultyScore(slow), 31 - 20); // timeout 22 → 2

  const long: QuizConfig = { ...DEFAULT_CONFIG, questionCount: 20 };
  assert.equal(difficultyScore(long), 31 + 15);

  const hardTable: QuizConfig = { ...DEFAULT_CONFIG, tables: [11] };
  assert.equal(difficultyScore(hardTable), 31 + 36); // table 4 → 40

  const multi: QuizConfig = { ...DEFAULT_CONFIG, tables: [2, 3] };
  assert.equal(difficultyScore(multi), 31 + 6); // table 4 → 8 (highest=3) + 2 extra
});

test("difficultyScore: clamps at 100", () => {
  const extreme: QuizConfig = {
    ...DEFAULT_CONFIG,
    tables: [11, 5, 6, 7],
    optionCount: 5,
    timeoutMs: 3000,
    questionCount: 20,
  };
  assert.ok(difficultyScore(extreme) <= 100);
  assert.ok(difficultyScore(extreme) >= 95);
});

test("difficultyLabel: tier names by range", () => {
  assert.equal(difficultyLabel(10), "🌱 쉬움");
  assert.equal(difficultyLabel(26), "🔥 보통");
  assert.equal(difficultyLabel(45), "⚡ 어려움");
  assert.equal(difficultyLabel(70), "🔥🔥 매우 어려움");
  assert.equal(difficultyLabel(95), "👑 극한");
});

// ---------- four operations ----------

const addCfg = (over: Partial<QuizConfig> = {}): QuizConfig => ({
  ...DEFAULT_CONFIG,
  op: "add",
  ...over,
});

test("add: sums within the range with valid options", () => {
  for (let run = 0; run < 20; run++) {
    const quiz = buildQuiz(addCfg({ rangeMax: 10 }));
    assert.equal(quiz.length, 5);
    for (const q of quiz) {
      assert.ok(q.a >= 1 && q.a <= 10);
      assert.ok(q.b >= 1 && q.b <= 10);
      assert.equal(q.answer, q.a + q.b);
      assert.equal(new Set(q.options).size, q.options.length);
      assert.ok(q.options.includes(q.answer));
    }
  }
});

test("sub: larger minus smaller, answer never negative", () => {
  for (let run = 0; run < 20; run++) {
    for (const q of buildQuiz(addCfg({ op: "sub", rangeMax: 20 }))) {
      assert.ok(q.a >= q.b);
      assert.equal(q.answer, q.a - q.b);
      assert.ok(q.answer >= 0);
      assert.equal(new Set(q.options).size, q.options.length);
    }
  }
});

test("div: dividend divides cleanly, quotient 1..9, divisor from tables", () => {
  for (let run = 0; run < 20; run++) {
    for (const q of buildQuiz(addCfg({ op: "div", tables: [2, 3] }))) {
      assert.ok([2, 3].includes(q.b)); // divisor is the table
      assert.equal(q.a % q.b, 0); // dividend divisible
      assert.equal(q.answer, q.a / q.b);
      assert.ok(q.answer >= 1 && q.answer <= 9);
      assert.equal(new Set(q.options).size, q.options.length);
    }
  }
});

test("distractorStep: scales with the range", () => {
  assert.equal(distractorStep(10), 1);
  assert.equal(distractorStep(50), 2);
  assert.equal(distractorStep(100), 4);
  assert.equal(distractorStep(1000), 40);
});

test("difficultyScore: grows with add/sub range; div ≡ mul for same table", () => {
  const r10 = difficultyScore(addCfg({ rangeMax: 10 }));
  const r100 = difficultyScore(addCfg({ rangeMax: 100 }));
  const r1000 = difficultyScore(addCfg({ rangeMax: 1000 }));
  assert.ok(r10 < r100 && r100 < r1000);

  assert.equal(
    difficultyScore(addCfg({ op: "div" })),
    difficultyScore(DEFAULT_CONFIG),
  );
});

test("buildQuiz: default config still multiplication on table 2", () => {
  assert.equal(DEFAULT_CONFIG.op, "mul");
  for (const q of buildQuiz(DEFAULT_CONFIG)) {
    assert.equal(q.answer, q.a * q.b);
    assert.equal(q.a, 2);
  }
});

// ---------- unified play questions (math + content topics) ----------

test("buildPlayQuestions: math config renders 'a sym b = ?' with string options", () => {
  const plays = buildPlayQuestions({ ...DEFAULT_CONFIG, op: "add", rangeMax: 10 });
  assert.equal(plays.length, 5);
  for (const p of plays) {
    assert.match(p.display, /^\d+ \+ \d+ = \?$/);
    assert.equal(p.options.length, 3);
    assert.ok(p.options.includes(p.answer));
  }
});

test("buildPlayQuestions: content topic uses the bank, count respected", () => {
  const cfg: QuizConfig = { ...DEFAULT_CONFIG, topic: "sleep-grow" };
  const topic = findTopic("sleep-grow");
  assert.ok(topic);
  const plays = buildPlayQuestions(cfg);
  assert.equal(plays.length, 5);
  const prompts = new Set(plays.map((p) => p.display));
  assert.equal(prompts.size, 5); // no repeats when count ≤ bank
  for (const p of plays) {
    assert.ok(topic.questions.some((q) => q.prompt === p.display));
    assert.equal(p.options.length, 4);
    assert.ok(p.options.includes(p.answer));
  }
});

test("buildPlayQuestions: content repeats allowed beyond the bank", () => {
  const cfg: QuizConfig = { ...DEFAULT_CONFIG, topic: "idiom-cheongoma", questionCount: 9 };
  assert.equal(buildPlayQuestions(cfg).length, 9);
});

test("difficultyScore: topic = base + timeout + count, no option part", () => {
  const cfg: QuizConfig = { ...DEFAULT_CONFIG, topic: "sleep-grow" };
  // base 30 + timeout (16−5)×2=22 + count 0 = 52
  assert.equal(difficultyScore(cfg), 52);
  // longer game adds the count part
  assert.equal(difficultyScore({ ...cfg, questionCount: 10 }), 57);
});
