// 종합 챌린지 (formerly camping challenge): a mixed-round game
// (memory, logic, math, word) supporting solo play and 2–4 player
// pass-and-play with a podium ranking. Pure module — no DOM, no React.
//
// Fairness model: the round CATEGORY order is shuffled once per game
// and shared by every player, while round CONTENT is drawn from a
// per-player seeded rng (seed ⊕ playerIndex) so a later player cannot
// copy answers by watching.

import { mulberry32, shuffleWith } from "./quiz";
import type { QuizConfig } from "./quiz";
import { buildDictationQuestions, type DictationTier } from "./dictation";

// ---------- types & constants ----------

export type CampingLevel = "easy" | "normal" | "hard";
export type CampingCategory = "memory" | "logic" | "math" | "word";

export const LEVEL_LABELS: Record<CampingLevel, string> = {
  easy: "🌱 쉬움",
  normal: "🔥 보통",
  hard: "⚡ 어려움",
};

export const CATEGORY_EMOJI: Record<CampingCategory, string> = {
  memory: "🧠",
  logic: "💡",
  math: "🔢",
  word: "✏️",
};

export const ROUNDS_PER_CATEGORY = 2;
export const TOTAL_ROUNDS = ROUNDS_PER_CATEGORY * 4;
export const ROUND_TIMEOUT_MS = 10_000;

/** Config handed to pointsForElapsed so page and lib agree on scoring:
 *  8 rounds × max 12.5 = 100. */
export const CAMPING_SCORE_CONFIG: QuizConfig = {
  op: "add",
  mode: "attack",
  tables: [2],
  rangeMax: 10,
  optionCount: 4,
  timeoutMs: ROUND_TIMEOUT_MS,
  questionCount: TOTAL_ROUNDS,
};

export interface CampingPlayer {
  name: string;
  level: CampingLevel;
}

export interface CampingRound {
  category: CampingCategory;
  prompt: string;
  /** Optional visual: the math expression, a pattern row, … */
  display?: string;
  answer: string;
  options: string[];
  /** Word rounds: the text to speak. */
  speech?: string;
  /** Memory rounds: items to flash before the question. */
  flash?: { items: string[]; ms: number };
}

export interface CampingPlayerGame {
  player: CampingPlayer;
  rounds: CampingRound[];
}

// ---------- logic bank (사고력) ----------

export interface LogicPuzzle {
  level: CampingLevel;
  prompt: string;
  display?: string;
  answer: string;
  distractors: string[];
}

export const LOGIC_BANK: LogicPuzzle[] = [
  // ----- easy: simple AB-AB patterns + clear odd-one-out -----
  {
    level: "easy",
    prompt: "다음에 올 것은?",
    display: "🍎 🍌 🍎 🍌 🍎 ?",
    answer: "🍌",
    distractors: ["🍇", "🍕", "🥕"],
  },
  {
    level: "easy",
    prompt: "다음에 올 것은?",
    display: "🔴 🔵 🔴 🔵 🔴 ?",
    answer: "🔵",
    distractors: ["🟢", "🟡", "⚪"],
  },
  {
    level: "easy",
    prompt: "다음에 올 것은?",
    display: "🐶 🐱 🐶 🐱 🐶 ?",
    answer: "🐱",
    distractors: ["🐹", "🐰", "🦊"],
  },
  {
    level: "easy",
    prompt: "다음에 올 것은?",
    display: "⭐ 🌙 ⭐ 🌙 ⭐ ?",
    answer: "🌙",
    distractors: ["☀️", "☁️", "🌈"],
  },
  {
    level: "easy",
    prompt: "어울리지 않는 하나는?",
    answer: "상어",
    distractors: ["사자", "토끼", "호랑이"],
  },
  {
    level: "easy",
    prompt: "어울리지 않는 하나는?",
    answer: "당근",
    distractors: ["사과", "바나나", "포도"],
  },
  {
    level: "easy",
    prompt: "어울리지 않는 하나는?",
    answer: "돌고래",
    distractors: ["개", "고양이", "소"],
  },
  {
    level: "easy",
    prompt: "어울리지 않는 하나는?",
    answer: "사자",
    distractors: ["노랑", "빨강", "파랑"],
  },
  // ----- normal: grouped/number patterns + category odd-one-out -----
  {
    level: "normal",
    prompt: "다음에 올 것은?",
    display: "🍎 🍎 🍌 🍎 🍎 🍌 🍎 🍎 ?",
    answer: "🍌",
    distractors: ["🍇", "🍕", "🥕"],
  },
  {
    level: "normal",
    prompt: "다음에 올 것은?",
    display: "1 3 5 7 ?",
    answer: "9",
    distractors: ["8", "10", "6"],
  },
  {
    level: "normal",
    prompt: "다음에 올 것은?",
    display: "🌱 🌿 🌳 🌱 🌿 ?",
    answer: "🌳",
    distractors: ["🍃", "🌸", "🪵"],
  },
  {
    level: "normal",
    prompt: "다음에 올 것은?",
    display: "5 10 15 20 ?",
    answer: "25",
    distractors: ["30", "24", "21"],
  },
  {
    level: "normal",
    prompt: "어울리지 않는 하나는?",
    answer: "다람쥐",
    distractors: ["까치", "비둘기", "참새"],
  },
  {
    level: "normal",
    prompt: "어울리지 않는 하나는?",
    answer: "아침",
    distractors: ["여름", "겨울", "가을"],
  },
  {
    level: "normal",
    prompt: "어울리지 않는 하나는?",
    answer: "무",
    distractors: ["사과", "배", "감"],
  },
  {
    level: "normal",
    prompt: "어울리지 않는 하나는?",
    answer: "주말",
    distractors: ["월요일", "화요일", "수요일"],
  },
  // ----- hard: growth patterns + knowledge-based odd-one-out -----
  {
    level: "hard",
    prompt: "다음에 올 것은?",
    display: "2 4 8 16 ?",
    answer: "32",
    distractors: ["24", "20", "18"],
  },
  {
    level: "hard",
    prompt: "다음에 올 것은?",
    display: "1 4 9 16 ?",
    answer: "25",
    distractors: ["20", "24", "17"],
  },
  {
    level: "hard",
    prompt: "다음에 올 것은?",
    display: "🌑 🌘 🌗 🌖 ?",
    answer: "🌕",
    distractors: ["⭐", "☄️", "🌈"],
  },
  {
    level: "hard",
    prompt: "다음에 올 것은?",
    display: "1 3 6 10 ?",
    answer: "15",
    distractors: ["12", "13", "20"],
  },
  {
    level: "hard",
    prompt: "어울리지 않는 하나는?",
    answer: "거미",
    distractors: ["개미", "벌", "나비"],
  },
  {
    level: "hard",
    prompt: "어울리지 않는 하나는?",
    answer: "달",
    distractors: ["지구", "화성", "금성"],
  },
  {
    level: "hard",
    prompt: "어울리지 않는 하나는?",
    answer: "소금",
    distractors: ["얼음", "물", "수증기"],
  },
  {
    level: "hard",
    prompt: "어울리지 않는 하나는?",
    answer: "4월",
    distractors: ["1월", "3월", "5월"],
  },
];

// ---------- memory flash pool ----------

export const MEMORY_FLASH_POOL: string[] = [
  "🍎", "🍌", "🍇", "🧀", "🍕", "🍉", "🍓", "🥕", "🌽", "🍳",
  "🐶", "🐱", "🐰", "🦁", "🐸", "🐵", "🦊", "⭐", "🌙", "🎈",
];

const FLASH_ITEMS: Record<CampingLevel, number> = { easy: 4, normal: 6, hard: 8 };
const FLASH_MS: Record<CampingLevel, number> = {
  easy: 4000,
  normal: 5000,
  hard: 6000,
};

type MemoryVariant = "absent" | "present";

function memoryRound(
  rng: () => number,
  level: CampingLevel,
  variant: MemoryVariant,
): CampingRound {
  const n = FLASH_ITEMS[level];
  if (variant === "absent") {
    // n flashed + 1 hidden answer; options mix the answer with flashed items
    const picked = shuffleWith(MEMORY_FLASH_POOL, rng).slice(0, n + 1);
    const items = picked.slice(0, n);
    const answer = picked[n];
    return {
      category: "memory",
      prompt: "방금 없었던 것은?",
      answer,
      options: shuffleWith([answer, ...items.slice(0, 3)], rng),
      flash: { items, ms: FLASH_MS[level] },
    };
  }
  // n flashed; the answer is one of them, the rest are fresh distractors
  const picked = shuffleWith(MEMORY_FLASH_POOL, rng).slice(0, n + 3);
  const items = picked.slice(0, n);
  const answer = items[items.length - 1];
  const distractors = picked.slice(n);
  return {
    category: "memory",
    prompt: "방금 있었던 것은?",
    answer,
    options: shuffleWith([answer, ...distractors], rng),
    flash: { items, ms: FLASH_MS[level] },
  };
}

// ---------- math rounds ----------

function numericOptions(
  answer: number,
  candidates: number[],
  rng: () => number,
): string[] {
  const pool = [...new Set(candidates.filter((v) => v >= 0 && v !== answer))];
  const picked = shuffleWith(pool, rng).slice(0, 3);
  while (picked.length < 3) picked.push(picked.length + answer + 1);
  return shuffleWith([answer, ...picked], rng).map(String);
}

/** Operand ranges and the guaranteed multiplication table per level:
 *  easy ≤10 (no ×), normal ≤50 with × 2–5, hard ≤100 with × 2–9. */
const MATH_RANGE: Record<CampingLevel, number> = { easy: 10, normal: 50, hard: 100 };
const MATH_TABLES: Record<CampingLevel, [number, number]> = {
  easy: [0, 0],
  normal: [2, 5],
  hard: [2, 9],
};

function mathRound(
  rng: () => number,
  level: CampingLevel,
  occurrence: number,
): CampingRound {
  const range = MATH_RANGE[level];
  const int = (max: number) => 1 + Math.floor(rng() * max);
  // occurrence 1 always multiplies (easy stays add/sub at ≤10)
  if (occurrence === 1 && level !== "easy") {
    const [tMin, tMax] = MATH_TABLES[level];
    const t = tMin + Math.floor(rng() * (tMax - tMin + 1));
    const b = 2 + Math.floor(rng() * 8); // 2..9
    const answer = t * b;
    return {
      category: "math",
      prompt: "얼마일까요?",
      display: `${t} × ${b} = ?`,
      answer: String(answer),
      options: numericOptions(
        answer,
        [answer - 4, answer - 3, answer - 2, answer - 1, answer + 1, answer + 2, answer + 3, answer + 4, (t - 1) * b, (t + 1) * b],
        rng,
      ),
    };
  }
  if (level === "easy" && occurrence === 1) {
    const hi = 2 + Math.floor(rng() * 9); // 2..10
    const lo = 1 + Math.floor(rng() * (hi - 1));
    const answer = hi - lo;
    return {
      category: "math",
      prompt: "얼마일까요?",
      display: `${hi} − ${lo} = ?`,
      answer: String(answer),
      options: numericOptions(answer, [answer + 1, answer + 2, answer + 3], rng),
    };
  }
  if (rng() < 0.5) {
    if (level === "easy") {
      const a = 1 + Math.floor(rng() * 9); // 1..9
      const b = 1 + Math.floor(rng() * (10 - a)); // keeps a + b ≤ 10
      const answer = a + b;
      return {
        category: "math",
        prompt: "얼마일까요?",
        display: `${a} + ${b} = ?`,
        answer: String(answer),
        options: numericOptions(answer, [answer + 1, answer + 2, answer + 3], rng),
      };
    }
    const a = 1 + Math.floor(rng() * (range - 1));
    const b = 1 + Math.floor(rng() * (range - 1));
    const answer = a + b;
    return {
      category: "math",
      prompt: "얼마일까요?",
      display: `${a} + ${b} = ?`,
      answer: String(answer),
      options: numericOptions(
        answer,
        [answer - 5, answer - 3, answer - 2, answer - 1, answer + 1, answer + 2, answer + 3, answer + 5, answer + 10],
        rng,
      ),
    };
  }
  // subtraction within range, never negative
  const hi = Math.max(2, Math.floor(range / 4)) + Math.floor(rng() * (range - Math.max(2, Math.floor(range / 4))));
  const lo = 1 + Math.floor(rng() * (hi - 1));
  const answer = hi - lo;
  return {
    category: "math",
    prompt: "얼마일까요?",
    display: `${hi} − ${lo} = ?`,
    answer: String(answer),
    options: numericOptions(
      answer,
      [answer - 5, answer - 3, answer - 2, answer - 1, answer + 1, answer + 2, answer + 3, answer + 5, answer + 10],
      rng,
    ),
  };
}

// ---------- word & logic rounds ----------

function wordTier(level: CampingLevel): DictationTier {
  if (level === "easy") return "words";
  if (level === "normal") return "sentences";
  return "advanced";
}

function logicRound(puzzle: LogicPuzzle, rng: () => number): CampingRound {
  return {
    category: "logic",
    prompt: puzzle.prompt,
    ...(puzzle.display ? { display: puzzle.display } : {}),
    answer: puzzle.answer,
    options: shuffleWith([puzzle.answer, ...puzzle.distractors], rng),
  };
}

// ---------- game builder ----------

/** Same shuffled category order for all players; per-player seeded
 *  content derived from `seed` and the player index. */
export function buildCampingGame(
  seed: number,
  players: CampingPlayer[],
): CampingPlayerGame[] {
  const order = shuffleWith(
    (["memory", "logic", "math", "word"] as CampingCategory[]).flatMap((c) =>
      Array.from({ length: ROUNDS_PER_CATEGORY }, () => c),
    ),
    mulberry32(seed),
  );
  return players.map((player, i) => {
    const rng = mulberry32(Math.imul(i + 1, 2654435761) ^ seed);
    const logicBank = shuffleWith(
      LOGIC_BANK.filter((p) => p.level === player.level),
      rng,
    );
    const words = buildDictationQuestions(
      wordTier(player.level),
      ROUNDS_PER_CATEGORY,
      rng,
    );
    const seen: Record<CampingCategory, number> = {
      memory: 0,
      logic: 0,
      math: 0,
      word: 0,
    };
    const rounds = order.map((category) => {
      const occurrence = seen[category]++;
      switch (category) {
        case "memory":
          return memoryRound(rng, player.level, occurrence === 0 ? "absent" : "present");
        case "logic":
          return logicRound(logicBank[occurrence], rng);
        case "math":
          return mathRound(rng, player.level, occurrence);
        case "word": {
          const q = words[occurrence];
          return {
            category: "word" as const,
            prompt: "잘 듣고 올바른 표현을 고르세요",
            answer: q.answer,
            options: q.options,
            speech: q.word,
          };
        }
      }
    });
    return { player, rounds };
  });
}

// ---------- difficulty & ranking ----------

/** Quantified difficulty badge: easy 22 (🌱), normal 34 (🔥), hard 46 (⚡). */
export function campingDifficulty(level: CampingLevel): number {
  return level === "easy" ? 22 : level === "normal" ? 34 : 46;
}

export interface CampingScore {
  score: number;
  totalSeconds: number;
  /** Optional per-category breakdown carried through to the podium. */
  byCategory?: Record<CampingCategory, number>;
}

export interface RankedCampingPlayer extends CampingScore {
  rank: number;
  player: CampingPlayer;
}

/** Score desc, tie-break totalSeconds asc; exact ties share a rank. */
export function rankCampingPlayers(
  players: CampingPlayer[],
  scores: CampingScore[],
): RankedCampingPlayer[] {
  const rows = players.map((player, i) => ({ player, ...scores[i] }));
  rows.sort((a, b) => b.score - a.score || a.totalSeconds - b.totalSeconds);
  const ranked: RankedCampingPlayer[] = [];
  rows.forEach((row, i) => {
    const prev = ranked[i - 1];
    const tied =
      prev !== undefined &&
      prev.score === row.score &&
      prev.totalSeconds === row.totalSeconds;
    ranked.push({ rank: tied ? prev.rank : i + 1, ...row });
  });
  return ranked;
}
