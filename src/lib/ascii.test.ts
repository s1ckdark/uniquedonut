import { test } from "node:test";
import assert from "node:assert/strict";
import { luminance, samplePixel, convertImage } from "./ascii";

test("luminance of black is 0", () => {
  assert.equal(luminance(0, 0, 0, 255), 0);
});

test("luminance of white is 255", () => {
  assert.equal(luminance(255, 255, 255, 255), 255);
});

test("luminance is weighted (green brighter than blue at same value)", () => {
  // Rec.601: green weight 0.587, blue weight 0.114
  assert.ok(luminance(0, 200, 0, 255) > luminance(0, 0, 200, 255));
});

test("luminance scales by alpha (transparent pixels read dark)", () => {
  const solid = luminance(255, 255, 255, 255);
  const transparent = luminance(255, 255, 255, 0);
  assert.ok(transparent < solid);
  assert.equal(transparent, 0);
});

test("samplePixel reads RGBA at (x,y) from a flat buffer", () => {
  // 1x2 image: top red, bottom blue
  const pixels = new Uint8Array([255, 0, 0, 255, 0, 0, 255, 255]);
  assert.deepEqual(samplePixel({ pixels, width: 1, height: 2 }, 0, 0), {
    r: 255,
    g: 0,
    b: 0,
    a: 255,
  });
  assert.deepEqual(samplePixel({ pixels, width: 1, height: 2 }, 0, 1), {
    r: 0,
    g: 0,
    b: 255,
    a: 255,
  });
});

test("samplePixel clamps out-of-range coordinates to edges", () => {
  const pixels = new Uint8Array([10, 20, 30, 255]);
  assert.deepEqual(samplePixel({ pixels, width: 1, height: 1 }, 5, 5), {
    r: 10,
    g: 20,
    b: 30,
    a: 255,
  });
});

// Helper: build a PixelData of solid color, width x height.
function solid(w: number, h: number, r: number, g: number, b: number) {
  const pixels = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    pixels[i * 4] = r;
    pixels[i * 4 + 1] = g;
    pixels[i * 4 + 2] = b;
    pixels[i * 4 + 3] = 255;
  }
  return { pixels, width: w, height: h };
}

test("ASCII mode: solid black yields all spaces (darkest ramp char)", () => {
  const out = convertImage(solid(4, 4, 0, 0, 0), {
    mode: "ascii",
    color: false,
    targetWidth: 4,
  });
  // Every line is 4 spaces.
  for (const line of out.split("\n")) {
    assert.equal(line, "    ");
  }
});

test("ASCII mode: solid white yields all '@' (brightest ramp char)", () => {
  const out = convertImage(solid(4, 4, 255, 255, 255), {
    mode: "ascii",
    color: false,
    targetWidth: 4,
  });
  for (const line of out.split("\n")) {
    assert.equal(line, "@@@@");
  }
});

test("ASCII mode: output width matches targetWidth", () => {
  const out = convertImage(solid(20, 10, 128, 128, 128), {
    mode: "ascii",
    color: false,
    targetWidth: 10,
  });
  const lines = out.split("\n");
  assert.ok(lines.length > 0);
  for (const line of lines) {
    assert.equal(line.length, 10);
  }
});

test("ASCII mode with color: output contains ANSI foreground sequence", () => {
  const out = convertImage(solid(2, 2, 255, 0, 0), {
    mode: "ascii",
    color: true,
    targetWidth: 2,
  });
  // \x1b[38;2;255;0;0m
  assert.ok(out.includes("\x1b[38;2;255;0;0m"), "expected red foreground ANSI");
  assert.ok(out.includes("\x1b[0m"), "expected reset sequence");
});

test("ASCII mode without color: no ANSI escape sequences", () => {
  const out = convertImage(solid(2, 2, 255, 0, 0), {
    mode: "ascii",
    color: false,
    targetWidth: 2,
  });
  assert.ok(!out.includes("\x1b"), "no escape sequences expected");
});
