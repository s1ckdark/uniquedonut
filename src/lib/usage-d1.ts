// Server-only helpers shared by the usage API routes: D1 access, table
// bootstrap, and bearer-key → participant resolution. Not unit-tested
// (needs the Cloudflare runtime); pure logic lives in ./usage.

import { getCloudflareContext } from "@opennextjs/cloudflare";

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
