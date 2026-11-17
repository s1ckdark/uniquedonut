import {
  buildDailyReport,
  summarizeParticipant,
  validateParticipantName,
  validateUsageSnapshot,
  type ParticipantSummary,
  type UsageSnapshot,
} from "@/lib/usage";
import { bearerOf, getDb, resolveParticipant } from "@/lib/usage-d1";

// Usage league API (WakaTime model): each participant pushes their own
// aggregated snapshot nightly with a personal bearer key. The master key
// maps to the owner "dave" (legacy racknerd cron unchanged). GET serves
// the owner view plus the ranked league summary.

export const dynamic = "force-dynamic";

interface SnapshotRow {
  participant: string;
  payload: string;
  synced_at: string;
}

const MAX_PAYLOAD_CHARS = 512_000;

interface StoredBoard {
  participant: string;
  snapshot: UsageSnapshot;
  storedAt: string;
}

async function readAllBoards(db: Awaited<ReturnType<typeof getDb>>): Promise<StoredBoard[]> {
  const { results } = await db
    .prepare("SELECT participant, payload, synced_at FROM usage_snapshots")
    .all<SnapshotRow>();
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

/** Legacy single-row fallback: the pre-league `usage_board` row reads as
 *  "dave" until the first push lands in the new table. */
async function readLegacyBoard(db: Awaited<ReturnType<typeof getDb>>): Promise<StoredBoard | null> {
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

export async function GET(request: Request) {
  try {
    const db = await getDb();
    const boards = await readAllBoards(db);
    // 오너(dave) 보드: 신규 테이블에 없으면 레거시 1행에서 폴백 —
    // 리그에는 누구의 보드를 보든 항상 포함된다.
    let daveBoard = boards.find((b) => b.participant === "dave") ?? null;
    if (!daveBoard) {
      daveBoard = await readLegacyBoard(db);
    }
    // 랭킹 클릭 등으로 다른 참가자의 보드를 볼 때: ?participant=이름
    // (요약은 집계 수치뿐이라 공개해도 안전 — 리그 지수와 같은 데이터)
    const wanted = validateParticipantName(
      new URL(request.url).searchParams.get("participant"),
    );
    const owner =
      (wanted && wanted !== "dave"
        ? boards.find((b) => b.participant === wanted) ?? null
        : null) ?? daveBoard;
    const leagueBoards =
      daveBoard && !boards.some((b) => b.participant === "dave")
        ? [...boards, daveBoard]
        : boards;
    const league: ParticipantSummary[] = leagueBoards.map((b) =>
      summarizeParticipant(b.participant, b.snapshot),
    );
    return Response.json({
      snapshot: owner?.snapshot ?? null,
      report: owner ? buildDailyReport(owner.snapshot) : null,
      viewing: owner?.participant ?? null,
      league,
      storedAt: owner?.storedAt ?? null,
    });
  } catch (err) {
    return Response.json(
      { error: `usage read failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const bearer = bearerOf(request);
  if (!bearer) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const db = await getDb();
    const who = await resolveParticipant(db, bearer);
    if (!who) {
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
    const snapshot = validateUsageSnapshot(body);
    if (!snapshot) {
      return Response.json(
        { error: "invalid snapshot (dates/dow/hour/numbers or array caps)" },
        { status: 400 },
      );
    }
    await db
      .prepare(
        `INSERT INTO usage_snapshots (participant, payload, synced_at, updated_at)
         VALUES (?, ?, ?, strftime('%Y-%m-%dT%H:%M:%SZ','now'))
         ON CONFLICT(participant) DO UPDATE SET
           payload = excluded.payload,
           synced_at = excluded.synced_at,
           updated_at = excluded.updated_at`,
      )
      .bind(who.name, raw, snapshot.syncedAt)
      .run();
    return Response.json({ ok: true, participant: who.name, syncedAt: snapshot.syncedAt });
  } catch (err) {
    return Response.json(
      { error: `usage write failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
