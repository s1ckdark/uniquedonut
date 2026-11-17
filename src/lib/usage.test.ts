import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateUsageSnapshot,
  validateParticipantName,
  validateEmail,
  validateProjectTitle,
  validateProjectText,
  validateLink,
  summarizeParticipant,
  computeLeagueMetrics,
  rankLeague,
  fmtTokens,
  fmtUsd,
  providerColor,
  calendarWeeks,
  aggregateByHour,
  aggregateByWeek,
  aggregateByMonth,
  buildDailyReport,
  type ParticipantSummary,
  type UsageSnapshot,
} from "./usage";

const BASE: UsageSnapshot = {
  syncedAt: "2026-11-12T00:00:30+09:00",
  rows: 2700,
  firstDay: "2025-06-25",
  lastDay: "2026-11-11",
  partial: false,
  pricingAsOf: "2026-11-01",
  totalTokens: 1_234_567_890,
  totalUsd: 1234.56,
  daily: [
    { day: "2025-06-25", tokens: 1000, usd: 1.5, costComplete: true },
    { day: "2025-06-26", tokens: 2000, usd: null, costComplete: false },
  ],
  providers: [{ provider: "claude", tokens: 9000, usd: 9.9 }],
  models: [
    { provider: "claude", model: "claude-opus-5-5", tokens: 5000, usd: 5 },
  ],
  heatmap: [{ dow: 1, hour: 0, tokens: 42 }],
};

test("validator: accepts a well-formed snapshot and passes it through", () => {
  const out = validateUsageSnapshot(BASE);
  assert.ok(out !== null);
  assert.equal(out.totalTokens, BASE.totalTokens);
  assert.equal(out.daily.length, 2);
});

test("validator: rejects malformed top-level fields", () => {
  const bad: unknown[] = [
    { ...BASE, syncedAt: "not-a-date" },
    { ...BASE, firstDay: "2025-6-25" },
    { ...BASE, lastDay: "" },
    { ...BASE, totalTokens: -1 },
    { ...BASE, totalTokens: Number.NaN },
    { ...BASE, totalUsd: "12" },
    { ...BASE, partial: "no" },
    "nope",
    null,
  ];
  for (const candidate of bad) {
    assert.equal(
      validateUsageSnapshot(candidate),
      null,
      `should reject: ${JSON.stringify(candidate).slice(0, 60)}`,
    );
  }
});

test("validator: rejects bad daily/provider/model/heatmap rows", () => {
  const cases: unknown[] = [
    { ...BASE, daily: [{ day: "2025-13-01", tokens: 1 }] },
    { ...BASE, daily: [{ day: "2025-06-25", tokens: -5 }] },
    { ...BASE, daily: [{ day: "2025-06-25", tokens: 1, usd: -1 }] },
    { ...BASE, providers: [{ provider: "", tokens: 1 }] },
    { ...BASE, providers: [{ provider: "claude", tokens: 1, usd: "x" }] },
    { ...BASE, models: [{ provider: "x", model: "", tokens: 1 }] },
    { ...BASE, heatmap: [{ dow: 0, hour: 0, tokens: 1 }] },
    { ...BASE, heatmap: [{ dow: 8, hour: 0, tokens: 1 }] },
    { ...BASE, heatmap: [{ dow: 1, hour: 24, tokens: 1 }] },
    { ...BASE, heatmap: [{ dow: 1, hour: -1, tokens: 1 }] },
    { ...BASE, heatmap: [{ dow: 1, hour: 0, tokens: -1 }] },
  ];
  for (const candidate of cases) {
    assert.equal(validateUsageSnapshot(candidate), null);
  }
});

test("validator: caps array sizes", () => {
  const many = Array.from({ length: 801 }, (_, i) => ({
    day: `2025-06-25`,
    tokens: i,
  }));
  // fix days so rows stay valid, only the length triggers the cap
  for (let i = 0; i < many.length; i++) many[i].day = "2025-06-25";
  assert.equal(validateUsageSnapshot({ ...BASE, daily: many }), null);
  assert.notEqual(
    validateUsageSnapshot({ ...BASE, providers: Array.from({ length: 20 }, () => BASE.providers[0]) }),
    null,
  );
  assert.equal(
    validateUsageSnapshot({ ...BASE, providers: Array.from({ length: 21 }, () => BASE.providers[0]) }),
    null,
  );
  assert.equal(
    validateUsageSnapshot({
      ...BASE,
      heatmap: Array.from({ length: 169 }, (_, i) => ({
        dow: (i % 7) + 1,
        hour: i % 24,
        tokens: 1,
      })),
    }),
    null,
  );
});

test("formatters: Korean token units and USD", () => {
  assert.equal(fmtTokens(999), "999");
  assert.equal(fmtTokens(12_345), "1.2만");
  assert.equal(fmtTokens(123_456_789), "1.2억");
  assert.equal(fmtUsd(0), "$0.00");
  assert.equal(fmtUsd(1234.5), "$1,234.50");
  assert.equal(fmtUsd(null), "—");
});

test("provider colors: known providers and fallback", () => {
  for (const p of ["claude", "codex", "zai", "antigravity", "grok"]) {
    assert.ok(providerColor(p).startsWith("#"));
  }
  assert.equal(providerColor("unknown-prov"), "#9AA0A6");
});

test("calendarWeeks: lays daily rows out in Mon-first weeks with leading/trailing nulls", () => {
  // 2025-06-25 is a Wednesday (dow=3). Week starts Monday.
  const daily = [
    { day: "2025-06-25", tokens: 10, usd: null, costComplete: true },
    { day: "2025-06-26", tokens: 20, usd: null, costComplete: true },
  ];
  const weeks = calendarWeeks(daily);
  assert.equal(weeks.length, 1);
  assert.equal(weeks[0].length, 7);
  assert.equal(weeks[0][0], null); // Mon
  assert.equal(weeks[0][1], null); // Tue
  assert.equal(weeks[0][2]?.tokens, 10); // Wed = 25th
  assert.equal(weeks[0][3]?.tokens, 20); // Thu = 26th
  assert.equal(weeks[0][4], null); // Fri
});

test("aggregateByHour: sums heatmap into 24 slots", () => {
  const heatmap = [
    { dow: 1, hour: 9, tokens: 100 },
    { dow: 2, hour: 9, tokens: 50 },
    { dow: 1, hour: 23, tokens: 7 },
  ];
  const hours = aggregateByHour(heatmap);
  assert.equal(hours.length, 24);
  assert.equal(hours[9].tokens, 150);
  assert.equal(hours[23].tokens, 7);
  assert.equal(hours[0].tokens, 0);
});

test("aggregateByWeek: groups days into Mon-anchored weeks, sums tokens/usd", () => {
  const daily = [
    { day: "2025-06-25", tokens: 10, usd: 1, costComplete: true }, // Wed
    { day: "2025-06-26", tokens: 20, usd: 2, costComplete: true }, // Thu
    { day: "2025-06-30", tokens: 5, usd: 0.5, costComplete: true }, // next Mon
    { day: "2025-06-24", tokens: 1, usd: null, costComplete: true }, // earlier Tue, same week as 25th
  ];
  const weeks = aggregateByWeek(daily);
  assert.equal(weeks.length, 2);
  assert.equal(weeks[0].weekStart, "2025-06-23"); // Monday of that week
  assert.equal(weeks[0].tokens, 31);
  assert.equal(weeks[0].usd, 3);
  assert.equal(weeks[1].weekStart, "2025-06-30");
  assert.equal(weeks[1].tokens, 5);
});

test("aggregateByMonth: groups days into YYYY-MM buckets", () => {
  const daily = [
    { day: "2025-06-30", tokens: 10, usd: 1, costComplete: true },
    { day: "2025-06-25", tokens: 15, usd: null, costComplete: true },
    { day: "2025-07-01", tokens: 5, usd: 0.5, costComplete: true },
  ];
  const months = aggregateByMonth(daily);
  assert.equal(months.length, 2);
  assert.equal(months[0].month, "2025-06");
  assert.equal(months[0].tokens, 25);
  assert.equal(months[1].month, "2025-07");
  assert.equal(months[1].tokens, 5);
});

test("buildDailyReport: last day stats with delta vs prior 7-day average", () => {
  const mk = (day: string, tokens: number) => ({
    day,
    tokens,
    usd: tokens * 0.01,
    costComplete: true,
  });
  const daily = [
    mk("2026-11-04", 100),
    mk("2026-11-05", 100),
    mk("2026-11-06", 100),
    mk("2026-11-07", 100),
    mk("2026-11-08", 100),
    mk("2026-11-09", 100),
    mk("2026-11-10", 100), // prior 7 avg = 100
    mk("2026-11-11", 150), // last day
  ];
  const report = buildDailyReport({ ...BASE, daily });
  assert.ok(report);
  assert.equal(report.day, "2026-11-11");
  assert.equal(report.tokens, 150);
  assert.equal(report.usd, 1.5);
  assert.equal(report.prev7Avg, 100);
  assert.ok(report.deltaPct !== null && Math.abs(report.deltaPct - 50) < 1e-9);
  assert.equal(report.topModel?.model, "claude-opus-5-5"); // 최근 30일 기준 명시
});

test("buildDailyReport: null when daily is empty or too short", () => {
  assert.equal(buildDailyReport({ ...BASE, daily: [] }), null);
  const single = [{ day: "2026-11-11", tokens: 1, usd: 1, costComplete: true }];
  const r = buildDailyReport({ ...BASE, daily: single });
  assert.ok(r);
  assert.equal(r.prev7Avg, null);
  assert.equal(r.deltaPct, null);
});

test("buildDailyReport: skips the just-started sync day (midnight load)", () => {
  // 자정 00:00 적재: syncedAt 날짜(11/13)는 0토큰 — 리포트는 전날(11/12)을 봐야 한다
  const mk = (day: string, tokens: number) => ({
    day,
    tokens,
    usd: tokens * 0.01,
    costComplete: true,
  });
  const daily = [
    mk("2026-11-05", 100),
    mk("2026-11-06", 100),
    mk("2026-11-07", 100),
    mk("2026-11-08", 100),
    mk("2026-11-09", 100),
    mk("2026-11-10", 100),
    mk("2026-11-11", 100),
    mk("2026-11-12", 120), // 마지막 완결일
    mk("2026-11-13", 0), // 방금 시작된 오늘
  ];
  const r = buildDailyReport({
    ...BASE,
    syncedAt: "2026-11-13T00:00:45+09:00",
    daily,
  });
  assert.ok(r);
  assert.equal(r.day, "2026-11-12");
  assert.equal(r.tokens, 120);
  assert.ok(r.prev7Avg !== null && Math.abs(r.prev7Avg - 100) < 1e-9);
});

// ---------- league (multi-participant) ----------

const mkDay = (day: string, tokens: number, usd = tokens * 0.01) => ({
  day,
  tokens,
  usd,
  costComplete: true,
});

test("validateEmail: accepts sane addresses, rejects garbage", () => {
  for (const good of [
    "lyh@example.com",
    "gil.dong+tag@sub.example.co.kr",
    "a@b.io",
    "x_y-z@test.dev",
  ]) {
    assert.ok(validateEmail(good) !== null, good);
  }
  for (const bad of [
    "",
    "no-at-sign",
    "@nodomain.com",
    "no-local@",
    "space in@local.com",
    "user@domain",
    "user@.com",
    "a".repeat(65) + "@example.com", // 로컬 64자 초과
    "a@" + "b".repeat(250) + ".com", // 전체 254자 초과
    null,
    7,
  ]) {
    assert.equal(validateEmail(bad), null);
  }
  assert.equal(validateEmail("  Trim@Example.COM "), "trim@example.com");
});

test("validateProjectTitle: 1-40 chars, no control chars", () => {
  assert.equal(validateProjectTitle("TOKENHOLIC 대시보드 🔥"), "TOKENHOLIC 대시보드 🔥");
  assert.equal(validateProjectTitle("  여러   공백  "), "여러 공백");
  for (const bad of ["", "   ", "x".repeat(41), null, 7]) {
    assert.equal(validateProjectTitle(bad), null);
  }
  // 탭은 공백으로 정규화되어 통과 (의도된 동작)
  assert.equal(validateProjectTitle("탭\t포함"), "탭 포함");
});

test("validateProjectText: 0-200 chars for descriptions", () => {
  assert.equal(validateProjectText(null, 200), null);
  assert.equal(validateProjectText(undefined, 200), null);
  assert.equal(validateProjectText("  ", 200), null);
  assert.equal(validateProjectText("GPT로 만든 장기 인공지능", 200), "GPT로 만든 장기 인공지능");
  assert.equal(validateProjectText("x".repeat(201), 200), null);
  assert.equal(validateProjectText("줄바꿈\n포함", 200), null); // 제어문자
});

test("validateLink: http(s) URL with host, stored not fetched", () => {
  assert.equal(validateLink("https://uniquedonut.com/usage"), "https://uniquedonut.com/usage");
  assert.equal(validateLink("http://localhost:3000"), "http://localhost:3000");
  assert.equal(validateLink(null), null);
  assert.equal(validateLink(""), null);
  assert.equal(validateLink("ftp://example.com"), null);
  assert.equal(validateLink("그냥 텍스트"), null);
  assert.equal(validateLink("https://"), null);
  assert.equal(validateLink("x".repeat(301)), null);
});

test("validateParticipantName: 1-16 chars, hangul/latin/digit/space/-/_", () => {
  for (const good of ["dave", "지노아빠", "gil-dong 1", "AI_유저", "a"]) {
    assert.ok(validateParticipantName(good) !== null, good);
  }
  for (const bad of ["", "   ", "자".repeat(17), "x".repeat(17), "bad!name", "탈\\출", null, 7]) {
    assert.equal(validateParticipantName(bad), null);
  }
  // trim + collapse inner spaces
  assert.equal(validateParticipantName("  gil  dong "), "gil dong");
});

test("summarizeParticipant: 30d window anchored at lastDay, 7d delta", () => {
  // lastDay = 11-12 (완결일 기준과 무관하게 스냅샷 daily의 최대일 기준)
  const daily = [
    mkDay("2026-09-01", 1000), // 30일 밖 (9/13 이전) — 제외 대상
    mkDay("2026-10-15", 100), // 30일 창 안
    mkDay("2026-11-06", 200),
    mkDay("2026-11-07", 300),
    mkDay("2026-11-08", 400),
    mkDay("2026-11-09", 500),
    mkDay("2026-11-10", 600),
    mkDay("2026-11-11", 700),
    mkDay("2026-11-12", 800),
    mkDay("2026-11-13", 0), // 오늘 — 창 계산에는 포함되나 0
  ];
  const s = summarizeParticipant("dave", { ...BASE, daily });
  assert.equal(s.name, "dave");
  assert.equal(s.lastDay, "2026-11-13");
  // 30일 창: 10-15 ~ 11-13 (lastDay-30 = 10/14 기준 10/15부터)
  assert.ok(s.tokens30d > 0);
  const expected30 = 100 + 200 + 300 + 400 + 500 + 600 + 700 + 800;
  assert.equal(s.tokens30d, expected30);
  assert.ok(Math.abs(s.usd30d - expected30 * 0.01) < 1e-6);
  // 최근 7일(11/07~11/13: 300+400+500+600+700+800+0=3300) vs 직전 7일(10/29~11/05 구간 중 존재하는 200)
  assert.ok(s.delta7dPct !== null);
  assert.equal(s.tokens7d, 3300);
});

const SUM_BASE: ParticipantSummary = {
  name: "x", lastSync: "", lastDay: "", totalTokens: 0, totalUsd: 0,
  tokens30d: 0, usd30d: 0, tokens7d: 0, usd7d: 0,
  lastCompleteDay: "", dayTokens: 0, dayUsd: null, delta7dPct: null,
};

test("computeLeagueMetrics: common anchor day + fixed week window + months", () => {
  const mkDay = (day: string, tokens: number, usd = tokens * 0.01) => ({
    day, tokens, usd, costComplete: true,
  });
  // dave: 마지막 완결일 11-16 / 지예: 마지막 완결일 11-13 → 앵커는 11-16
  const daveSnap: UsageSnapshot = {
    ...BASE,
    syncedAt: "2026-11-17T00:00:40+09:00",
    daily: [mkDay("2026-11-10", 100), mkDay("2026-11-15", 200), mkDay("2026-11-16", 300), mkDay("2026-11-17", 0)],
  };
  const jySnap: UsageSnapshot = {
    ...BASE,
    syncedAt: "2026-11-14T00:00:40+09:00",
    daily: [mkDay("2026-10-31", 500), mkDay("2026-11-12", 10), mkDay("2026-11-13", 20), mkDay("2026-11-14", 0)],
  };
  const { anchorDay, metrics } = computeLeagueMetrics([
    { name: "dave", snapshot: daveSnap },
    { name: "지예", snapshot: jySnap },
  ]);
  assert.equal(anchorDay, "2026-11-16");
  const dave = metrics.get("dave")!;
  const jy = metrics.get("지예")!;
  // 같은 날 비교: dave 300/지예 0 (지예는 11-16 데이터 없음)
  assert.equal(dave.day.date, "2026-11-16");
  assert.equal(dave.day.tokens, 300);
  assert.equal(jy.day.tokens, 0);
  assert.equal(jy.day.usd, null);
  // 고정 7일 창 11-10~11-16 (같은 기간)
  assert.equal(dave.week.from, "2026-11-10");
  assert.equal(dave.week.to, "2026-11-16");
  assert.equal(dave.week.tokens, 600);
  assert.equal(jy.week.from, "2026-11-10"); // 지예도 같은 창
  assert.equal(jy.week.tokens, 30); // 11-12+11-13만 창 안
  // 월별 집계
  assert.deepEqual(
    jy.months.map((m) => m.month),
    ["2026-10", "2026-11"],
  );
  assert.equal(jy.months[1].tokens, 30);
});

test("computeLeagueMetrics: dayOverride moves the day axis to the requested date", () => {
  const mkDay = (day: string, tokens: number, usd = tokens * 0.01) => ({
    day, tokens, usd, costComplete: true,
  });
  const snap: UsageSnapshot = {
    ...BASE,
    syncedAt: "2026-11-17T00:00:40+09:00",
    daily: [mkDay("2026-11-10", 100), mkDay("2026-11-15", 200), mkDay("2026-11-16", 300), mkDay("2026-11-17", 0)],
  };
  const { anchorDay, metrics } = computeLeagueMetrics(
    [{ name: "dave", snapshot: snap }],
    "2026-11-10",
  );
  assert.equal(anchorDay, "2026-11-16"); // 앵커(최신)는 그대로
  const m = metrics.get("dave")!;
  assert.equal(m.day.date, "2026-11-10"); // 일간 축만 이동
  assert.equal(m.day.tokens, 100);
  assert.equal(m.week.to, "2026-11-16"); // 주간은 앵커 유지
});

test("rankLeague: same-day/same-window/same-month comparison", () => {
  const entry = (name: string, over: object) => ({
    ...SUM_BASE,
    name,
    day: { date: "2026-11-16", tokens: 0, usd: null },
    week: { from: "2026-11-10", to: "2026-11-16", tokens: 0, usd: 0 },
    months: [],
    ...over,
  });
  const entries = [
    entry("day-king", { day: { date: "x", tokens: 1, usd: 30 } }),
    entry("week-king", { week: { from: "x", to: "x", tokens: 1, usd: 50 } }),
    entry("month-king", { months: [{ month: "2026-10", tokens: 1, usd: 90 }, { month: "2026-11", tokens: 1, usd: 1 }] }),
  ];
  assert.deepEqual(rankLeague(entries, "day", "2026-11").map((r) => r.name), ["day-king", "week-king", "month-king"]);
  assert.deepEqual(rankLeague(entries, "week", "2026-11").map((r) => r.name), ["week-king", "day-king", "month-king"]);
  // 월 셀렉터: 10월을 고르면 month-king, 11월이면 usd 1 vs 0/0
  assert.deepEqual(rankLeague(entries, "month", "2026-10").map((r) => r.name)[0], "month-king");
  assert.deepEqual(rankLeague(entries, "month", "2026-11").map((r) => r.name)[0], "month-king");
  // 데이터 없는 달 → 전부 0, 동점은 tokens로
  assert.equal(rankLeague(entries, "month", "2025-01").length, 3);
});

test("summarizeParticipant: usd7d and last-complete-day axes", () => {
  const mk = (day: string, tokens: number, usd = tokens * 0.01) => ({
    day, tokens, usd, costComplete: true,
  });
  // syncedAt 11-13 자정 → 11-13은 0토큰 "오늘", 마지막 완결일은 11-12
  const daily = [
    mk("2026-11-05", 100),
    mk("2026-11-10", 200),
    mk("2026-11-11", 300),
    mk("2026-11-12", 400),
    mk("2026-11-13", 0),
  ];
  const s = summarizeParticipant("dave", {
    ...BASE,
    syncedAt: "2026-11-13T00:00:45+09:00",
    daily,
  });
  assert.equal(s.lastCompleteDay, "2026-11-12");
  assert.equal(s.dayTokens, 400);
  assert.equal(s.dayUsd, 4);
  // 최근 7일(11-07~11-13): 200+300+400+0 = 900 tk, usd 9
  assert.equal(s.tokens7d, 900);
  assert.ok(Math.abs(s.usd7d - 9) < 1e-9);
});
