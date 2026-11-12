import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  buildDailyReport,
  validateUsageSnapshot,
  type UsageSnapshot,
} from "@/lib/usage";

// AI usage board snapshot store on Cloudflare D1 (option-2 snapshot push:
// the nightly job POSTs one aggregated JSON; the board reads it back).
// The table bootstraps itself (IF NOT EXISTS) per environment.

export const dynamic = "force-dynamic";

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
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface SnapshotRow {
  payload: string;
  synced_at: string;
}

const BOOTSTRAP_SQL = `CREATE TABLE IF NOT EXISTS usage_board (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  payload TEXT NOT NULL,
  synced_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
)`;

const MAX_PAYLOAD_CHARS = 512_000;

async function getDb(): Promise<D1Database> {
  const { env } = await getCloudflareContext();
  const db = (env as Record<string, unknown>).DB as D1Database | undefined;
  if (!db) {
    throw new Error("D1 binding 'DB' is not configured in wrangler.jsonc");
  }
  await db.prepare(BOOTSTRAP_SQL).run();
  return db;
}

/** Exact-match bearer secret from the environment — nothing in source.
 *  Covers both Node-style process.env and the Workers env binding
 *  (`.dev.vars` / `wrangler secret`). */
async function authorized(request: Request): Promise<boolean> {
  let expected = process.env.USAGE_PUSH_SECRET;
  if (!expected) {
    try {
      const { env } = await getCloudflareContext();
      expected = (env as Record<string, unknown>).USAGE_PUSH_SECRET as
        | string
        | undefined;
    } catch {
      // no Cloudflare context (unit tests) — no secret configured
    }
  }
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;
  return header.slice(prefix.length) === expected;
}

export async function GET() {
  try {
    const db = await getDb();
    const row = await db
      .prepare("SELECT payload, synced_at FROM usage_board WHERE id = 1")
      .first<SnapshotRow>();
    if (!row) {
      return Response.json({ snapshot: null });
    }
    const snapshot = validateUsageSnapshot(JSON.parse(row.payload));
    if (!snapshot) {
      return Response.json(
        { error: "stored snapshot failed validation" },
        { status: 500 },
      );
    }
    // The daily report is derived from the snapshot on read — it refreshes
    // itself with every 00:00 KST push, no separate storage needed.
    return Response.json({
      snapshot,
      report: buildDailyReport(snapshot),
      storedAt: row.synced_at,
    });
  } catch (err) {
    return Response.json(
      { error: `usage read failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await authorized(request))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const raw = await request.text();
  if (raw.length > MAX_PAYLOAD_CHARS) {
    return Response.json(
      { error: `payload too large (${raw.length} > ${MAX_PAYLOAD_CHARS} chars)` },
      { status: 413 },
    );
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const snapshot: UsageSnapshot | null = validateUsageSnapshot(body);
  if (!snapshot) {
    return Response.json(
      { error: "invalid snapshot (dates/dow/hour/numbers or array caps)" },
      { status: 400 },
    );
  }
  try {
    const db = await getDb();
    await db
      .prepare(
        `INSERT INTO usage_board (id, payload, synced_at, updated_at)
         VALUES (1, ?, ?, strftime('%Y-%m-%dT%H:%M:%SZ','now'))
         ON CONFLICT(id) DO UPDATE SET
           payload = excluded.payload,
           synced_at = excluded.synced_at,
           updated_at = excluded.updated_at`,
      )
      .bind(raw, snapshot.syncedAt)
      .run();
    return Response.json({ ok: true, syncedAt: snapshot.syncedAt });
  } catch (err) {
    return Response.json(
      { error: `usage write failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
