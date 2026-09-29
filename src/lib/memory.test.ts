import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildMemoryDeck,
  computeMemoryScore,
  memoryDifficulty,
} from "./memory";

test("buildMemoryDeck: even grid — pairs only, no bonus", () => {
  for (let run = 0; run < 10; run++) {
    const deck = buildMemoryDeck(4);
    assert.equal(deck.length, 16);
    assert.equal(deck.filter((c) => c.isBonus).length, 0);
    const counts = new Map<number, number>();
    for (const c of deck) {
      counts.set(c.value, (counts.get(c.value) ?? 0) + 1);
    }
    assert.equal(counts.size, 8); // values 1..8
    for (const n of counts.values()) assert.equal(n, 2);
    assert.equal(new Set(deck.map((c) => c.id)).size, 16);
  }
});

test("buildMemoryDeck: odd grid — one bonus card fills the odd slot", () => {
  for (let run = 0; run < 10; run++) {
    const deck = buildMemoryDeck(3);
    assert.equal(deck.length, 9);
    const bonus = deck.filter((c) => c.isBonus);
    assert.equal(bonus.length, 1);
    const counts = new Map<number, number>();
    for (const c of deck) {
      if (c.isBonus) continue;
      counts.set(c.value, (counts.get(c.value) ?? 0) + 1);
    }
    assert.equal(counts.size, 4); // (9-1)/2 pairs
    for (const n of counts.values()) assert.equal(n, 2);
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

test("memoryDifficulty: grows with grid size and shorter limits", () => {
  const small = memoryDifficulty(3, 60);
  const big = memoryDifficulty(6, 60);
  assert.ok(big > small);
  const fast = memoryDifficulty(4, 30);
  const slow = memoryDifficulty(4, 240);
  assert.ok(fast > slow);
  assert.ok(memoryDifficulty(6, 30) <= 100);
});
