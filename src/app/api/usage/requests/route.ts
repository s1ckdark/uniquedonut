import { validateEmail, validateParticipantName } from "@/lib/usage";
import { bearerOf, getDb, getMasterKey } from "@/lib/usage-d1";

// Join-request queue: anyone can request a league spot by name + email
// (public); the owner (master key) lists/approves/denies. Approving
// issues the participant key — emailed to the requester when RESEND_API_KEY
// + EMAIL_FROM are configured, and returned exactly once to the owner.

export const dynamic = "force-dynamic";

const MAX_PENDING = 20;
const BOARD_URL = "https://uniquedonut.com/usage";
const AGENT_URL = "https://uniquedonut.com/tokenholic-agent.mjs";

interface RequestRow {
  id: number;
  name: string;
  status: string;
  created_at: string;
  decided_at: string | null;
  email: string | null;
}

/** Approve 시 참가자 키를 이메일로 발송 — Resend 설정이 없으면 false. */
async function emailKey(to: string, name: string, key: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return false;
  const subject = "[TOKENHOLIC] 참가자 키가 도착했어요 🔑";
  const text = [
    `TOKENHOLIC 리그 참가가 승인되었습니다!`,
    ``,
    `이름: ${name}`,
    `참가자 키: ${key}`,
    ``,
    `설치 (macOS/Linux, Node 18+):`,
    `curl -fsSL ${AGENT_URL} -o /tmp/tokenholic-agent.mjs`,
    `node /tmp/tokenholic-agent.mjs install ${key}`,
    ``,
    `그다음 ~/.tokenholic/collect.sh 를 본인 사용량 스냅샷 JSON을`,
    `stdout으로 출력하게 수정하면 매일 자정 자동으로 랭킹에 반영됩니다.`,
    `보드: ${BOARD_URL}`,
  ].join("\n");
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
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
        "SELECT id, name, status, created_at, decided_at, email FROM usage_requests ORDER BY id DESC LIMIT 50",
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
    const email = validateEmail(body.email);
    if (!email) {
      return Response.json(
        { error: "invalid email (키를 받을 이메일이 필요해요)" },
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
        .prepare("INSERT INTO usage_requests (name, email) VALUES (?, ?)")
        .bind(name, email)
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
      .prepare("SELECT id, name, status, email FROM usage_requests WHERE id = ?")
      .bind(id)
      .first<{ id: number; name: string; status: string; email: string | null }>();
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
    // 이메일 발송 (Resend 미설정이면 false — 패널에 키를 직접 표시)
    const emailed =
      req.email !== null ? await emailKey(req.email, name, key) : false;
    // Returned exactly once — hand it to the owner as a fallback channel.
    return Response.json({ ok: true, action, id, name, key, emailed });
  } catch (err) {
    return Response.json(
      { error: `request decide failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
