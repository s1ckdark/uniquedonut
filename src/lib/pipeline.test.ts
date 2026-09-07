import { test } from "node:test";
import assert from "node:assert/strict";
import { stages } from "./pipeline";

test("stages: exactly five, in canonical order", () => {
  assert.deepEqual(
    stages.map((s) => s.id),
    ["source", "ingest", "transform", "store", "serve"],
  );
});

test("stages: unique names, non-empty shorts and colors", () => {
  const names = new Set(stages.map((s) => s.name));
  assert.equal(names.size, stages.length);
  for (const s of stages) {
    assert.ok(s.short.length > 0);
    assert.ok(/^#[0-9a-f]{6}$/i.test(s.color));
  }
});

test("stages: every stage carries complete detail content", () => {
  for (const s of stages) {
    assert.ok(s.detail.role.length > 10);
    assert.ok(s.detail.donutStory.length > 10);
    assert.ok(s.detail.examples.length >= 2);
  }
});
