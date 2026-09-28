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
  assert.equal(sanitizeEntry(entry({ score: 101 })), null);
  assert.equal(sanitizeEntry(entry({ score: -1 })), null);
  assert.equal(sanitizeEntry(entry({ totalSeconds: -2 })), null);
  assert.equal(sanitizeEntry(entry({ totalSeconds: 4000 })), null);
  assert.equal(sanitizeEntry("not-an-object"), null);
});

test("sanitizeEntry: difficulty optional but validated when present", () => {
  const withDiff = sanitizeEntry(entry({ difficulty: 31 }));
  assert.ok(withDiff);
  assert.equal(withDiff.difficulty, 31);

  // legacy entries without difficulty survive (field stays undefined)
  const raw = { name: "옛날기록", score: 20, totalSeconds: 30, date: "2026-09-01" };
  const legacy = sanitizeEntry(raw);
  assert.ok(legacy);
  assert.equal(legacy.difficulty, undefined);

  assert.equal(sanitizeEntry(entry({ difficulty: 101 })), null);
  assert.equal(sanitizeEntry(entry({ difficulty: -5 })), null);
});

test("sanitizeEntry: op validated to the four operations", () => {
  const withOp = sanitizeEntry(entry({ op: "add" }));
  assert.ok(withOp);
  assert.equal(withOp.op, "add");

  assert.equal(sanitizeEntry(entry({ op: "multiply" })), null);

  const legacy = sanitizeEntry(entry({}));
  assert.ok(legacy);
  assert.equal(legacy.op, undefined);
});

test("sanitizeEntry: topic must be a slug-shaped string", () => {
  const withTopic = sanitizeEntry(entry({ topic: "sleep-grow" }));
  assert.ok(withTopic);
  assert.equal(withTopic.topic, "sleep-grow");

  assert.equal(sanitizeEntry(entry({ topic: "잘못된 값" })), null);
  assert.equal(sanitizeEntry(entry({ topic: "x".repeat(31) })), null);

  const legacy = sanitizeEntry(entry({}));
  assert.ok(legacy);
  assert.equal(legacy.topic, undefined);
});

test("sanitizeEntry: passes a valid DB row id through, rejects bad ones", () => {
  const withId = sanitizeEntry(entry({ id: 42 }));
  assert.ok(withId);
  assert.equal(withId.id, 42);

  assert.equal(sanitizeEntry({ ...entry(), id: "42" }), null);

  const noId = sanitizeEntry(entry({}));
  assert.ok(noId);
  assert.equal(noId.id, undefined);
});

test("sanitizeEntry: school is optional, trimmed, capped at 16 chars", () => {
  const withSchool = sanitizeEntry(entry({ school: "  위니초  " }));
  assert.ok(withSchool);
  assert.equal(withSchool.school, "위니초");

  assert.equal(sanitizeEntry(entry({ school: "학".repeat(17) })), null);

  const noSchool = sanitizeEntry(entry({ school: "   " }));
  assert.ok(noSchool);
  assert.equal(noSchool.school, undefined);
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
