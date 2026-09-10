import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sleepDurationHours,
  ghLevelFromOnset,
  ghAt,
  sleepVerdict,
  formatBedtime,
} from "./growth";

test("sleepDurationHours: bed 21→10h, 22.5→8.5h, 25(=01:00)→6h", () => {
  assert.equal(sleepDurationHours(21), 10);
  assert.equal(sleepDurationHours(22.5), 8.5);
  assert.equal(sleepDurationHours(25), 6);
});

test("ghLevelFromOnset: awake baseline, peak wave in first hours, decay", () => {
  assert.equal(ghLevelFromOnset(-1), 0.08); // before sleep
  assert.equal(ghLevelFromOnset(1), 1.0); // peak start
  assert.ok(ghLevelFromOnset(1.5) > 0.9); // still high
  assert.ok(ghLevelFromOnset(2) > ghLevelFromOnset(5)); // wave decays
  assert.equal(ghLevelFromOnset(7), 0.15); // later sleep
});

test("ghAt: high while deep asleep, low at noon", () => {
  // bed 22:00 → deep sleep around 23:00 (t=1)
  assert.equal(ghAt(23, 22), 1.0);
  // noon is long after waking (duration 9h) → awake baseline
  assert.equal(ghAt(12, 22), 0.08);
});

test("sleepVerdict: maps hours to kid-friendly labels", () => {
  assert.equal(sleepVerdict(10).label, "딱 좋아요");
  assert.equal(sleepVerdict(8.5).label, "조금 부족");
  assert.equal(sleepVerdict(7).label, "부족");
  assert.equal(sleepVerdict(11.5).label, "넉넉");
});

test("formatBedtime: kid clock words", () => {
  assert.equal(formatBedtime(21), "밤 9:00");
  assert.equal(formatBedtime(22.5), "밤 10:30");
  assert.equal(formatBedtime(24), "자정 12:00");
  assert.equal(formatBedtime(25), "새벽 1:00");
});
