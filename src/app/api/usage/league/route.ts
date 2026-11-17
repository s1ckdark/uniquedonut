import {
  computeLeagueMetrics,
  summarizeParticipant,
  type LeagueEntry,
} from "@/lib/usage";
import { getDb, readLeagueBoards } from "@/lib/usage-d1";

// Lightweight league-only endpoint — the board's day navigation refetches
// just the ranking (optionally for a specific day) without touching the
// personal board/snapshot the viewer is looking at.

export const dynamic = "force-dynamic";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  try {
    const raw = new URL(request.url).searchParams.get("day");
    const day = raw && DAY_RE.test(raw) ? raw : undefined;
    const db = await getDb();
    const boards = await readLeagueBoards(db);
    const { anchorDay, metrics } = computeLeagueMetrics(
      boards.map((b) => ({ name: b.participant, snapshot: b.snapshot })),
      day,
    );
    const league: LeagueEntry[] = boards.flatMap((b) => {
      const m = metrics.get(b.participant);
      if (!m) return [];
      return [{ ...summarizeParticipant(b.participant, b.snapshot), ...m }];
    });
    return Response.json({ anchorDay, league });
  } catch (err) {
    return Response.json(
      { error: `league read failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
