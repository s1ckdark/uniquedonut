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
