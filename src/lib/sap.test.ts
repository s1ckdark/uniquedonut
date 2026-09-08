import { test } from "node:test";
import assert from "node:assert/strict";
import { sapGuests, beetleDifferences } from "./sap";

test("sapGuests: five unique guests with filled fields", () => {
  assert.equal(sapGuests.length, 5);
  const ids = new Set(sapGuests.map((g) => g.id));
  assert.equal(ids.size, 5);
  for (const g of sapGuests) {
    assert.ok(g.name.length > 0);
    assert.ok(g.what.length > 10);
    assert.ok(g.funFact.length > 10);
  }
});

test("sapGuests: includes the two beetle stars and the giant hornet", () => {
  const ids = sapGuests.map((g) => g.id);
  assert.ok(ids.includes("stag"));
  assert.ok(ids.includes("rhino"));
  assert.ok(ids.includes("giant-hornet"));
});

test("beetleDifferences: four parts with complete text", () => {
  assert.equal(beetleDifferences.length, 4);
  const ids = new Set(beetleDifferences.map((d) => d.id));
  assert.equal(ids.size, 4);
  for (const d of beetleDifferences) {
    assert.ok(d.title.length > 0);
    assert.ok(d.stag.length > 5);
    assert.ok(d.rhino.length > 5);
    assert.ok(d.tip.length > 5);
  }
});

test("beetleDifferences: covers weapon, body, color, fight", () => {
  const ids = beetleDifferences.map((d) => d.id);
  for (const expected of ["weapon", "body", "color", "fight"]) {
    assert.ok(ids.includes(expected as never), `missing ${expected}`);
  }
});
