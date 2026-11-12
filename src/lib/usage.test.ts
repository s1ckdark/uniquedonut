import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateUsageSnapshot,
  fmtTokens,
  fmtUsd,
  providerColor,
  calendarWeeks,
  aggregateByHour,
  aggregateByWeek,
  aggregateByMonth,
  buildDailyReport,
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
