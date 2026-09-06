import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateExpression, evaluateEquation } from "./math-quiz";

test("evaluateExpression: sums plus-separated numbers", () => {
  assert.equal(evaluateExpression("2 + 2 + 2"), 6);
  assert.equal(evaluateExpression("4 + 4 + 4"), 12);
});

test("evaluateExpression: multiplies ×-separated numbers", () => {
  assert.equal(evaluateExpression("4 × 3"), 12);
  assert.equal(evaluateExpression("5 × 2"), 10);
});

test("evaluateExpression: single number parses", () => {
  assert.equal(evaluateExpression("12"), 12);
});

test("evaluateEquation: both sides equal is true", () => {
  assert.ok(evaluateEquation("2 + 2 + 2 = 6"));
  assert.ok(evaluateEquation("4 × 3 = 12"));
});

test("evaluateEquation: unequal sides is false", () => {
  assert.ok(!evaluateEquation("2 + 2 + 2 = 7"));
});
