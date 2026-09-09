import { test } from "node:test";
import assert from "node:assert/strict";
import { coldScenes } from "./cold";

test("coldScenes: seven scenes in canonical order", () => {
  assert.deepEqual(
    coldScenes.map((s) => s.id),
    ["invade", "alarm", "battle", "redcell", "fever", "antibody", "victory"],
  );
});

test("coldScenes: unique ids with complete text", () => {
  const ids = new Set(coldScenes.map((s) => s.id));
  assert.equal(ids.size, coldScenes.length);
  for (const s of coldScenes) {
    assert.ok(s.title.length > 0);
    assert.ok(s.text.length > 20);
    assert.ok(s.fact.length > 10);
  }
});

test("coldScenes: the red-cell twist scene exists", () => {
  const twist = coldScenes.find((s) => s.id === "redcell");
  assert.ok(twist);
  assert.ok(twist.text.includes("싸우지"));
  assert.ok(twist.text.includes("산소"));
});
