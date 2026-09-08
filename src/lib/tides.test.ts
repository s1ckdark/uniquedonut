import { test } from "node:test";
import assert from "node:assert/strict";
import {
  tideAmplitude,
  tideHeight,
  tideState,
  oceanRingRadius,
  polar,
  sunTideHeight,
  combinedTideHeight,
  springNeap,
} from "./tides";

test("tideAmplitude: 1 at reference distance, inverse-cube away from it", () => {
  assert.equal(tideAmplitude(1), 1);
  assert.ok(Math.abs(tideAmplitude(0.6) - 1 / 0.216) < 1e-9); // ≈4.63
  assert.ok(tideAmplitude(0.6) > tideAmplitude(1));
  assert.ok(tideAmplitude(1) > tideAmplitude(1.4));
});

test("tideHeight: max toward AND opposite the moon, min at quadrature", () => {
  assert.ok(Math.abs(tideHeight(0, 1) - 1) < 1e-9);
  assert.ok(Math.abs(tideHeight(Math.PI, 1) - 1) < 1e-9);
  assert.ok(Math.abs(tideHeight(Math.PI / 2, 1) + 0.5) < 1e-9);
});

test("tideHeight: closer moon makes bigger tides", () => {
  assert.ok(tideHeight(0, 0.6) > tideHeight(0, 1.4));
});

test("tideState: 만조/간조/밀물/썰물 mapping", () => {
  assert.equal(tideState(0.8, 0.5).label, "만조");
  assert.equal(tideState(-0.4, 0).label, "간조");
  assert.equal(tideState(0.2, 0.1).label, "밀물");
  assert.equal(tideState(0.2, 0.3).label, "썰물");
});

test("oceanRingRadius: bulges toward the moon, dips at quadrature", () => {
  const base = 84;
  const toward = oceanRingRadius(base, 0, 0, 1, 12);
  const across = oceanRingRadius(base, Math.PI / 2, 0, 1, 12);
  assert.ok(toward > base);
  assert.ok(across < base);
});

test("polar: clockwise from top", () => {
  assert.deepEqual(polar(200, 200, 100, 0), { x: 200, y: 100 });
  assert.deepEqual(polar(200, 200, 100, Math.PI / 2), { x: 300, y: 200 });
});

test("sunTideHeight: same P2 shape at 0.46 amplitude", () => {
  assert.ok(Math.abs(sunTideHeight(0) - 0.46) < 1e-9);
  assert.ok(Math.abs(sunTideHeight(Math.PI) - 0.46) < 1e-9);
  assert.ok(Math.abs(sunTideHeight(Math.PI / 2) + 0.23) < 1e-9);
});

test("combinedTideHeight: aligned sun and moon stack to 1.46", () => {
  const h = combinedTideHeight(0, 0, 0, 1);
  assert.ok(Math.abs(h - 1.46) < 1e-9);
});

test("combinedTideHeight: neap configuration nearly cancels", () => {
  // moon at quadrature (-0.5), sun aligned (+0.46)
  const h = combinedTideHeight(0, Math.PI / 2, 0, 1);
  assert.ok(Math.abs(h - (-0.04)) < 1e-9);
});

test("combinedTideHeight: spring swing exceeds neap swing at the harbor", () => {
  const springSwing =
    Math.abs(combinedTideHeight(0, 0, 0, 1)) +
    Math.abs(combinedTideHeight(0, Math.PI / 2, Math.PI / 2, 1));
  // neap: moon aligned, sun at quadrature vs moon at quadrature, sun aligned
  const neapSwing =
    Math.abs(combinedTideHeight(0, 0, Math.PI / 2, 1)) +
    Math.abs(combinedTideHeight(0, Math.PI / 2, 0, 1));
  assert.ok(springSwing > neapSwing);
});

test("springNeap: alignment → spring, quadrature → neap, between → mid", () => {
  assert.equal(springNeap(0, 0).key, "spring");
  assert.equal(springNeap(0, 180).key, "spring");
  assert.equal(springNeap(90, 0).key, "neap");
  assert.equal(springNeap(45, 0).key, "mid");
});
