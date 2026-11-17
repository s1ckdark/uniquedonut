import {
  buildDailyReport,
  computeLeagueMetrics,
  summarizeParticipant,
  validateParticipantName,
  validateUsageSnapshot,
  type LeagueEntry,
  type UsageSnapshot,
} from "@/lib/usage";
import {
  bearerOf,
  getDb,
  readAllBoards,
  readLegacyBoard,
  resolveParticipant,
} from "@/lib/usage-d1";

// Usage league API (WakaTime model): each participant pushes their own
// aggregated snapshot nightly with a personal bearer key. The master key
// maps to the owner "dave" (legacy racknerd cron unchanged). GET serves
// the owner view plus the ranked league summary.

export const dynamic = "force-dynamic";

const MAX_PAYLOAD_CHARS = 512_000;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

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
    // 공통 기준 리그 지표 — 같은 날/같은 7일 창/달력 월로 비교
    // (?leagueDay=YYYY-MM-DD 면 일간 축을 그 날짜로 이동해 반환)
    const rawDay = new URL(request.url).searchParams.get("leagueDay");
    const dayOverride = rawDay && DAY_RE.test(rawDay) ? rawDay : undefined;
    const { anchorDay, metrics } = computeLeagueMetrics(
      leagueBoards.map((b) => ({ name: b.participant, snapshot: b.snapshot })),
      dayOverride,
    );
    const league: LeagueEntry[] = leagueBoards.flatMap((b) => {
      const m = metrics.get(b.participant);
      if (!m) return [];
      return [{ ...summarizeParticipant(b.participant, b.snapshot), ...m }];
    });
    return Response.json({
      snapshot: owner?.snapshot ?? null,
      report: owner ? buildDailyReport(owner.snapshot) : null,
      viewing: owner?.participant ?? null,
      anchorDay,
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
