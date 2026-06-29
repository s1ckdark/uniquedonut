import { test } from "node:test";
import assert from "node:assert/strict";
import { luminance, samplePixel } from "./ascii";

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
