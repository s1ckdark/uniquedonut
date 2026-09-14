import { test } from "node:test";
import assert from "node:assert/strict";
import {
  yearlyAverages,
  tempToSeaColor,
  contourBands,
  FISH_STAGES,
  type DailyRow,
} from "./sea";

function row(date: string, tmax: number | null, tmin: number | null): DailyRow {
  return { date, tmax, tmin };
}

test("yearlyAverages: groups by year and averages (max+min)/2", () => {
  const rows: DailyRow[] = [
    row("2023-01-01", 20, 18), // 19
    row("2023-07-01", 28, 26), // 27 → 2023 avg = 23
    row("2024-01-01", 18, 16), // 17
    row("2024-07-01", 30, 28), // 29 → 2024 avg = 23
  ];
  const out = yearlyAverages(rows);
  assert.deepEqual(
    out.map((y) => y.year),
    [2023, 2024],
  );
  assert.ok(Math.abs(out[0].avg - 23) < 1e-9);
  assert.ok(Math.abs(out[1].avg - 23) < 1e-9);
  assert.equal(out[0].days, 2);
});

test("yearlyAverages: skips null days", () => {
  const rows: DailyRow[] = [
    row("2023-01-01", null, null),
    row("2023-01-02", 20, 18),
  ];
  const out = yearlyAverages(rows);
  assert.equal(out[0].days, 1);
  assert.ok(Math.abs(out[0].avg - 19) < 1e-9);
});

test("tempToSeaColor: clamps and warms with temperature", () => {
  assert.equal(tempToSeaColor(10), tempToSeaColor(15)); // clamped low
  assert.equal(tempToSeaColor(30), tempToSeaColor(26)); // clamped high
  const cold = tempToSeaColor(16);
  const warm = tempToSeaColor(25);
  assert.notEqual(cold, warm);
  assert.ok(warm.startsWith("rgb("));
});

test("contourBands: coast warmest, dense 0.4° steps cooling outward", () => {
  const bands = contourBands(21);
  assert.equal(bands.length, 11);
  for (let i = 1; i < bands.length; i++) {
    assert.ok(bands[i - 1] > bands[i], "bands must cool outward");
  }
  assert.ok(Math.abs(bands[0] - 23) < 1e-9); // coast = avg + 2
  assert.ok(Math.abs(bands[bands.length - 1] - 19) < 1e-9); // outermost
});

test("FISH_STAGES: four stages with complete entries", () => {
  assert.equal(FISH_STAGES.length, 4);
  for (const stage of FISH_STAGES) {
    assert.ok(stage.length >= 3);
    for (const f of stage) {
      assert.ok(f.name.length > 0);
      assert.ok(f.note.length > 5);
      assert.ok(["in", "out", "stable"].includes(f.trend));
    }
  }
});
