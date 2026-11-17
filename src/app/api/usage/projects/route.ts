import {
  validateLink,
  validateProjectText,
  validateProjectTitle,
} from "@/lib/usage";
import { bearerOf, getDb, resolveParticipant } from "@/lib/usage-d1";

// Burn-projects gallery: participants register what they BUILT with the
// tokens they burned. GET is public; register/remove need a participant
// key (the master key acts as "dave").

export const dynamic = "force-dynamic";

const MAX_PROJECTS_PER_PARTICIPANT = 20;

interface ProjectRow {
  id: number;
  participant: string;
  title: string;
  url: string | null;
  repo: string | null;
  description: string | null;
  created_at: string;
}

export async function GET() {
  try {
    const db = await getDb();
    const { results } = await db
      .prepare(
        "SELECT id, participant, title, url, repo, description, created_at FROM usage_projects ORDER BY id DESC LIMIT 100",
      )
      .all<ProjectRow>();
    return Response.json({ projects: results });
  } catch (err) {
    return Response.json(
      { error: `project list failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const bearer = bearerOf(request);
  if (!bearer) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const title = validateProjectTitle(body.title);
  if (!title) {
    return Response.json(
      { error: "invalid title (1-40자)" },
      { status: 400 },
    );
  }
  const url = validateLink(body.url);
  const repo = validateLink(body.repo);
  const description = validateProjectText(body.description, 200);
  if (body.url !== undefined && body.url !== null && body.url !== "" && !url) {
    return Response.json({ error: "invalid url (http/https만)" }, { status: 400 });
  }
  if (body.repo !== undefined && body.repo !== null && body.repo !== "" && !repo) {
    return Response.json({ error: "invalid repo url" }, { status: 400 });
  }
  try {
    const db = await getDb();
    const who = await resolveParticipant(db, bearer);
    if (!who) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    const count = await db
      .prepare("SELECT COUNT(*) AS n FROM usage_projects WHERE participant = ?")
      .bind(who.name)
      .first<{ n: number }>();
    if ((count?.n ?? 0) >= MAX_PROJECTS_PER_PARTICIPANT) {
      return Response.json(
        { error: `등록 한도(${MAX_PROJECTS_PER_PARTICIPANT}개) 초과` },
        { status: 429 },
      );
    }
    const result = await db
      .prepare(
        "INSERT INTO usage_projects (participant, title, url, repo, description) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(who.name, title, url, repo, description)
      .run();
    const id = (result as { meta?: { last_row_id?: number } }).meta?.last_row_id;
    return Response.json({ ok: true, id, participant: who.name, title });
  } catch (err) {
    return Response.json(
      { error: `project create failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const bearer = bearerOf(request);
  if (!bearer) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }
  try {
    const db = await getDb();
    const who = await resolveParticipant(db, bearer);
    if (!who) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    const row = await db
      .prepare("SELECT participant FROM usage_projects WHERE id = ?")
      .bind(id)
      .first<{ participant: string }>();
    if (!row) {
      return Response.json({ error: "not found" }, { status: 404 });
    }
    if (!who.admin && row.participant !== who.name) {
      return Response.json({ error: "not yours" }, { status: 403 });
    }
    await db.prepare("DELETE FROM usage_projects WHERE id = ?").bind(id).run();
    return Response.json({ ok: true, id });
  } catch (err) {
    return Response.json(
      { error: `project delete failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
