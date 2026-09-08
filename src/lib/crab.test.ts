import { test } from "node:test";
import assert from "node:assert/strict";
import { crabStages } from "./crab";

test("crabStages: five stages in canonical order", () => {
  assert.deepEqual(
    crabStages.map((s) => s.id),
    ["egg", "zoea", "megalopa", "juvenile", "adult"],
  );
});

test("crabStages: only the adult has swimming paddles", () => {
  for (const s of crabStages) {
    assert.equal(s.paddles, s.id === "adult");
  }
});

test("crabStages: scale strictly increases after the egg stage", () => {
  const scales = crabStages
    .filter((s) => s.id !== "egg")
    .map((s) => s.scale);
  for (let i = 1; i < scales.length; i++) {
    assert.ok(scales[i] > scales[i - 1], "scale must strictly increase");
  }
});

test("crabStages: every stage carries name, description, fun fact", () => {
  for (const s of crabStages) {
    assert.ok(s.name.length > 0);
    assert.ok(s.description.length > 10);
    assert.ok(s.funFact.length > 10);
  }
});
