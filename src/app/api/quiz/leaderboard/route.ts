import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  sanitizeEntry,
  type LeaderboardEntry,
} from "@/lib/leaderboard";

// Quiz leaderboard on Cloudflare D1. The table bootstraps itself on the
// first request per environment (IF NOT EXISTS), so no migration step is
// needed locally or on deploy.

export const dynamic = "force-dynamic";

// Minimal local types — avoids a @cloudflare/workers-types dependency.
interface D1Result<T> {
  results: T[];
}
interface D1Meta {
  last_row_id?: number;
  changes?: number;
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<D1Result<T>>;
  run(): Promise<{ meta?: D1Meta }>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface ScoreRow {
  id: number;
  name: string;
  school: string | null;
  score: number;
  total_seconds: number;
  difficulty: number | null;
  op: string | null;
  topic: string | null;
  created_at: string;
}

const BOOTSTRAP_SQL = `CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  school TEXT,
  score REAL NOT NULL,
  total_seconds REAL NOT NULL,
  difficulty INTEGER,
  op TEXT,
  topic TEXT,
  created_at TEXT NOT NULL
)`;

async function getDb(): Promise<D1Database> {
  const { env } = await getCloudflareContext();
  const db = (env as Record<string, unknown>).DB as D1Database | undefined;
  if (!db) {
    throw new Error("D1 binding 'DB' is not configured in wrangler.jsonc");
  }
  await db.prepare(BOOTSTRAP_SQL).run();
  // Migrate tables created before the school column existed. SQLite has no
  // ADD COLUMN IF NOT EXISTS, so swallow the duplicate-column error.
  try {
    await db.prepare("ALTER TABLE scores ADD COLUMN school TEXT").run();
  } catch {
    // column already present
  }
  return db;
}

function toEntry(row: ScoreRow): LeaderboardEntry & { id: number } {
  return {
    id: row.id,
    name: row.name,
    ...(row.school === null ? {} : { school: row.school }),
    score: row.score,
    totalSeconds: row.total_seconds,
    date: row.created_at,
    ...(row.difficulty === null ? {} : { difficulty: row.difficulty }),
    ...(row.op === null ? {} : { op: row.op }),
    ...(row.topic === null ? {} : { topic: row.topic }),
  };
}

async function topEntries(db: D1Database): Promise<LeaderboardEntry[]> {
  const { results } = await db
    .prepare(
      `SELECT id, name, school, score, total_seconds, difficulty, op, topic, created_at
       FROM scores
       ORDER BY score DESC, total_seconds ASC, created_at DESC
       LIMIT 50`,
    )
    .all<ScoreRow>();
  return results
    .map((row) => sanitizeEntry(toEntry(row)))
    .filter((e): e is LeaderboardEntry => e !== null);
}

export async function GET() {
  try {
    const db = await getDb();
    return Response.json({ entries: await topEntries(db) });
  } catch (err) {
    return Response.json(
      { error: `leaderboard read failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const entry = sanitizeEntry(body);
  if (!entry) {
    return Response.json(
      { error: "invalid entry (name/score/time out of range)" },
      { status: 400 },
    );
  }

  try {
    const db = await getDb();
    // INSERT returns no rows in D1 — the new id arrives via meta.last_row_id.
    const result = await db
      .prepare(
        `INSERT INTO scores (name, school, score, total_seconds, difficulty, op, topic, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        entry.name,
        entry.school ?? null,
        entry.score,
        entry.totalSeconds,
        entry.difficulty ?? null,
        entry.op ?? null,
        entry.topic ?? null,
        entry.date,
      )
      .run();
    const id = result.meta?.last_row_id;
    if (typeof id !== "number") {
      return Response.json({ error: "insert failed" }, { status: 500 });
    }
    return Response.json({ id, entries: await topEntries(db) });
  } catch (err) {
    return Response.json(
      { error: `leaderboard write failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
