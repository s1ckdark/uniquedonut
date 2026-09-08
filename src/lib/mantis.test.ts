import { test } from "node:test";
import assert from "node:assert/strict";
import {
  differences,
  growthStages,
  FEMALE_SEGMENTS,
  MALE_SEGMENTS,
} from "./mantis";

test("differences: four unique parts with complete text", () => {
  assert.equal(differences.length, 4);
  const ids = new Set(differences.map((d) => d.id));
  assert.equal(ids.size, 4);
  for (const d of differences) {
    assert.ok(d.title.length > 0);
    assert.ok(d.female.length > 5);
    assert.ok(d.male.length > 5);
    assert.ok(d.tip.length > 5);
  }
});

test("differences: covers body, antennae, wings, segments", () => {
  const ids = differences.map((d) => d.id);
  for (const expected of ["body", "antennae", "wings", "segments"]) {
    assert.ok(ids.includes(expected as never), `missing ${expected}`);
  }
});

test("growthStages: five stages from ootheca to adult", () => {
  assert.deepEqual(
    growthStages.map((s) => s.id),
    ["ootheca", "hatch", "nymph", "molt", "adult"],
  );
});

test("growthStages: only the adult has wings; scale grows after hatching", () => {
  for (const s of growthStages) {
    assert.equal(s.wings, s.id === "adult");
  }
  const scales = growthStages
    .filter((s) => s.id !== "ootheca")
    .map((s) => s.scale);
  for (let i = 1; i < scales.length; i++) {
    assert.ok(scales[i] > scales[i - 1], "scale must strictly increase");
  }
});

test("growthStages: every stage carries description and fun fact", () => {
  for (const s of growthStages) {
    assert.ok(s.name.length > 0);
    assert.ok(s.description.length > 10);
    assert.ok(s.funFact.length > 10);
  }
});

test("segment constants: female 6, male 8", () => {
  assert.equal(FEMALE_SEGMENTS, 6);
  assert.equal(MALE_SEGMENTS, 8);
});
