import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeEntry,
  sortEntries,
  formatTime,
  type LeaderboardEntry,
} from "./leaderboard";

function entry(over: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return { name: "지노", score: 40, totalSeconds: 12.3, date: "2026-09-28", ...over };
}

test("sanitizeEntry: accepts a trimmed valid entry", () => {
  const out = sanitizeEntry(entry({ name: "  지노  " }));
  assert.ok(out);
  assert.equal(out.name, "지노");
});

test("sanitizeEntry: rejects bad names, scores, and times", () => {
  assert.equal(sanitizeEntry(entry({ name: "" })), null);
  assert.equal(sanitizeEntry(entry({ name: "아".repeat(13) })), null);
  assert.equal(sanitizeEntry(entry({ score: 51 })), null);
  assert.equal(sanitizeEntry(entry({ score: -1 })), null);
  assert.equal(sanitizeEntry(entry({ totalSeconds: -2 })), null);
  assert.equal(sanitizeEntry(entry({ totalSeconds: 4000 })), null);
  assert.equal(sanitizeEntry("not-an-object"), null);
});

test("sortEntries: score desc, then faster time wins ties", () => {
  const sorted = sortEntries([
    entry({ name: "A", score: 30, totalSeconds: 10 }),
    entry({ name: "B", score: 50, totalSeconds: 20 }),
    entry({ name: "C", score: 50, totalSeconds: 12 }),
    entry({ name: "D", score: 45, totalSeconds: 30 }),
  ]);
  assert.deepEqual(
    sorted.map((e) => e.name),
    ["C", "B", "D", "A"],
  );
});

test("formatTime: one decimal with the unit", () => {
  assert.equal(formatTime(12.34), "12.3초");
  assert.equal(formatTime(8), "8.0초");
});
