import { test } from "node:test";
import assert from "node:assert/strict";
import { ansiToSpans } from "./ansi";

test("plain text yields a single unstyled span", () => {
  const spans = ansiToSpans("hello");
  assert.equal(spans.length, 1);
  assert.deepEqual(spans[0], { text: "hello", color: undefined, background: undefined });
});

test("foreground color sequence sets color", () => {
  const spans = ansiToSpans("\x1b[38;2;255;0;0mred\x1b[0m");
  assert.equal(spans.length, 1);
  assert.equal(spans[0].text, "red");
  assert.equal(spans[0].color, "rgb(255,0,0)");
});

test("background color sequence sets background", () => {
  const spans = ansiToSpans("\x1b[48;2;0;0;255m\x1b[38;2;255;255;255m▀\x1b[0m");
  assert.equal(spans.length, 1);
  assert.equal(spans[0].text, "▀");
  assert.equal(spans[0].color, "rgb(255,255,255)");
  assert.equal(spans[0].background, "rgb(0,0,255)");
});

test("mixed styled and unstyled segments", () => {
  const spans = ansiToSpans("a\x1b[38;2;0;255;0mb\x1b[0mc");
  assert.equal(spans.length, 3);
  assert.equal(spans[0].text, "a");
  assert.equal(spans[0].color, undefined);
  assert.equal(spans[1].text, "b");
  assert.equal(spans[1].color, "rgb(0,255,0)");
  assert.equal(spans[2].text, "c");
  assert.equal(spans[2].color, undefined);
});

test("newline-containing text preserves newlines in span text", () => {
  const spans = ansiToSpans("ab\ncd");
  assert.equal(spans[0].text, "ab\ncd");
});
