// Quiz Arena: four-operation quiz generation, speed scoring, and
// difficulty. Pure module — no DOM, no React.

import { findTopic } from "./quiz-content";

export type QuizOp = "add" | "sub" | "mul" | "div";

export interface QuizConfig {
  op: QuizOp;
  tables: number[]; // mul/div: which times tables
  rangeMax: number; // add/sub: operand upper bound
  optionCount: number; // 2..5
  timeoutMs: number; // per-question timeout
  questionCount: number; // total questions in a game
  topic?: string; // content-topic slug — when set, math fields are ignored
}

export const MAX_TOTAL_POINTS = 100;
export const RANGE_CHOICES = [10, 20, 50, 100, 1000];

export const DEFAULT_CONFIG: QuizConfig = {
  op: "mul",
  tables: [2],
  rangeMax: 10,
  optionCount: 3,
  timeoutMs: 5000,
  questionCount: 5,
};

export const OP_SYMBOL: Record<QuizOp, string> = {
  add: "+",
  sub: "−",
  mul: "×",
  div: "÷",
};

export const OP_EMOJI: Record<QuizOp, string> = {
  add: "➕",
  sub: "➖",
  mul: "✖️",
  div: "➗",
};

export const OP_LABEL: Record<QuizOp, string> = {
  add: "더하기",
  sub: "빼기",
  mul: "곱하기",
  div: "나누기",
};

export interface QuizQuestion {
  a: number; // left operand (div: the dividend)
  b: number; // right operand (div: the divisor)
  answer: number;
  options: number[]; // unique values, includes the answer
}

/** Fisher–Yates shuffle; returns a new array, input untouched. */
export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

/** How far wrong answers sit from the truth in add/sub: scales with the
 *  operand range so big-number games don't get trivial ±1 traps. */
export function distractorStep(rangeMax: number): number {
  return Math.max(1, Math.round(rangeMax / 25));
}

/** Build one question: `answer` plus `optionCount−1` distractors. */
function assemble(
  a: number,
  b: number,
  answer: number,
  optionCount: number,
  distractorPool: number[],
): QuizQuestion {
  const distractors = shuffle(
    [...new Set(distractorPool.filter((v) => v > 0 && v !== answer))],
  ).slice(0, optionCount - 1);
  return { a, b, answer, options: shuffle([answer, ...distractors]) };
}

function mulQuestion(
  a: number,
  b: number,
  optionCount: number,
): QuizQuestion {
  const answer = a * b;
  const pool = [
    answer - 4, answer - 3, answer - 2, answer - 1,
    answer + 1, answer + 2, answer + 3, answer + 4,
    (a - 1) * b, (a + 1) * b,
  ];
  return assemble(a, b, answer, optionCount, pool);
}

function divQuestion(
  table: number,
  quotient: number,
  optionCount: number,
): QuizQuestion {
  const pool = [
    quotient - 4, quotient - 3, quotient - 2, quotient - 1,
    quotient + 1, quotient + 2, quotient + 3, quotient + 4,
  ];
  return assemble(table * quotient, table, quotient, optionCount, pool);
}

function rangeQuestion(
  config: QuizConfig,
  a: number,
  b: number,
): QuizQuestion {
  const step = distractorStep(config.rangeMax);
  if (config.op === "add") {
    const answer = a + b;
    const pool = [1, 2, 3, 4].flatMap((k) => [answer - k * step, answer + k * step]);
    return assemble(a, b, answer, config.optionCount, pool);
  }
  // sub: bigger − smaller so the answer is never negative
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  const answer = hi - lo;
  const pool = [1, 2, 3, 4].flatMap((k) => [answer - k * step, answer + k * step]);
  return assemble(hi, lo, answer, config.optionCount, pool);
}

/** Questions for mul/div: sampled from tables×1..9, no repeats until the
 *  pool runs out; longer games allow repeats. */
function buildTablesQuiz(config: QuizConfig): QuizQuestion[] {
  const combos: Array<[number, number]> = [];
  for (const t of config.tables) {
    for (let b = 1; b <= 9; b++) combos.push([t, b]);
  }
  let pairs = shuffle(combos);
  while (pairs.length < config.questionCount) {
    pairs = pairs.concat(shuffle(combos));
  }
  return pairs
    .slice(0, config.questionCount)
    .map(([t, b]) =>
      config.op === "div"
        ? divQuestion(t, b, config.optionCount)
        : mulQuestion(t, b, config.optionCount),
    );
}

/** Questions for add/sub: unique random operand pairs (repeats allowed as
 *  a fallback for very long games). */
function buildRangeQuiz(config: QuizConfig): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const seen = new Set<string>();
  const rand = () => 1 + Math.floor(Math.random() * config.rangeMax);
  let guard = config.questionCount * 30;
  while (questions.length < config.questionCount && guard-- > 0) {
    const a = rand();
    const b = rand();
    const key = config.op === "sub" ? [Math.max(a, b), Math.min(a, b)].join(",") : `${a},${b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    questions.push(rangeQuestion(config, a, b));
  }
  while (questions.length < config.questionCount) {
    questions.push(rangeQuestion(config, rand(), rand()));
  }
  return questions;
}

/** A game's questions for any operation. */
export function buildQuiz(config: QuizConfig): QuizQuestion[] {
  return config.op === "mul" || config.op === "div"
    ? buildTablesQuiz(config)
    : buildRangeQuiz(config);
}

/** The single shape the play UI consumes: math and content-topic questions
 *  alike become display text + string options. */
export interface PlayQuestion {
  display: string;
  options: string[];
  answer: string;
}

/** Build a game's play questions — from a content topic when config.topic
 *  is set (bank shuffled, repeats only beyond the bank), otherwise math. */
export function buildPlayQuestions(config: QuizConfig): PlayQuestion[] {
  if (config.topic) {
    const topic = findTopic(config.topic);
    if (!topic) return [];
    let bank = shuffle(topic.questions);
    while (bank.length < config.questionCount) {
      bank = bank.concat(shuffle(topic.questions));
    }
    return bank.slice(0, config.questionCount).map((q) => ({
      display: q.prompt,
      options: shuffle(q.options),
      answer: q.answer,
    }));
  }
  return buildQuiz(config).map((q) => ({
    display: `${q.a} ${OP_SYMBOL[config.op]} ${q.b} = ?`,
    options: q.options.map(String),
    answer: String(q.answer),
  }));
}

/** Speed points for an answer after `ms`: full per-question value under 1s,
 *  minus one bucket per second, 0 at the timeout. A perfect game is
 *  always MAX_TOTAL_POINTS. */
export function pointsForElapsed(ms: number, config: QuizConfig): number {
  if (ms >= config.timeoutMs) return 0;
  const perQuestion = MAX_TOTAL_POINTS / config.questionCount;
  const buckets = Math.max(1, Math.ceil(config.timeoutMs / 1000));
  const elapsedSec = Math.floor(ms / 1000);
  return round1((perQuestion * (buckets - elapsedSec)) / buckets);
}

/** Quantified difficulty of a config, 0–100.
 *  Range axis — mul/div: (highest table − 1) × 4, +2 per extra table (cap 6);
 *  add/sub: log-scaled from the operand range (10→9 … 1000→44).
 *  Common parts — options (max 15): (optionCount − 2) × 5;
 *  timeout (max 24): (16 − seconds) × 2; questions (max 15): count − 5. */
export function difficultyScore(config: QuizConfig): number {
  const timeoutPts = clamp((16 - config.timeoutMs / 1000) * 2, 0, 24);
  const countPts = config.questionCount - 5;

  // Content-topic runs: the topic's base + timeout + count (no option part).
  if (config.topic) {
    const base = findTopic(config.topic)?.baseDifficulty ?? 0;
    return Math.round(
      Math.min(100, Math.max(0, base + timeoutPts + countPts)),
    );
  }

  const rangePts =
    config.op === "mul" || config.op === "div"
      ? clamp((Math.max(...config.tables, 1) - 1) * 4, 0, 40) +
        Math.min(6, (config.tables.length - 1) * 2)
      : clamp(Math.round((Math.log10(config.rangeMax) - 0.5) * 18), 6, 44);
  const optionPts = (config.optionCount - 2) * 5;
  return Math.round(
    Math.min(100, Math.max(0, rangePts + optionPts + timeoutPts + countPts)),
  );
}

/** Kid-friendly tier label for a difficulty score. */
export function difficultyLabel(score: number): string {
  if (score < 20) return "🌱 쉬움";
  if (score < 40) return "🔥 보통";
  if (score < 60) return "⚡ 어려움";
  if (score < 80) return "🔥🔥 매우 어려움";
  return "👑 극한";
}
