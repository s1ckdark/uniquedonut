// Camping challenge: a pass-and-play mixed round game (memory, logic,
// math, word) for 2–4 kids with age adjustment (6세/8세) and podium
// ranking. Pure module — no DOM, no React.
//
// Fairness model: the round CATEGORY order is shuffled once per game
// and shared by every player, while round CONTENT is drawn from a
// per-player seeded rng (seed ⊕ playerIndex) so a later player cannot
// copy answers by watching.

import { mulberry32, shuffleWith } from "./quiz";
import type { QuizConfig } from "./quiz";
import { buildDictationQuestions, type DictationTier } from "./dictation";

// ---------- types & constants ----------

export type CampingAge = 6 | 8;
export type CampingCategory = "memory" | "logic" | "math" | "word";

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
  age: CampingAge;
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
  level: CampingAge;
  prompt: string;
  display?: string;
  answer: string;
  distractors: string[];
}

export const LOGIC_BANK: LogicPuzzle[] = [
  // ----- 6세: simple AB-AB patterns + clear odd-one-out -----
  {
    level: 6,
    prompt: "다음에 올 것은?",
    display: "🍎 🍌 🍎 🍌 🍎 ?",
    answer: "🍌",
    distractors: ["🍇", "🍕", "🥕"],
  },
  {
    level: 6,
    prompt: "다음에 올 것은?",
    display: "🔴 🔵 🔴 🔵 🔴 ?",
    answer: "🔵",
    distractors: ["🟢", "🟡", "⚪"],
  },
  {
    level: 6,
    prompt: "다음에 올 것은?",
    display: "🐶 🐱 🐶 🐱 🐶 ?",
    answer: "🐱",
    distractors: ["🐹", "🐰", "🦊"],
  },
  {
    level: 6,
    prompt: "다음에 올 것은?",
    display: "⭐ 🌙 ⭐ 🌙 ⭐ ?",
    answer: "🌙",
    distractors: ["☀️", "☁️", "🌈"],
  },
  {
    level: 6,
    prompt: "어울리지 않는 하나는?",
    answer: "상어",
    distractors: ["사자", "토끼", "호랑이"],
  },
  {
    level: 6,
    prompt: "어울리지 않는 하나는?",
    answer: "당근",
    distractors: ["사과", "바나나", "포도"],
  },
  {
    level: 6,
    prompt: "어울리지 않는 하나는?",
    answer: "돌고래",
    distractors: ["개", "고양이", "소"],
  },
  {
    level: 6,
    prompt: "어울리지 않는 하나는?",
    answer: "사자",
    distractors: ["노랑", "빨강", "파랑"],
  },
  // ----- 8세: grouped/number patterns + category odd-one-out -----
  {
    level: 8,
    prompt: "다음에 올 것은?",
    display: "🍎 🍎 🍌 🍎 🍎 🍌 🍎 🍎 ?",
    answer: "🍌",
    distractors: ["🍇", "🍕", "🥕"],
  },
  {
    level: 8,
    prompt: "다음에 올 것은?",
    display: "1 3 5 7 ?",
    answer: "9",
    distractors: ["8", "10", "6"],
  },
  {
    level: 8,
    prompt: "다음에 올 것은?",
    display: "🌱 🌿 🌳 🌱 🌿 ?",
    answer: "🌳",
    distractors: ["🍃", "🌸", "🪵"],
  },
  {
    level: 8,
    prompt: "다음에 올 것은?",
    display: "5 10 15 20 ?",
    answer: "25",
    distractors: ["30", "24", "21"],
  },
  {
    level: 8,
    prompt: "어울리지 않는 하나는?",
    answer: "다람쥐",
    distractors: ["까치", "비둘기", "참새"],
  },
  {
    level: 8,
    prompt: "어울리지 않는 하나는?",
    answer: "아침",
    distractors: ["여름", "겨울", "가을"],
  },
  {
    level: 8,
    prompt: "어울리지 않는 하나는?",
    answer: "무",
    distractors: ["사과", "배", "감"],
  },
  {
    level: 8,
    prompt: "어울리지 않는 하나는?",
    answer: "주말",
    distractors: ["월요일", "화요일", "수요일"],
  },
];

// ---------- memory flash pool ----------

export const MEMORY_FLASH_POOL: string[] = [
  "🍎", "🍌", "🍇", "🧀", "🍕", "🍉", "🍓", "🥕", "🌽", "🍳",
  "🐶", "🐱", "🐰", "🦁", "🐸", "🐵", "🦊", "⭐", "🌙", "🎈",
];

const FLASH_ITEMS: Record<CampingAge, number> = { 6: 4, 8: 6 };
const FLASH_MS: Record<CampingAge, number> = { 6: 4000, 8: 5000 };

type MemoryVariant = "absent" | "present";

function memoryRound(
  rng: () => number,
  age: CampingAge,
  variant: MemoryVariant,
): CampingRound {
  const n = FLASH_ITEMS[age];
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
      flash: { items, ms: FLASH_MS[age] },
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
    flash: { items, ms: FLASH_MS[age] },
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

function mathRound(
  rng: () => number,
  age: CampingAge,
  occurrence: number,
): CampingRound {
  const int = (max: number) => 1 + Math.floor(rng() * max);
  // 6세: add/sub with the ANSWER capped at 10. 8세 occurrence 0: add/sub
  // within 50; occurrence 1: multiplication tables 2–5 (guaranteed ×).
  if (age === 6 && occurrence === 1) {
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
  if (age === 8 && occurrence === 1) {
    const t = 2 + Math.floor(rng() * 4); // 2..5
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
  // shared add path (6세 occurrence 0 / 8세 occurrence 0 with wider range)
  if (age === 6 || rng() < 0.5) {
    if (age === 6) {
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
    const a = 1 + Math.floor(rng() * 49);
    const b = 1 + Math.floor(rng() * 49);
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
  // 8세 subtraction within 50, never negative
  const hi = 10 + Math.floor(rng() * 41); // 10..50
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

function wordTier(age: CampingAge): DictationTier {
  return age === 6 ? "words" : "sentences";
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
      LOGIC_BANK.filter((p) => p.level === player.age),
      rng,
    );
    const words = buildDictationQuestions(
      wordTier(player.age),
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
          return memoryRound(rng, player.age, occurrence === 0 ? "absent" : "present");
        case "logic":
          return logicRound(logicBank[occurrence], rng);
        case "math":
          return mathRound(rng, player.age, occurrence);
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

/** Quantified difficulty badge: 6세 22 (🌱), 8세 34 (🔥). */
export function campingDifficulty(age: CampingAge): number {
  return age === 6 ? 22 : 34;
}

export interface CampingScore {
  score: number;
  totalSeconds: number;
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
  const rows = players.map((player, i) => ({
    player,
    score: scores[i].score,
    totalSeconds: scores[i].totalSeconds,
  }));
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
