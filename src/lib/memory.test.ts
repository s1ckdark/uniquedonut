import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildMemoryDeck,
  computeMemoryScore,
  memoryDifficulty,
} from "./memory";

test("buildMemoryDeck: even total — pairs only, no bonus (4×4, 5×4)", () => {
  for (let run = 0; run < 10; run++) {
    for (const [rows, cols] of [
      [4, 4],
      [5, 4],
      [2, 3],
    ]) {
      const deck = buildMemoryDeck(rows, cols);
      assert.equal(deck.length, rows * cols);
      assert.equal(deck.filter((c) => c.isBonus).length, 0);
      const counts = new Map<number, number>();
      for (const c of deck) {
        counts.set(c.value, (counts.get(c.value) ?? 0) + 1);
      }
      assert.equal(counts.size, (rows * cols) / 2);
      for (const n of counts.values()) assert.equal(n, 2);
      assert.equal(new Set(deck.map((c) => c.id)).size, rows * cols);
    }
  }
});

test("buildMemoryDeck: odd total — one bonus card fills the odd slot (3×3, 5×5, 3×5)", () => {
  for (let run = 0; run < 10; run++) {
    for (const [rows, cols] of [
      [3, 3],
      [5, 5],
      [3, 5],
    ]) {
      const deck = buildMemoryDeck(rows, cols);
      assert.equal(deck.length, rows * cols);
      assert.equal(deck.filter((c) => c.isBonus).length, 1);
      const counts = new Map<number, number>();
      for (const c of deck) {
        if (c.isBonus) continue;
        counts.set(c.value, (counts.get(c.value) ?? 0) + 1);
      }
      assert.equal(counts.size, (rows * cols - 1) / 2);
      for (const n of counts.values()) assert.equal(n, 2);
    }
  }
});

test("computeMemoryScore: complete scales with remaining time", () => {
  assert.equal(
    computeMemoryScore({ found: 8, total: 8, timeLeftMs: 60000, limitMs: 60000, completed: true }),
    100,
  );
  assert.equal(
    computeMemoryScore({ found: 8, total: 8, timeLeftMs: 30000, limitMs: 60000, completed: true }),
    75,
  );
  assert.equal(
    computeMemoryScore({ found: 4, total: 4, timeLeftMs: 0, limitMs: 60000, completed: true }),
    50,
  );
});

test("computeMemoryScore: timeout scales with pairs found (max < 50)", () => {
  assert.equal(
    computeMemoryScore({ found: 4, total: 8, timeLeftMs: 0, limitMs: 60000, completed: false }),
    25,
  );
  assert.equal(
    computeMemoryScore({ found: 0, total: 8, timeLeftMs: 0, limitMs: 60000, completed: false }),
    0,
  );
});

test("memoryDifficulty: grows with grid area and shorter limits", () => {
  const small = memoryDifficulty(2, 2, 60);
  const big = memoryDifficulty(5, 4, 60);
  assert.ok(big > small);
  const fast = memoryDifficulty(4, 4, 30);
  const slow = memoryDifficulty(4, 4, 240);
  assert.ok(fast > slow);
  assert.ok(memoryDifficulty(6, 6, 30) <= 100);
});
