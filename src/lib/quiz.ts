// Quiz Arena: configurable times-table quiz generation and speed scoring.
// Pure module — no DOM, no React.

export interface QuizConfig {
  tables: number[]; // which times tables, e.g. [2] or [2, 3, 11]
  optionCount: number; // 2..5
  timeoutMs: number; // per-question timeout
  questionCount: number; // total questions in a game
}

export const MAX_TOTAL_POINTS = 50;

export const DEFAULT_CONFIG: QuizConfig = {
  tables: [2],
  optionCount: 3,
  timeoutMs: 5000,
  questionCount: 5,
};

export interface QuizQuestion {
  a: number; // the times table
  b: number; // 1..9
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

function makeQuestion(a: number, b: number, optionCount: number): QuizQuestion {
  const answer = a * b;
  // Near misses plus the neighboring tables' answers (classic traps).
  const pool = [
    answer - 4, answer - 3, answer - 2, answer - 1,
    answer + 1, answer + 2, answer + 3, answer + 4,
    (a - 1) * b, (a + 1) * b,
  ].filter((v) => v > 0 && v !== answer);
  const distractors = shuffle([...new Set(pool)]).slice(0, optionCount - 1);
  return { a, b, answer, options: shuffle([answer, ...distractors]) };
}

/** A game's questions: sampled from tables×1..9, no repeats until the pool
 *  runs out; longer games allow repeats. */
export function buildQuiz(config: QuizConfig): QuizQuestion[] {
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
    .map(([a, b]) => makeQuestion(a, b, config.optionCount));
}

/** Speed points for an answer after `ms`: full per-question value under 1s,
 *  minus one bucket per second, 0 at the timeout. Per-question max is
 *  MAX_TOTAL_POINTS / questionCount, so a perfect game is always 50. */
export function pointsForElapsed(ms: number, config: QuizConfig): number {
  if (ms >= config.timeoutMs) return 0;
  const perQuestion = MAX_TOTAL_POINTS / config.questionCount;
  const buckets = Math.max(1, Math.ceil(config.timeoutMs / 1000));
  const elapsedSec = Math.floor(ms / 1000);
  return round1((perQuestion * (buckets - elapsedSec)) / buckets);
}
