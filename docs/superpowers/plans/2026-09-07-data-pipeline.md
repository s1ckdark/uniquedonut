# Data Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/pipeline` demo page — an interactive schematic where donut-data particles flow through five concept stages (source → ingest → transform → store → serve) with clickable explanations and play/pause.

**Architecture:** Pure stage/geometry/particle logic in `src/lib/pipeline.ts` (unit-tested). A canvas layer (`PipelineCanvas`) renders glowing particles along measured card-edge links with a rAF loop. The page lays out HTML stage cards, measures their edges, owns selection + play state.

**Tech Stack:** Next.js 16 app router, React 19, Tailwind v4, TypeScript, `node:test` + `tsx`.

**Spec:** `docs/superpowers/specs/2026-09-07-data-pipeline-design.md`

## Global Constraints

- Exactly 5 concept stages in order: `source, ingest, transform, store, serve`.
- No tech-stack nodes in the diagram; real-world hints live in detail text only.
- Particle cap 40; spawn delay 400–1000ms; speed 0.5–0.8 segment-progress/sec.
- Pure lib functions must not touch DOM/React.
- Unique Donut palette; Bungee Shade header "PIPELINE".

---

## Task 1: Stage data (TDD)

**Files:**
- Create: `src/lib/pipeline.ts`
- Test: `src/lib/pipeline.test.ts`

**Interfaces:**
- Produces: `PipelineStage`, `stages`, `Point`, `PipelineStageDetail` — used by Tasks 3–5.

- [ ] **Step 1: Write failing tests**

Create `src/lib/pipeline.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { stages } from "./pipeline";

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
```

- [ ] **Step 2: Verify failure** — Run: `npm test`. Expected: FAIL (module missing).

- [ ] **Step 3: Implement stages**

Create `src/lib/pipeline.ts`:
```ts
// Data pipeline schematic: stage definitions, bezier geometry, and particle
// logic. Pure module — no DOM, no React.

export interface Point {
  x: number;
  y: number;
}

export interface PipelineStageDetail {
  role: string;
  donutStory: string;
  examples: string[];
}

export type StageId = "source" | "ingest" | "transform" | "store" | "serve";

export interface PipelineStage {
  id: StageId;
  name: string;
  short: string;
  emoji: string;
  color: string;
  detail: PipelineStageDetail;
}

export const stages: PipelineStage[] = [
  {
    id: "source",
    name: "소스",
    short: "판매 기록이 발생하는 곳",
    emoji: "🧾",
    color: "#FF6B9D",
    detail: {
      role: "데이터가 처음 만들어지는 곳이에요. 주문 앱, 포스 기계, 온라인 스토어가 각자 다른 모양의 기록을 남깁니다.",
      donutStory: "도넛 가게에서 주문서가 매일매일 쌓이는 것과 같아요. 매장 포스, 배달 앱, 홈페이지 주문이 각각 뿅뿅 생겨요.",
      examples: ["앱/웹 이벤트 로그", "POS 판매 기록", "DB 트랜잭션"],
    },
  },
  {
    id: "ingest",
    name: "수집",
    short: "흩어진 데이터를 한곳으로",
    emoji: "📥",
    color: "#FF8C42",
    detail: {
      role: "여기저기 흩어진 데이터를 한곳으로 모아 오는 단계예요. 실시간으로 흘려보내기도 하고, 정해진 시간에 묶어 가져오기도 해요.",
      donutStory: "매장, 배달, 홈페이지 주문서를 매일 아침 한 상자로 모으는 일이에요.",
      examples: ["실시간 스트리밍 수집", "주기적 배치 수집", "API 폴링"],
    },
  },
  {
    id: "transform",
    name: "처리",
    short: "정제하고 변환하고 집계",
    emoji: "🔧",
    color: "#FFD93D",
    detail: {
      role: "지저분한 원본 데이터를 깨끗하게 다듬어요. 중복을 없애고, 형식을 맞추고, 매출처럼 의미 있는 숫자로 합쳐요.",
      donutStory: "주문서에서 취소된 주문은 빼고, 같은 도넛 판매는 모아서 '오늘 글레이즈드 120개!'처럼 세는 거예요.",
      examples: ["중복 제거·검증", "형식 변환", "집계·요약"],
    },
  },
  {
    id: "store",
    name: "저장",
    short: "창고에 차곡차곡",
    emoji: "🗄️",
    color: "#6BCB77",
    detail: {
      role: "다듬은 데이터를 잘 보관하는 단계예요. 나중에 꺼내 보기 쉽게 역할별로 나누어 쌓아둬요.",
      donutStory: "월별 도넛 판매 장부를 연도별로 정리해 창고에 넣어두는 것과 같아요.",
      examples: ["데이터 웨어하우스", "데이터 레이크", "분석용 DB"],
    },
  },
  {
    id: "serve",
    name: "시각화",
    short: "대시보드로 의사결정",
    emoji: "📊",
    color: "#00ccff",
    detail: {
      role: "저장된 데이터를 그래프와 대시보드로 보여주는 단계예요. 보는 사람이 한눈에 이해하고 결정할 수 있게 해요.",
      donutStory: "'오늘 제일 잘 나간 도넛은?'을 그래프로 보여주는 게시판이에요!",
      examples: ["대시보드", "정기 리포트", "알림/지표"],
    },
  },
];
```

- [ ] **Step 4: Verify pass** — `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** — `git add src/lib/pipeline.ts src/lib/pipeline.test.ts && git commit -m "feat(pipeline): add five concept stages with detail content"`

---

## Task 2: Geometry + particle logic (TDD)

**Files:**
- Modify: `src/lib/pipeline.ts`
- Test: `src/lib/pipeline.test.ts`

**Interfaces:**
- Produces: `positionOnSegment(from, to, t): Point`, `Particle`, `advanceParticle(p, dtMs)`, `updateParticles(list, dtMs, spawn)`, `makeParticle(id)`, `nextSpawnDelayMs()`, `MAX_PARTICLES`, `SEGMENT_COUNT`.

- [ ] **Step 1: Write failing tests** — append to `src/lib/pipeline.test.ts`:
```ts
import {
  positionOnSegment,
  advanceParticle,
  updateParticles,
  makeParticle,
  nextSpawnDelayMs,
  MAX_PARTICLES,
  SEGMENT_COUNT,
  type Particle,
} from "./pipeline";

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
  const out = updateParticles(many, 16, { id: 999, segment: 0, t: 0, speed: 0.5 });
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

test("nextSpawnDelayMs: within 400–1000ms", () => {
  for (let i = 0; i < 50; i++) {
    const d = nextSpawnDelayMs();
    assert.ok(d >= 400 && d <= 1000);
  }
});
```

- [ ] **Step 2: Verify failure** — `npm test`. Expected: FAIL (functions missing).

- [ ] **Step 3: Implement** — append to `src/lib/pipeline.ts`:
```ts
export const MAX_PARTICLES = 40;
export const SEGMENT_COUNT = stages.length - 1;

export interface Particle {
  id: number;
  segment: number; // 0..SEGMENT_COUNT-1
  t: number; // 0..1 progress within the segment
  speed: number; // progress per second
}

/** Cubic bezier between two points. Control points sit at 35%/65% along
 *  the segment, each offset 0.15×length along the normal — a gentle bow
 *  that reads well horizontally and vertically. */
export function positionOnSegment(from: Point, to: Point, t: number): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const bow = 0.15 * len;
  const cp1 = { x: from.x + dx * 0.35 + nx * bow, y: from.y + dy * 0.35 + ny * bow };
  const cp2 = { x: from.x + dx * 0.65 + nx * bow, y: from.y + dy * 0.65 + ny * bow };
  const u = 1 - t;
  return {
    x: u * u * u * from.x + 3 * u * u * t * cp1.x + 3 * u * t * t * cp2.x + t * t * t * to.x,
    y: u * u * u * from.y + 3 * u * u * t * cp1.y + 3 * u * t * t * cp2.y + t * t * t * to.y,
  };
}

/** Advance one particle by dtMs. Returns null when it passes the last stage. */
export function advanceParticle(p: Particle, dtMs: number): Particle | null {
  const t = p.t + p.speed * (dtMs / 1000);
  if (t < 1) return { ...p, t };
  const nextSegment = p.segment + 1;
  if (nextSegment > SEGMENT_COUNT - 1) return null;
  return { ...p, segment: nextSegment, t: t - 1 };
}

/** Advance all particles, optionally spawn one, enforce the cap. */
export function updateParticles(
  particles: Particle[],
  dtMs: number,
  spawn: Particle | null,
): Particle[] {
  const advanced = particles
    .map((p) => advanceParticle(p, dtMs))
    .filter((p): p is Particle => p !== null);
  const withSpawn = spawn ? [...advanced, spawn] : advanced;
  return withSpawn.slice(0, MAX_PARTICLES);
}

export function makeParticle(id: number): Particle {
  return { id, segment: 0, t: 0, speed: 0.5 + Math.random() * 0.3 };
}

export function nextSpawnDelayMs(): number {
  return 400 + Math.random() * 600;
}
```

- [ ] **Step 4: Verify pass** — `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(pipeline): add bezier geometry and particle lifecycle"`

---

## Task 3: PipelineCanvas component

**Files:**
- Create: `src/components/PipelineCanvas.tsx`

**Interfaces:**
- Consumes: `positionOnSegment`, `updateParticles`, `makeParticle`, `nextSpawnDelayMs`, `stages`, `Point`.
- Produces: default export `PipelineCanvas({ links, playing }: { links: { from: Point; to: Point }[]; playing: boolean })`.

- [ ] **Step 1: Create component** — canvas fills its parent (absolute inset-0); rAF loop only while `playing`; DPR-aware sizing; draws faint connector curves + glowing particles:
```tsx
"use client";

import { useEffect, useRef } from "react";
import {
  stages,
  positionOnSegment,
  updateParticles,
  makeParticle,
  nextSpawnDelayMs,
  type Particle,
  type Point,
} from "@/lib/pipeline";

export interface PipelineLink {
  from: Point;
  to: Point;
}

export default function PipelineCanvas({
  links,
  playing,
}: {
  links: PipelineLink[];
  playing: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const spawnDelayRef = useRef<number>(nextSpawnDelayMs());
  const idRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = parent.offsetWidth * dpr;
      canvas.height = parent.offsetHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const render = (now: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.width;
      const H = canvas.height;

      if (lastTimeRef.current === 0) lastTimeRef.current = now;
      const dt = Math.min(100, now - lastTimeRef.current);
      lastTimeRef.current = now;

      // Spawn timer
      spawnTimerRef.current += dt;
      let spawn: Particle | null = null;
      if (spawnTimerRef.current >= spawnDelayRef.current) {
        spawnTimerRef.current = 0;
        spawnDelayRef.current = nextSpawnDelayMs();
        if (particlesRef.current.length < 40 && links.length > 0) {
          spawn = makeParticle(idRef.current++);
        }
      }
      particlesRef.current = updateParticles(particlesRef.current, dt, spawn);

      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Faint connector curves
      ctx.lineWidth = 2;
      for (const link of links) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.beginPath();
        ctx.moveTo(link.from.x, link.from.y);
        for (let t = 0.05; t <= 1.0001; t += 0.05) {
          const p = positionOnSegment(link.from, link.to, t);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      // Glowing particles
      for (const p of particlesRef.current) {
        const link = links[p.segment];
        if (!link) continue;
        const pos = positionOnSegment(link.from, link.to, p.t);
        const color = stages[p.segment].color;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      rafRef.current = requestAnimationFrame(render);
    };

    if (playing) {
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [playing, links]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
```

- [ ] **Step 2: Verify compile** — `npx tsc --noEmit`. Expected: no errors.
- [ ] **Step 3: Commit** — `git commit -m "feat(pipeline): add canvas particle layer"`

---

## Task 4: /pipeline page

**Files:**
- Create: `src/app/pipeline/page.tsx`

**Interfaces:**
- Consumes: `stages`, `PipelineCanvas`, `PipelineLink`.

- [ ] **Step 1: Create page** — stage cards in a responsive grid; measures card edges on mount/resize into `PipelineLink[]` (horizontal on wide, vertical on narrow); selected stage detail panel; play/pause:
```tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import PipelineCanvas, { type PipelineLink } from "@/components/PipelineCanvas";
import { stages } from "@/lib/pipeline";

export default function PipelinePage() {
  const [playing, setPlaying] = useState(true);
  const [selected, setSelected] = useState<string>("source");
  const [links, setLinks] = useState<PipelineLink[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rects = cardRefs.current.map((el) => {
      if (!el) return null;
      return {
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      };
    });
    if (rects.some((r) => r === null)) return;

    const nextLinks: PipelineLink[] = [];
    for (let i = 0; i < rects.length - 1; i++) {
      const a = rects[i]!;
      const b = rects[i + 1]!;
      const horizontal = Math.abs(b.left - a.left) >= Math.abs(b.top - a.top);
      const M = 10; // margin from card edge
      nextLinks.push(
        horizontal
          ? {
              from: { x: a.left + a.width + M, y: a.top + a.height / 2 },
              to: { x: b.left - M, y: b.top + b.height / 2 },
            }
          : {
              from: { x: a.left + a.width / 2, y: a.top + a.height + M },
              to: { x: b.left + b.width / 2, y: b.top - M },
            },
      );
    }
    setLinks(nextLinks);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const selectedStage = stages.find((s) => s.id === selected) ?? stages[0];

  return (
    <div className="min-h-screen bg-[#1A0A2E] text-[#FEFEFE]">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/shop"
            className="rounded-full bg-[#FF6B9D]/15 px-4 py-2 text-sm font-bold text-[#FF6B9D] transition hover:scale-105"
          >
            ← Shop
          </Link>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/20 cursor-pointer"
          >
            {playing ? "⏸ 일시정지" : "▶ 재생"}
          </button>
        </div>

        <header className="mb-8 text-center">
          <h1
            className="text-4xl font-black leading-none md:text-6xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#6BCB77",
              textShadow: "0 0 20px rgba(107,203,119,0.5), 3px 3px 0px #FF6B9D",
            }}
          >
            PIPELINE
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            도넛 데이터가 흘러가는 여정 🍩→📊
          </p>
        </header>

        {/* Diagram */}
        <div ref={containerRef} className="relative">
          <PipelineCanvas links={links} playing={playing} />
          <div className="relative z-10 grid grid-cols-1 gap-16 py-4 md:grid-cols-5 md:gap-4">
            {stages.map((stage, i) => (
              <div key={stage.id} ref={(el) => { cardRefs.current[i] = el; }}>
                <button
                  type="button"
                  onClick={() => setSelected(stage.id)}
                  className="w-full cursor-pointer rounded-2xl border-2 bg-[#241040]/95 p-4 text-center transition hover:scale-105"
                  style={{
                    borderColor: selected === stage.id ? stage.color : "#FFFFFF20",
                    boxShadow: selected === stage.id ? `0 0 24px ${stage.color}50` : undefined,
                  }}
                >
                  <span className="text-3xl">{stage.emoji}</span>
                  <p
                    className="mt-2 text-lg font-black"
                    style={{ fontFamily: "'Fredoka', cursive", color: stage.color }}
                  >
                    {stage.name}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">{stage.short}</p>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <section
          className="mt-8 rounded-2xl border p-6"
          style={{ borderColor: `${selectedStage.color}50`, background: `${selectedStage.color}10` }}
        >
          <h2
            className="text-2xl font-black"
            style={{ fontFamily: "'Fredoka', cursive", color: selectedStage.color }}
          >
            {selectedStage.emoji} {selectedStage.name}
          </h2>
          <p className="mt-3 leading-relaxed text-white/85">{selectedStage.detail.role}</p>
          <p className="mt-2 leading-relaxed text-white/60">🍩 {selectedStage.detail.donutStory}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedStage.detail.examples.map((ex) => (
              <span
                key={ex}
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  background: `${selectedStage.color}20`,
                  color: selectedStage.color,
                  border: `1px solid ${selectedStage.color}50`,
                }}
              >
                {ex}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Build** — `npm run build`. Expected: `/pipeline` present.
- [ ] **Step 3: Commit** — `git commit -m "feat(pipeline): add /pipeline page with diagram and detail panel"`

---

## Task 5: Shop listing + flavor count

**Files:**
- Modify: `src/data/donuts.ts` — add after `donut-math`:
```ts
  {
    slug: "data-pipeline",
    name: "Data Pipeline",
    description: "Donut data flowing through five stages",
    route: "/pipeline",
    category: "Chef's Special",
    tags: ["Data", "Diagram"],
    price: "$8.00",
    color: "#00ccff",
  },
```
- Modify: `src/app/page.tsx` — `22 flavors available` → `23 flavors available`.

- [ ] **Step 1: Apply both edits.**
- [ ] **Step 2: Build** — `npm run build`. Expected: success.
- [ ] **Step 3: Commit** — `git commit -m "feat(pipeline): list Data Pipeline in shop"`

---

## Task 6: Final verification

- [ ] **Step 1: Tests** — `npm test`. Expected: all suites pass.
- [ ] **Step 2: Build** — `npm run build`. Expected: `/pipeline` present.
- [ ] **Step 3: Browser smoke** — dev server; open `/pipeline`; verify particles flow between cards, pause freezes them, clicking each card swaps the detail panel, mobile-width layout stacks vertically, `/shop` shows the card.
- [ ] **Step 4: Commit fixes** — `git add -A && git commit -m "chore(pipeline): final smoke-test fixes"` (only if needed).
