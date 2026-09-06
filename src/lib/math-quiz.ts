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
      violations.push(
        `${tag}: expected exactly 1 correct option, got ${correct.length}`,
      );
      continue;
    }

    const answer = correct[0];
    for (const opt of q.options) {
      const evaluated = evaluateExpression(opt.label);
      if (evaluated !== opt.value) {
        violations.push(
          `${tag}: option "${opt.label}" value ${opt.value} != evaluated ${evaluated}`,
        );
      }
      if (!opt.correct && opt.value === answer.value) {
        violations.push(
          `${tag}: distractor "${opt.label}" equals answer value ${answer.value}`,
        );
      }
    }

    if (q.explanation.equation && !evaluateEquation(q.explanation.equation)) {
      violations.push(
        `${tag}: explanation equation "${q.explanation.equation}" is false`,
      );
    }
  }
  return violations;
}
