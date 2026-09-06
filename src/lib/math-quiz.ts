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

// The 8 shipped questions. Convention: a × b = "a를 b번 더함".
// Distractor values are all different from the answer's value — enforced
// by validateQuestions, which the test suite runs against this data.
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
