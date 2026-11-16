import { validateParticipantName } from "@/lib/usage";
import { bearerOf, getDb, getMasterKey } from "@/lib/usage-d1";

// Join-request queue: anyone can request a league spot by name (public);
// the owner (master key) lists/approves/denies. Approving issues the
// participant key — returned exactly once, only to the owner.

export const dynamic = "force-dynamic";

const MAX_PENDING = 20;

interface RequestRow {
  id: number;
  name: string;
  status: string;
  created_at: string;
  decided_at: string | null;
}

async function isAdmin(request: Request): Promise<boolean> {
  const bearer = bearerOf(request);
  if (!bearer) return false;
  const master = await getMasterKey();
  return master !== undefined && bearer === master;
}

async function requireAdmin(request: Request): Promise<boolean> {
  if (!(await isAdmin(request))) return false;
  return true;
}

/** GET (admin): recent requests, newest first. */
export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const db = await getDb();
    const { results } = await db
      .prepare(
        "SELECT id, name, status, created_at, decided_at FROM usage_requests ORDER BY id DESC LIMIT 50",
      )
      .all<RequestRow>();
    return Response.json({ requests: results });
  } catch (err) {
    return Response.json(
      { error: `request list failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

/**
 * POST — public: {name} files a join request.
 * POST — admin: {action: "approve"|"deny", id} decides it. Approve issues
 * the participant key once in the response.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  // ---- public: create a join request ----
  if (body.action === undefined || body.action === "create") {
    const name = validateParticipantName(body.name);
    if (!name) {
      return Response.json(
        { error: "invalid name (1-16 chars, hangul/latin/digit/space/-/_)" },
        { status: 400 },
      );
    }
    try {
      const db = await getDb();
      const taken = await db
        .prepare(
          `SELECT 1 AS x FROM usage_participants WHERE name = ?
           UNION ALL
           SELECT 1 AS x FROM usage_requests WHERE name = ? AND status = 'pending'`,
        )
        .bind(name, name)
        .first<{ x: number }>();
      if (taken) {
        return Response.json(
          { error: "name already taken or pending" },
          { status: 409 },
        );
      }
      const pending = await db
        .prepare("SELECT COUNT(*) AS n FROM usage_requests WHERE status = 'pending'")
        .first<{ n: number }>();
      if ((pending?.n ?? 0) >= MAX_PENDING) {
        return Response.json(
          { error: "request queue is full — try again later" },
          { status: 429 },
        );
      }
      await db
        .prepare("INSERT INTO usage_requests (name) VALUES (?)")
        .bind(name)
        .run();
      return Response.json({ ok: true, name });
    } catch (err) {
      return Response.json(
        { error: `request create failed: ${(err as Error).message}` },
        { status: 500 },
      );
    }
  }

  // ---- admin: approve / deny ----
  if (!(await isAdmin(request))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const action = body.action;
  const id = body.id;
  if (
    (action !== "approve" && action !== "deny") ||
    typeof id !== "number" ||
    !Number.isInteger(id)
  ) {
    return Response.json(
      { error: 'invalid action (expect {action:"approve"|"deny", id})' },
      { status: 400 },
    );
  }
  try {
    const db = await getDb();
    const req = await db
      .prepare("SELECT id, name, status FROM usage_requests WHERE id = ?")
      .bind(id)
      .first<{ id: number; name: string; status: string }>();
    if (!req) {
      return Response.json({ error: "request not found" }, { status: 404 });
    }
    if (req.status !== "pending") {
      return Response.json(
        { error: `already ${req.status}` },
        { status: 409 },
      );
    }
    if (action === "deny") {
      await db
        .prepare(
          "UPDATE usage_requests SET status = 'denied', decided_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ?",
        )
        .bind(id)
        .run();
      return Response.json({ ok: true, action, id });
    }
    // approve: re-check the name, issue the key, mark decided
    const name = validateParticipantName(req.name);
    if (!name) {
      return Response.json({ error: "stored name invalid" }, { status: 500 });
    }
    const existing = await db
      .prepare("SELECT id FROM usage_participants WHERE name = ?")
      .bind(name)
      .first<{ id: number }>();
    if (existing) {
      return Response.json({ error: "name already taken" }, { status: 409 });
    }
    const key = crypto.randomUUID().replace(/-/g, "");
    await db
      .prepare("INSERT INTO usage_participants (name, key) VALUES (?, ?)")
      .bind(name, key)
      .run();
    await db
      .prepare(
        "UPDATE usage_requests SET status = 'approved', decided_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ?",
      )
      .bind(id)
      .run();
    // Returned exactly once — hand it to the requester.
    return Response.json({ ok: true, action, id, name, key });
  } catch (err) {
    return Response.json(
      { error: `request decide failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
