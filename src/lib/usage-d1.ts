// Server-only helpers shared by the usage API routes: D1 access, table
// bootstrap, and bearer-key → participant resolution. Not unit-tested
// (needs the Cloudflare runtime); pure logic lives in ./usage.

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { validateUsageSnapshot, type UsageSnapshot } from "./usage";

// Minimal local types — avoids a @cloudflare/workers-types dependency.
interface D1Result<T> {
  results: T[];
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<D1Result<T>>;
  run(): Promise<{ success: boolean }>;
}
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

const BOOTSTRAP_STATEMENTS = [
  // legacy single-row store (pre-league); kept readable for migration fallback
  `CREATE TABLE IF NOT EXISTS usage_board (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    payload TEXT NOT NULL,
    synced_at TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  )`,
  `CREATE TABLE IF NOT EXISTS usage_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  )`,
  `CREATE TABLE IF NOT EXISTS usage_snapshots (
    participant TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    synced_at TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  )`,
  `CREATE TABLE IF NOT EXISTS usage_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    decided_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS usage_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT,
    repo TEXT,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  )`,
];

export async function getDb(): Promise<D1Database> {
  const { env } = await getCloudflareContext();
  const db = (env as Record<string, unknown>).DB as D1Database | undefined;
  if (!db) {
    throw new Error("D1 binding 'DB' is not configured in wrangler.jsonc");
  }
  for (const sql of BOOTSTRAP_STATEMENTS) {
    await db.prepare(sql).run();
  }
  // 이메일 열은 기존 테이블엔 없음 — ADD COLUMN IF NOT EXISTS가 없어 중복 오류는 삼킴
  try {
    await db.prepare("ALTER TABLE usage_requests ADD COLUMN email TEXT").run();
  } catch {
    // column already present
  }
  return db;
}

/** Master key from the environment (nothing in source). Covers both the
 *  Node-style process.env and the Workers env binding (.dev.vars /
 *  wrangler secret). */
export async function getMasterKey(): Promise<string | undefined> {
  let key = process.env.USAGE_PUSH_SECRET;
  if (!key) {
    try {
      const { env } = await getCloudflareContext();
      key = (env as Record<string, unknown>).USAGE_PUSH_SECRET as
        | string
        | undefined;
    } catch {
      // no Cloudflare context — treat as unset
    }
  }
  return key;
}

export interface ResolvedParticipant {
  name: string;
  admin: boolean;
}

/** Bearer key → identity. The master key maps to the owner "dave"
 *  (backward compatible with the running racknerd cron); participant
 *  keys are looked up by bound parameter. */
export async function resolveParticipant(
  db: D1Database,
  bearer: string,
): Promise<ResolvedParticipant | null> {
  const master = await getMasterKey();
  if (master && bearer === master) {
    return { name: "dave", admin: true };
  }
  const row = await db
    .prepare("SELECT name FROM usage_participants WHERE key = ?")
    .bind(bearer)
    .first<{ name: string }>();
  return row ? { name: row.name, admin: false } : null;
}

/** Extracts the bearer token, or null when the header is malformed. */
export function bearerOf(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return null;
  return header.slice(prefix.length);
}

// ---------- stored board readers (usage 라우트들 공용) ----------

export interface StoredBoard {
  participant: string;
  snapshot: UsageSnapshot;
  storedAt: string;
}

export async function readAllBoards(
  db: D1Database,
): Promise<StoredBoard[]> {
  const { results } = await db
    .prepare("SELECT participant, payload, synced_at FROM usage_snapshots")
    .all<{ participant: string; payload: string; synced_at: string }>();
  const boards: StoredBoard[] = [];
  for (const row of results) {
    try {
      const snapshot = validateUsageSnapshot(JSON.parse(row.payload));
      if (snapshot) {
        boards.push({ participant: row.participant, snapshot, storedAt: row.synced_at });
      }
    } catch {
      // skip malformed rows (shouldn't happen — POST validates before write)
    }
  }
  return boards;
}

/** 레거시 단일 행 폴백: 리그 이전 usage_board 행은 "dave"로 읽힌다. */
export async function readLegacyBoard(
  db: D1Database,
): Promise<StoredBoard | null> {
  const row = await db
    .prepare("SELECT payload, synced_at FROM usage_board WHERE id = 1")
    .first<{ payload: string; synced_at: string }>();
  if (!row) return null;
  try {
    const snapshot = validateUsageSnapshot(JSON.parse(row.payload));
    if (!snapshot) return null;
    return { participant: "dave", snapshot, storedAt: row.synced_at };
  } catch {
    return null;
  }
}

/** 리그 계산용 전체 보드(레거시 dave 폴백 포함). */
export async function readLeagueBoards(db: D1Database): Promise<StoredBoard[]> {
  const boards = await readAllBoards(db);
  if (boards.some((b) => b.participant === "dave")) return boards;
  const legacy = await readLegacyBoard(db);
  return legacy ? [...boards, legacy] : boards;
}
