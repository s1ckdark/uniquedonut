import { test } from "node:test";
import assert from "node:assert/strict";
import { idiomScenes } from "./idiom";

test("idiomScenes: five scenes in canonical order", () => {
  assert.deepEqual(
    idiomScenes.map((s) => s.id),
    ["meaning", "steppe", "warning", "today", "science"],
  );
});

test("idiomScenes: unique ids with complete text", () => {
  const ids = new Set(idiomScenes.map((s) => s.id));
  assert.equal(ids.size, idiomScenes.length);
  for (const s of idiomScenes) {
    assert.ok(s.title.length > 0);
    assert.ok(s.text.length > 20);
    assert.ok(s.fact.length > 10);
  }
});

test("idiomScenes: the meaning scene shows the hanja", () => {
  const scene = idiomScenes.find((s) => s.id === "meaning");
  assert.ok(scene?.text.includes("天高馬肥"));
});

test("idiomScenes: the science scene explains dry autumn air", () => {
  const scene = idiomScenes.find((s) => s.id === "science");
  assert.ok(scene?.text.includes("건조"));
});
