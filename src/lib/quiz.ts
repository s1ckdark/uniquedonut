// Quiz Arena: times-table quiz generation and speed scoring.
// Pure module — no DOM, no React.

export interface QuizQuestion {
  a: number; // the times table (e.g. 2)
  b: number; // 1..10
  answer: number;
  options: number[]; // 4 unique values, includes the answer
}

export const TIMEOUT_MS = 5000;
export const MAX_POINTS_PER_QUESTION = 5;

/** Fisher–Yates shuffle; returns a new array, input untouched. */
export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeQuestion(a: number, b: number): QuizQuestion {
  const answer = a * b;
  const candidates = [answer - 3, answer - 2, answer - 1, answer + 1, answer + 2, answer + 3]
    .filter((v) => v > 0 && v !== answer);
  const distractors = shuffle(candidates).slice(0, 3);
  return { a, b, answer, options: shuffle([answer, ...distractors]) };
}

/** A full quiz for one times table: table×1 … table×10, order shuffled. */
export function buildTimesTableQuiz(table: number): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  for (let b = 1; b <= 10; b++) questions.push(makeQuestion(table, b));
  return shuffle(questions);
}

/** Speed points for an answer after `ms`: 5 under 1s, minus 1 per second,
 *  0 at the 5s timeout. */
export function pointsForElapsed(ms: number): number {
  if (ms >= TIMEOUT_MS) return 0;
  return MAX_POINTS_PER_QUESTION - Math.floor(ms / 1000);
}
