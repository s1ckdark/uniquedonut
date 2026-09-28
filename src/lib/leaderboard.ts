// Quiz Arena leaderboard: entries live in localStorage (per-browser, no
// server needed — works on every deploy target). Pure helpers are
// unit-tested; the storage wrappers guard for non-browser environments.

export interface LeaderboardEntry {
  name: string;
  score: number;
  totalSeconds: number;
  date: string; // ISO date
  difficulty?: number; // 0–100; optional for entries saved before this field
  op?: string; // add|sub|mul|div; legacy entries predate operations
  topic?: string; // content-topic slug for story quizzes
}

const STORAGE_KEY = "gino-quiz-leaderboard";
const MAX_ENTRIES = 50;
const VALID_OPS = ["add", "sub", "mul", "div"];

/** Validate and normalize a raw entry (e.g. from JSON or user input).
 *  Returns null when anything is out of range. */
export function sanitizeEntry(raw: unknown): LeaderboardEntry | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { name, score, totalSeconds, date, difficulty, op, topic } = raw as Record<
    string,
    unknown
  >;
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed.length < 1 || trimmed.length > 12) return null;
  if (typeof score !== "number" || score < 0 || score > 50) return null;
  if (
    typeof totalSeconds !== "number" ||
    totalSeconds < 0 ||
    totalSeconds > 3600
  ) {
    return null;
  }
  if (
    difficulty !== undefined &&
    (typeof difficulty !== "number" || difficulty < 0 || difficulty > 100)
  ) {
    return null;
  }
  if (op !== undefined && !VALID_OPS.includes(op as string)) return null;
  if (
    topic !== undefined &&
    (typeof topic !== "string" || !/^[a-z0-9-]{1,30}$/.test(topic))
  ) {
    return null;
  }
  return {
    name: trimmed,
    score,
    totalSeconds,
    date: typeof date === "string" ? date : new Date().toISOString(),
    ...(difficulty === undefined ? {} : { difficulty }),
    ...(op === undefined ? {} : { op: op as string }),
    ...(topic === undefined ? {} : { topic }),
  };
}

/** Rank order: higher score first; on ties the faster run wins. */
export function sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort(
    (x, y) => y.score - x.score || x.totalSeconds - y.totalSeconds,
  );
}

export function formatTime(seconds: number): string {
  return `${seconds.toFixed(1)}초`;
}

export function loadLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "[]",
    ) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .map(sanitizeEntry)
      .filter((e): e is LeaderboardEntry => e !== null);
  } catch {
    return [];
  }
}

export function addEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  const next = sortEntries([...loadLeaderboard(), entry]).slice(
    0,
    MAX_ENTRIES,
  );
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}
