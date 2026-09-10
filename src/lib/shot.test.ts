import { test } from "node:test";
import assert from "node:assert/strict";
import { shotScenes } from "./shot";

test("shotScenes: eight scenes in canonical order", () => {
  assert.deepEqual(
    shotScenes.map((s) => s.id),
    [
      "hospital",
      "injection",
      "antibiotic",
      "question",
      "training",
      "memory",
      "victory",
      "tips",
    ],
  );
});

test("shotScenes: unique ids with complete text", () => {
  const ids = new Set(shotScenes.map((s) => s.id));
  assert.equal(ids.size, shotScenes.length);
  for (const s of shotScenes) {
    assert.ok(s.title.length > 0);
    assert.ok(s.text.length > 20);
    assert.ok(s.fact.length > 10);
  }
});

test("shotScenes: the injection scene says shots don't kill viruses", () => {
  const scene = shotScenes.find((s) => s.id === "injection");
  assert.ok(scene?.text.includes("직접 죽이지"));
});

test("shotScenes: the vaccine scene describes the drill", () => {
  const scene = shotScenes.find((s) => s.id === "training");
  assert.ok(scene?.text.includes("훈련"));
});
