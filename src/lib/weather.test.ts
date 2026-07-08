import { test } from "node:test";
import assert from "node:assert/strict";
import { describeWeather } from "./weather";

test("describeWeather: clear sky (code 0)", () => {
  assert.equal(describeWeather(0), "clear sky");
});

test("describeWeather: partly cloudy (code 2)", () => {
  assert.match(describeWeather(2), /partly cloudy/i);
});

test("describeWeather: moderate rain (code 63)", () => {
  assert.match(describeWeather(63), /rain/i);
});

test("describeWeather: snow (code 75)", () => {
  assert.match(describeWeather(75), /snow/i);
});

test("describeWeather: fog (code 45)", () => {
  assert.match(describeWeather(45), /fog/i);
});

test("describeWeather: unknown code falls back gracefully", () => {
  assert.match(describeWeather(999), /unknown/i);
});
