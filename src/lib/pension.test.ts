import { test } from "node:test";
import assert from "node:assert/strict";
import {
  HERO,
  EXCESS_BY_BRACKET,
  OVER_100M_BY_BRACKET,
  LOW_TIER_RECEIVED_TIERS,
  LOW_TIER_TOTAL,
  MIN_EXCESS_TOTAL,
  TIMELINE,
  excessRates,
  heroMultiple,
  maxBracketPopulation,
} from "./pension";

test("hero: 833만 납부 → 1억1190만 수급, 10배 이상", () => {
  assert.equal(HERO.paidAvg, 8_330_000);
  assert.equal(HERO.receivedAvg, 111_900_000);
  assert.equal(HERO.months, 260);
  assert.equal(HERO.beneficiaries, 19_972);
  assert.ok(heroMultiple() > 10, "기사 본문: 평생 낸 보험료보다 10배 이상");
  assert.ok(Math.abs(heroMultiple() - 111_900_000 / 8_330_000) < 0.01);
});

test("excess by bracket: 6 direct brackets with population and excess counts", () => {
  assert.equal(EXCESS_BY_BRACKET.length, 6);
  for (const row of EXCESS_BY_BRACKET) {
    assert.ok(row.total > 0);
    assert.ok(row.excess > 0);
    assert.ok(row.excess <= row.total, `${row.label}: excess ≤ total`);
    assert.ok(row.label.length > 0);
  }
  const m10 = EXCESS_BY_BRACKET.find((r) => r.label === "1000만~2000만");
  assert.equal(m10?.total, 2_059_542);
  assert.equal(m10?.excess, 1_294_563);
});

test("excess rates: within 0..1 and sorted descending", () => {
  const rates = excessRates();
  assert.equal(rates.length, EXCESS_BY_BRACKET.length);
  for (const r of rates) {
    assert.ok(r.rate > 0 && r.rate < 1);
  }
  // 기사 순서(납부액 오름차순)로 정렬되어 있되 값은 내림차순이 아니어도 됨 —
  // 단 최소 비율·최대 비율이 범위 안에 있는지만 검증
  const values = rates.map((r) => r.rate);
  assert.ok(Math.max(...values) < 1);
  assert.ok(Math.min(...values) > 0.2);
});

test("over 100M recipients: 11 brackets, sorted desc, matches article", () => {
  assert.equal(OVER_100M_BY_BRACKET.length, 11);
  for (let i = 1; i < OVER_100M_BY_BRACKET.length; i++) {
    assert.ok(
      OVER_100M_BY_BRACKET[i - 1].count >= OVER_100M_BY_BRACKET[i].count,
      "sorted descending",
    );
  }
  assert.equal(OVER_100M_BY_BRACKET[0].label, "1000만~2000만");
  assert.equal(OVER_100M_BY_BRACKET[0].count, 116_226);
  assert.equal(
    OVER_100M_BY_BRACKET.find((r) => r.label === "1000만 이하")?.count,
    19_972,
  );
  assert.equal(
    OVER_100M_BY_BRACKET.find((r) => r.label === "1억 초과")?.count,
    3_518,
  );
});

test("low tier received tiers: 5 thresholds with counts", () => {
  assert.equal(LOW_TIER_RECEIVED_TIERS.length, 5);
  for (const t of LOW_TIER_RECEIVED_TIERS) {
    assert.ok(t.count > 0);
    assert.ok(t.count <= LOW_TIER_TOTAL);
  }
  const sum = LOW_TIER_RECEIVED_TIERS.reduce((a, t) => a + t.count, 0);
  assert.ok(sum <= LOW_TIER_TOTAL, "tiers are disjoint slices of the bracket");
  assert.equal(LOW_TIER_TOTAL, 758_893);
});

test("min excess total + timeline integrity", () => {
  assert.equal(MIN_EXCESS_TOTAL, 3_260_147);
  assert.equal(TIMELINE.length, 5);
  const years = TIMELINE.map((t) => t.year);
  assert.deepEqual(years, [...years].sort((a, b) => a - b));
  for (const t of TIMELINE) {
    assert.ok(t.title.length > 0);
    assert.ok(t.detail.length > 0);
  }
  assert.ok(TIMELINE.some((t) => t.year === 1988));
  assert.ok(TIMELINE.some((t) => t.year === 2069));
});

test("maxBracketPopulation: largest population for bar scaling", () => {
  assert.equal(maxBracketPopulation(), Math.max(...EXCESS_BY_BRACKET.map((r) => r.total)));
});
