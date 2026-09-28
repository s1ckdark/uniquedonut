// Quiz Arena leaderboard on Cloudflare D1 (shared across every device).
// Pure helpers are unit-tested; the async wrappers hit the route handler
// and sanitize responses again as defense in depth.

export interface LeaderboardEntry {
  id?: number; // DB row id — present for entries fetched from the API
  name: string;
  school?: string; // elementary school name, e.g. "위니초"
  score: number;
  totalSeconds: number;
  date: string; // ISO date
  difficulty?: number; // 0–100; optional for entries saved before this field
  op?: string; // add|sub|mul|div; legacy entries predate operations
  topic?: string; // content-topic slug for story quizzes
}

const VALID_OPS = ["add", "sub", "mul", "div"];

/** Validate and normalize a raw entry (e.g. from JSON or user input).
 *  Returns null when anything is out of range. */
export function sanitizeEntry(raw: unknown): LeaderboardEntry | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { id, name, school, score, totalSeconds, date, difficulty, op, topic } = raw as Record<
    string,
    unknown
  >;
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed.length < 1 || trimmed.length > 12) return null;
  const schoolTrimmed =
    typeof school === "string" ? school.trim() : undefined;
  if (schoolTrimmed !== undefined && schoolTrimmed.length > 16) return null;
  if (typeof score !== "number" || score < 0 || score > 100) return null;
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
  if (id !== undefined && typeof id !== "number") return null;
  return {
    ...(typeof id === "number" ? { id } : {}),
    name: trimmed,
    ...(schoolTrimmed ? { school: schoolTrimmed } : {}),
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

const API = "/api/quiz/leaderboard";

/** Fetch the shared top-50 leaderboard. */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch(API);
  if (!res.ok) {
    throw new Error(`리더보드 불러오기 실패 (${res.status})`);
  }
  const data = (await res.json()) as { entries?: unknown };
  if (!Array.isArray(data.entries)) return [];
  return data.entries
    .map(sanitizeEntry)
    .filter((e): e is LeaderboardEntry => e !== null);
}

/** Submit a run; returns the inserted row id plus the fresh leaderboard. */
export async function submitScore(
  entry: LeaderboardEntry,
): Promise<{ id: number; entries: LeaderboardEntry[] }> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) {
    throw new Error(`점수 저장 실패 (${res.status})`);
  }
  const data = (await res.json()) as { id?: number; entries?: unknown };
  if (typeof data.id !== "number") {
    throw new Error("점수 저장 실패 (응답 이상)");
  }
  const entries = Array.isArray(data.entries)
    ? data.entries
        .map(sanitizeEntry)
        .filter((e): e is LeaderboardEntry => e !== null)
    : [];
  return { id: data.id, entries };
}
