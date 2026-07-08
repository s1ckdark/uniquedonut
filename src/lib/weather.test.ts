import { test } from "node:test";
import assert from "node:assert/strict";
import { describeWeather, buildPrompt } from "./weather";

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

test("buildPrompt fills the city name into the template", () => {
  const prompt = buildPrompt("서울", { tempMinC: 5, tempMaxC: 12, wmoCode: 63 });
  assert.ok(prompt.includes("서울"), "city name must appear in the prompt");
  assert.ok(
    prompt.includes("City name: 서울"),
    "city should appear in the City name line",
  );
});

test("buildPrompt appends the explicit weather clause", () => {
  const prompt = buildPrompt("London", { tempMinC: 8, tempMaxC: 14, wmoCode: 0 });
  assert.ok(
    prompt.toLowerCase().includes("current weather to render"),
    "weather injection clause header must be present",
  );
  assert.ok(
    prompt.toLowerCase().includes("clear sky"),
    "weather description must be injected",
  );
  assert.ok(prompt.includes("8"), "min temp must be injected");
  assert.ok(prompt.includes("14"), "max temp must be injected");
});

test("buildPrompt without weather data omits the weather clause cleanly", () => {
  const prompt = buildPrompt("Paris");
  assert.ok(prompt.includes("Paris"));
  assert.ok(
    !prompt.toLowerCase().includes("current weather to render"),
    "no weather clause when weather is missing",
  );
});
