import { test } from "node:test";
import assert from "node:assert/strict";
import {
  stages,
  positionOnSegment,
  advanceParticle,
  updateParticles,
  makeParticle,
  nextSpawnDelayMs,
  MAX_PARTICLES,
  SEGMENT_COUNT,
  type Particle,
} from "./pipeline";

test("stages: exactly five, in canonical order", () => {
  assert.deepEqual(
    stages.map((s) => s.id),
    ["source", "ingest", "transform", "store", "serve"],
  );
});

test("stages: unique names, non-empty shorts and colors", () => {
  const names = new Set(stages.map((s) => s.name));
  assert.equal(names.size, stages.length);
  for (const s of stages) {
    assert.ok(s.short.length > 0);
    assert.ok(/^#[0-9a-f]{6}$/i.test(s.color));
  }
});

test("stages: every stage carries complete detail content", () => {
  for (const s of stages) {
    assert.ok(s.detail.role.length > 10);
    assert.ok(s.detail.donutStory.length > 10);
    assert.ok(s.detail.examples.length >= 2);
  }
});

test("positionOnSegment: endpoints at t=0 and t=1", () => {
  const from = { x: 0, y: 0 };
  const to = { x: 100, y: 0 };
  assert.deepEqual(positionOnSegment(from, to, 0), from);
  assert.deepEqual(positionOnSegment(from, to, 1), to);
});

test("positionOnSegment: midpoint stays within bowed bounding box", () => {
  const from = { x: 0, y: 0 };
  const to = { x: 100, y: 0 };
  const mid = positionOnSegment(from, to, 0.5);
  assert.ok(mid.x > 20 && mid.x < 80);
  assert.ok(Math.abs(mid.y) <= 20); // bow = 0.15 * len
});

test("positionOnSegment: works for vertical segments", () => {
  const from = { x: 50, y: 0 };
  const to = { x: 50, y: 200 };
  const mid = positionOnSegment(from, to, 0.5);
  assert.ok(mid.y > 40 && mid.y < 160);
});

test("advanceParticle: t grows with dt", () => {
  const p: Particle = { id: 1, segment: 0, t: 0.2, speed: 0.5 };
  const next = advanceParticle(p, 1000)!;
  assert.equal(next.segment, 0);
  assert.ok(Math.abs(next.t - 0.7) < 1e-9);
});

test("advanceParticle: hops to next segment on t>=1", () => {
  const p: Particle = { id: 1, segment: 0, t: 0.9, speed: 0.5 };
  const next = advanceParticle(p, 400)!; // +0.2 -> 1.1
  assert.equal(next.segment, 1);
  assert.ok(Math.abs(next.t - 0.1) < 1e-9);
});

test("advanceParticle: removed after the last segment", () => {
  const p: Particle = { id: 1, segment: SEGMENT_COUNT, t: 0.9, speed: 0.5 };
  assert.equal(advanceParticle(p, 400), null);
});

test("updateParticles: caps at MAX_PARTICLES", () => {
  const many: Particle[] = Array.from({ length: MAX_PARTICLES + 5 }, (_, i) => ({
    id: i,
    segment: 0,
    t: 0.1,
    speed: 0.5,
  }));
  const out = updateParticles(many, 16, {
    id: 999,
    segment: 0,
    t: 0,
    speed: 0.5,
  });
  assert.equal(out.length, MAX_PARTICLES);
});

test("makeParticle: spawns at segment 0 with speed in range", () => {
  for (let i = 0; i < 50; i++) {
    const p = makeParticle(i);
    assert.equal(p.segment, 0);
    assert.equal(p.t, 0);
    assert.ok(p.speed >= 0.5 && p.speed <= 0.8);
  }
});

test("nextSpawnDelayMs: within 400-1000ms", () => {
  for (let i = 0; i < 50; i++) {
    const d = nextSpawnDelayMs();
    assert.ok(d >= 400 && d <= 1000);
  }
});
