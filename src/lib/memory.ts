// Memory challenge: deck building, scoring, and difficulty.
// Pure module — no DOM, no React.

export interface MemoryCard {
  id: number; // unique per card in the deck
  value: number; // pair number shown on the face (1..pairs)
  isBonus: boolean; // 🍩 card that matches itself instantly (odd grids)
}

// ---------- card themes ----------

export type MemoryTheme =
  | "numbers"
  | "animals"
  | "fruits"
  | "vehicles"
  | "shapes";

/** Distinct faces per theme — every list holds ≥18 entries so even a 6×6
 *  grid (18 pairs) can draw unique faces. */
export const THEME_FACES: Record<MemoryTheme, string[]> = {
  numbers: [],
  animals: [
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨",
    "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🦉",
  ],
  fruits: [
    "🍎", "🍌", "🍇", "🍓", "🍑", "🍒", "🥝", "🍍", "🥭",
    "🍉", "🍋", "🍐", "🫐", "🍊", "🥑", "🥥", "🍅", "🥕",
  ],
  vehicles: [
    "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒",
    "🚐", "🛻", "🚚", "🚜", "🚲", "🛵", "🚂", "✈️", "🚁",
  ],
  shapes: [
    "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "🟤", "⚫", "⚪",
    "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "⬛", "⬜", "🔷",
  ],
};

export const THEME_LABELS: Record<MemoryTheme, string> = {
  numbers: "🔢 숫자",
  animals: "🐾 동물",
  fruits: "🍎 과일",
  vehicles: "🚗 탈것",
  shapes: "🔷 도형",
};

/** The face shown for a pair value under a theme (numbers render digits). */
export function cardFace(theme: MemoryTheme, value: number): string {
  if (theme === "numbers") return String(value);
  return THEME_FACES[theme][value - 1] ?? String(value);
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Build a shuffled rows×cols deck. Odd totals get one self-matching bonus
 *  card so every card can be cleared. */
export function buildMemoryDeck(rows: number, cols: number): MemoryCard[] {
  const total = rows * cols;
  const odd = total % 2 === 1;
  const pairs = odd ? (total - 1) / 2 : total / 2;

  const cards: MemoryCard[] = [];
  let id = 0;
  for (let value = 1; value <= pairs; value++) {
    cards.push({ id: id++, value, isBonus: false });
    cards.push({ id: id++, value, isBonus: false });
  }
  if (odd) cards.push({ id: id++, value: 0, isBonus: true });
  return shuffle(cards);
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const clamp = (x: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, x));

export interface MemoryScoreInput {
  found: number; // matched units (pairs + bonus if found)
  total: number; // total units to clear
  timeLeftMs: number;
  limitMs: number;
  completed: boolean;
}

/** 100-point score: completing is worth 50–100 by speed; timing out is
 *  worth 50 × progress. */
export function computeMemoryScore(input: MemoryScoreInput): number {
  if (input.completed) {
    return round1(50 + 50 * (input.timeLeftMs / input.limitMs));
  }
  return round1(50 * (input.found / input.total));
}

/** Difficulty 0–100 using the shared tier labels: grid area plus up to 24
 *  points for tighter time limits. */
export function memoryDifficulty(
  rows: number,
  cols: number,
  limitSec: number,
): number {
  const gridPts = rows * cols; // 4..36
  const timePts = clamp(Math.round((240 - limitSec) / 8), 0, 24);
  return Math.round(clamp(gridPts + timePts, 0, 100));
}
