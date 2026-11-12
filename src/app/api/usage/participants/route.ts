import { validateParticipantName } from "@/lib/usage";
import { bearerOf, getDb, getMasterKey } from "@/lib/usage-d1";

// Participant issuance (admin = master key). Keys are returned ONCE at
// creation; listing never exposes them.

export const dynamic = "force-dynamic";

async function requireMaster(request: Request): Promise<boolean> {
  const bearer = bearerOf(request);
  if (!bearer) return false;
  const master = await getMasterKey();
  return master !== undefined && bearer === master;
}

export async function GET(request: Request) {
  if (!(await requireMaster(request))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const db = await getDb();
    const { results } = await db
      .prepare(
        `SELECT p.name AS name, p.created_at AS created_at, s.synced_at AS synced_at
         FROM usage_participants p
         LEFT JOIN usage_snapshots s ON s.participant = p.name
         ORDER BY p.created_at`,
      )
      .all<{ name: string; created_at: string; synced_at: string | null }>();
    return Response.json({ participants: results });
  } catch (err) {
    return Response.json(
      { error: `participant list failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await requireMaster(request))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const name = validateParticipantName((body as { name?: unknown })?.name);
  if (!name) {
    return Response.json(
      { error: "invalid name (1-16 chars, hangul/latin/digit/space/-/_)" },
      { status: 400 },
    );
  }
  const key = crypto.randomUUID().replace(/-/g, "");
  try {
    const db = await getDb();
    const existing = await db
      .prepare("SELECT id FROM usage_participants WHERE name = ?")
      .bind(name)
      .first<{ id: number }>();
    if (existing) {
      return Response.json({ error: "name already taken" }, { status: 409 });
    }
    await db
      .prepare("INSERT INTO usage_participants (name, key) VALUES (?, ?)")
      .bind(name, key)
      .run();
    // Returned exactly once — store it somewhere safe.
    return Response.json({ ok: true, name, key });
  } catch (err) {
    return Response.json(
      { error: `participant create failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
