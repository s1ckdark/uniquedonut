// Warming Sea: yearly SST aggregation, sea color mapping, contour bands,
// and the fishery scenario timeline. Pure module — no DOM, no React.

/** One day of sea temperatures from the Open-Meteo Marine API (°C). */
export interface DailyRow {
  date: string; // ISO date
  tmax: number | null;
  tmin: number | null;
}

export interface YearAverage {
  year: number;
  avg: number;
  days: number;
}

/** Average daily (max+min)/2 per calendar year, skipping missing days. */
export function yearlyAverages(rows: DailyRow[]): YearAverage[] {
  const buckets = new Map<number, { sum: number; count: number }>();
  for (const r of rows) {
    if (!Number.isFinite(r.tmax) || !Number.isFinite(r.tmin)) continue;
    const year = Number(r.date.slice(0, 4));
    const mid = ((r.tmax as number) + (r.tmin as number)) / 2;
    const b = buckets.get(year) ?? { sum: 0, count: 0 };
    b.sum += mid;
    b.count += 1;
    buckets.set(year, b);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, b]) => ({ year, avg: b.sum / b.count, days: b.count }));
}

// Sea color ramp: cool deep blue → warm sea green (15–26°C, clamped).
const STOPS: [number, [number, number, number]][] = [
  [15, [13, 74, 122]],
  [18, [23, 105, 158]],
  [20, [38, 143, 168]],
  [22, [51, 171, 154]],
  [24, [69, 195, 154]],
  [26, [102, 214, 163]],
];

/** Interpolated sea color for a temperature. */
export function tempToSeaColor(temp: number): string {
  const t = Math.min(26, Math.max(15, temp));
  let lo = STOPS[0];
  let hi = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (t >= STOPS[i][0] && t <= STOPS[i + 1][0]) {
      lo = STOPS[i];
      hi = STOPS[i + 1];
      break;
    }
  }
  const span = hi[0] - lo[0] || 1;
  const k = (t - lo[0]) / span;
  const mix = lo[1].map((c, i) => Math.round(c + (hi[1][i] - c) * k));
  return `rgb(${mix[0]},${mix[1]},${mix[2]})`;
}

/** Isotherm band temps around the island, coast outward. 0.5°C steps over
 *  a ±2°C spread → 9 bands with clearly distinct fill colors (coast
 *  warmest, open water coolest). */
export function contourBands(
  yearAvg: number,
  step = 0.5,
  halfSpread = 2,
): number[] {
  const bands: number[] = [];
  for (let t = yearAvg + halfSpread; t > yearAvg - halfSpread - step / 2; t -= step) {
    bands.push(t);
  }
  return bands;
}

export type FishTrend = "in" | "out" | "stable";

export interface FishEntry {
  emoji: string;
  name: string;
  note: string;
  trend: FishTrend;
}

/** Fishery timeline by stage index (0 = three years ago, 3 = now).
 *  Educational scenario based on reported Jeju coastal trends —
 *  the page labels it as a scenario, not measured catches. */
export const FISH_STAGES: FishEntry[][] = [
  [
    { emoji: "🐠", name: "옥돔", note: "제주의 대표 물고기!", trend: "stable" },
    { emoji: "🐟", name: "벵에돔", note: "바위 근처를 노래요.", trend: "stable" },
    { emoji: "🐚", name: "소라", note: "서늘한 바다를 좋아해요.", trend: "stable" },
    { emoji: "🐡", name: "돗돔", note: "말미잘과 친구 같은 물고기.", trend: "stable" },
  ],
  [
    { emoji: "🐡", name: "돌돔", note: "따뜻한 바다에서 점점 늘어요.", trend: "in" },
    { emoji: "🐠", name: "옥돔", note: "아직 제주의 주인공!", trend: "stable" },
    { emoji: "🐟", name: "참돔", note: "낚시꾼들의 인기 스타.", trend: "stable" },
    { emoji: "🐚", name: "소라", note: "조금씩 줄어들기 시작해요.", trend: "out" },
  ],
  [
    { emoji: "🐠", name: "벤자리", note: "아열대 손님이 등장!", trend: "in" },
    { emoji: "🐟", name: "그물반지", note: "따뜻한 남쪽 바다 출신.", trend: "in" },
    { emoji: "🐚", name: "보말", note: "어획량이 많이 줄었어요.", trend: "out" },
    { emoji: "🐠", name: "옥돔", note: "점점 멀리 떠나가요.", trend: "out" },
  ],
  [
    { emoji: "🐠", name: "벤자리", note: "이제 제주의 단골이에요.", trend: "stable" },
    { emoji: "🐟", name: "돌돔", note: "아열대 친구들이 자리 잡았어요.", trend: "in" },
    { emoji: "🐟", name: "대방어", note: "예전보다 찾기 어려워요.", trend: "out" },
    { emoji: "🐚", name: "보말", note: "서늘한 바다를 찾아 떠났어요.", trend: "out" },
  ],
];

export function fishForStageIndex(i: number): FishEntry[] {
  return FISH_STAGES[Math.min(Math.max(i, 0), FISH_STAGES.length - 1)];
}
