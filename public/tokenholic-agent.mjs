#!/usr/bin/env node
// tokenholic-agent — TOKENHOLIC 리그 참여용 에이전트 (Node 18+, macOS/Linux)
//
// 사용:
//   node tokenholic-agent.mjs install <참가자키> [API_URL]   # 설정 저장 + 매일 00:15 cron 등록
//   node tokenholic-agent.mjs collect                        # ~/.tokenholic/collect.sh → snapshot.json
//   node tokenholic-agent.mjs push [FILE]                    # 스냅샷 POST (기본 snapshot.json)
//   node tokenholic-agent.mjs run                            # collect && push (cron이 호출)
//   node tokenholic-agent.mjs doctor                         # 키/설정/수집기 점검
//   node tokenholic-agent.mjs uninstall                      # cron/설정 제거
//
// 참여 3단계:
//   1) 운영자에게 참가자 키를 받는다
//   2) curl -fsSL <보드주소>/tokenholic-agent.mjs -o /tmp/tokenholic-agent.mjs
//      node /tmp/tokenholic-agent.mjs install <키>
//   3) ~/.tokenholic/collect.sh 를 만들어 표준 스냅샷 JSON을 stdout으로 출력하게 한다.
//      필수 필드/제한은 보드 하단 "참여 방법" 참고.
//
// cron은 참가자 머신의 현지 시각 00:15에 돈다 (한국 시간 기준 사용 권장).

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync, chmodSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_API = "https://uniquedonut.s1ckdark.workers.dev/api/usage";
const DIR = join(process.env.HOME ?? ".", ".tokenholic");
const AGENT_PATH = join(DIR, "agent.mjs");
const CONFIG_PATH = join(DIR, "config.json");
const COLLECTOR_PATH = join(DIR, "collect.sh");
const SNAPSHOT_PATH = join(DIR, "snapshot.json");
const CRON_MARK = "# tokenholic-agent";
const KEY_RE = /^[A-Za-z0-9_-]{8,64}$/;
// 프로덕션은 https 만; 로컬 개발/테스트는 localhost http 예외.
const API_RE = /^https:\/\/[A-Za-z0-9./_-]+$/;
const LOCAL_API_RE = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/[A-Za-z0-9./_-]*$/;
const apiOk = (u) => API_RE.test(u) || LOCAL_API_RE.test(u);

const say = (m) => console.log(m);
const die = (m) => {
  console.error(`ERROR: ${m}`);
  process.exit(1);
};

function readConfig() {
  if (!existsSync(CONFIG_PATH)) die("설정이 없습니다. 먼저: tokenholic-agent install <키>");
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    die("config.json이 손상되었습니다");
  }
  if (!KEY_RE.test(cfg.key ?? "") || !apiOk(cfg.api ?? "")) {
    die("config.json의 키/API가 손상되었습니다");
  }
  return cfg;
}

function currentCrontab() {
  try {
    return execFileSync("crontab", ["-l"], { encoding: "utf8" });
  } catch {
    return ""; // 아직 crontab 없음
  }
}

function writeCrontab(lines) {
  const tmp = join(tmpdir(), `tokenholic-cron-${process.pid}`);
  writeFileSync(tmp, lines.join("\n") + "\n", { mode: 0o600 });
  try {
    execFileSync("crontab", [tmp]);
  } finally {
    rmSync(tmp, { force: true });
  }
}

function install(argv) {
  const key = argv[0];
  const api = argv[1] ?? DEFAULT_API;
  if (!key) die("사용법: install <참가자키> [API_URL]");
  if (!KEY_RE.test(key)) die("키 형식이 이상합니다 (32-hex 권장)");
  if (!apiOk(api)) die("API URL은 https:// (또는 localhost http) 여야 합니다");
  mkdirSync(DIR, { recursive: true });

  // 자기 자신을 ~/.tokenholic/agent.mjs 로 복사 (curl|node 로 흘러들어온 경우 스킵)
  const selfPath = fileURLToPath(import.meta.url);
  if (selfPath !== AGENT_PATH) {
    copyFileSync(selfPath, AGENT_PATH);
    chmodSync(AGENT_PATH, 0o700);
  }

  writeFileSync(CONFIG_PATH, JSON.stringify({ key, api }, null, 2) + "\n", { mode: 0o600 });

  if (!existsSync(COLLECTOR_PATH)) {
    writeFileSync(
      COLLECTOR_PATH,
      `#!/usr/bin/env bash
# tokenholic 수집기 — 이 파일을 지우고 아래 규격에 맞는 JSON을 stdout으로 출력하게 수정하세요.
# 필수 필드/제한은 ${api.replace(/\/api\/usage$/, "/usage")} 하단 "참여 방법" 참고.
# 예시: your-collect --since 30d | to-snapshot
echo "COLLECTOR_NOT_CONFIGURED: ~/.tokenholic/collect.sh 를 수정하세요" >&2
exit 1
`,
      { mode: 0o700 },
    );
  }

  const kept = currentCrontab()
    .split("\n")
    .filter((l) => l.trim() !== "" && !l.includes(CRON_MARK));
  kept.push(`15 0 * * * /usr/bin/env node ${AGENT_PATH} run >> ${DIR}/agent.log 2>&1 ${CRON_MARK}`);
  writeCrontab(kept);
  say(`OK: installed. cron=매일 00:15 (현지 시각), agent=${AGENT_PATH}`);
  say(`다음: 1) ${COLLECTOR_PATH} 수정  2) node ${AGENT_PATH} run  3) node ${AGENT_PATH} doctor`);
}

function collect() {
  let st;
  try {
    st = statSync(COLLECTOR_PATH);
  } catch {
    die(`수집기가 없습니다: ${COLLECTOR_PATH}`);
  }
  if (!(st.mode & 0o111)) die(`수집기에 실행 권한이 없습니다: chmod +x ${COLLECTOR_PATH}`);
  let out;
  try {
    out = execFileSync(COLLECTOR_PATH, { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
  } catch (e) {
    die(`수집기 실패 — 스크립트를 점검하세요 (${e.message.split("\n")[0]})`);
  }
  const trimmed = out.slice(0, 512_000);
  if (!trimmed.includes('"syncedAt"')) die('스냅샷에 syncedAt 필드가 없습니다 (JSON 규격 위반)');
  writeFileSync(SNAPSHOT_PATH, trimmed);
  say(`OK: collected → ${SNAPSHOT_PATH} (${Buffer.byteLength(trimmed)} bytes)`);
}

async function push(argv) {
  const cfg = readConfig();
  const file = argv[0] ?? SNAPSHOT_PATH;
  let body;
  try {
    body = readFileSync(file, "utf8");
  } catch {
    die(`스냅샷 파일이 없습니다: ${file} (먼저 collect)`);
  }
  const res = await fetch(cfg.api, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json" },
    body,
  });
  const text = await res.text();
  if (res.status === 200) say(`OK: pushed → ${text}`);
  else die(`push 실패 HTTP ${res.status} → ${text}`);
}

async function run() {
  collect();
  await push([]);
}

async function doctor() {
  const cfg = readConfig();
  say(`config .. OK (api=${cfg.api})`);
  say(existsSync(COLLECTOR_PATH) ? `collector .. OK (${COLLECTOR_PATH})` : "collector .. 없음 — install을 다시 실행하세요");
  const res = await fetch(cfg.api, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (res.status === 400) say("key ...... OK (서버가 키를 인식함)");
  else if (res.status === 401) die("key ...... 유효하지 않음 — 운영자에게 재발급 요청");
  else die(`key ...... 예상 밖 응답 HTTP ${res.status}`);
  say("doctor: 모두 정상");
}

function uninstall() {
  const kept = currentCrontab()
    .split("\n")
    .filter((l) => l.trim() !== "" && !l.includes(CRON_MARK));
  if (kept.length > 0) writeCrontab(kept);
  else {
    try {
      execFileSync("crontab", ["-r"]);
    } catch {
      // 원래 비어있었음
    }
  }
  rmSync(DIR, { recursive: true, force: true });
  say("OK: uninstalled (cron + ~/.tokenholic 제거)");
}

const [, , cmd, ...rest] = process.argv;
switch (cmd ?? "help") {
  case "install":
    await install(rest);
    break;
  case "collect":
    collect();
    break;
  case "push":
    await push(rest);
    break;
  case "run":
    await run();
    break;
  case "doctor":
    await doctor();
    break;
  case "uninstall":
    uninstall();
    break;
  default:
    console.log(
      readFileSync(fileURLToPath(import.meta.url), "utf8")
        .split("\n")
        .filter((l) => l.startsWith("// "))
        .map((l) => l.slice(3))
        .slice(0, 20)
        .join("\n"),
    );
}
