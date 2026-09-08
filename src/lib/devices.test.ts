import { test } from "node:test";
import assert from "node:assert/strict";
import {
  devices,
  validateDevices,
  DEFAULT_SELECTION,
  type Device,
} from "./devices";

// Helper: minimal valid device for mutation tests.
function goodDevice(): Device {
  return {
    slug: "test-phone",
    name: "Test Phone",
    brand: "Test",
    widthMm: 70,
    heightMm: 150,
    depthMm: 7.5,
    screenIn: 6.1,
    color: "#333333",
  };
}

test("shipped device data passes the validator", () => {
  assert.deepEqual(validateDevices(devices), []);
});

test("shipped data has 16 devices covering Apple, Samsung, Google, Minimal, Unihertz", () => {
  assert.equal(devices.length, 16);
  const brands = new Set(devices.map((d) => d.brand));
  assert.ok(brands.has("Apple"));
  assert.ok(brands.has("Samsung"));
  assert.ok(brands.has("Google"));
  assert.ok(brands.has("Minimal"));
  assert.ok(brands.has("Unihertz"));
});

test("validator rejects negative or zero dimensions", () => {
  const bad = goodDevice();
  bad.widthMm = -5;
  assert.ok(validateDevices([bad]).length > 0);

  const zero = goodDevice();
  zero.depthMm = 0;
  assert.ok(validateDevices([zero]).length > 0);
});

test("validator rejects duplicate slugs", () => {
  const dup = [goodDevice(), { ...goodDevice() }];
  assert.ok(validateDevices(dup).length > 0);
});

test("validator rejects bad color or screen size", () => {
  const badColor = goodDevice();
  badColor.color = "red";
  assert.ok(validateDevices([badColor]).length > 0);

  const badScreen = goodDevice();
  badScreen.screenIn = -1;
  assert.ok(validateDevices([badScreen]).length > 0);
});

test("default selection slugs all exist in the shipped list", () => {
  const slugs = new Set(devices.map((d) => d.slug));
  for (const slug of DEFAULT_SELECTION) {
    assert.ok(slugs.has(slug), `missing ${slug}`);
  }
});
