# Moon & Tides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/tides` — a Gino learning page where moon-position and moon-distance sliders (plus auto-play) drive a dual-view tide simulation with a live 만조/간조/밀물/썰물 status.

**Architecture:** Pure physics/labeling in `src/lib/tides.ts` (P₂ tidal term, 1/d³ amplitude). Two presentational SVG view components; the page owns slider/auto-play state and a rAF loop.

**Tech Stack:** Next.js 16 app router, React 19, Tailwind v4, `node:test` + `tsx`.

**Spec:** `docs/superpowers/specs/2026-09-08-moon-tides-design.md`

## Global Constraints

- Moon only (no sun). Exploration only (no quiz).
- `h = A·(3cos²φ−1)/2`, `A = (1/d)³`, d ∈ [0.6, 1.4]; initial d = 1.0.
- Start state: moon aligned with harbor (angle 0) ⇒ 만조 on load.
- Angles: degrees in page state; radians in lib; screen convention = clockwise from top.
- Unique Donut palette; Bungee Shade header "MOON & TIDES".

---

## Task 1: Tides physics lib (TDD)

**Files:**
- Create: `src/lib/tides.ts`
- Test: `src/lib/tides.test.ts`

**Interfaces (Produces):**
- `D_REF=1, D_MIN=0.6, D_MAX=1.4`
- `tideAmplitude(d): number`
- `tideHeight(phiRad, d): number`
- `tideState(u, prevU): TideState { label, emoji, description }`
- `oceanRingRadius(base, pointAngleRad, moonAngleRad, d, exaggeration): number`
- `polar(cx, cy, r, angleRad): { x, y }`

- [ ] **Step 1: Failing tests** — create `src/lib/tides.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  tideAmplitude,
  tideHeight,
  tideState,
  oceanRingRadius,
  polar,
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
```

- [ ] **Step 2: Verify fail** — `npm test` FAIL (module missing).
- [ ] **Step 3: Implement** — create `src/lib/tides.ts`:
```ts
// Moon-and-tides learning simulation: pure physics + state labeling.
// No DOM, no React.

/** Moon distance is expressed as a multiple of D_REF. */
export const D_REF = 1;
export const D_MIN = 0.6;
export const D_MAX = 1.4;

/** Tidal amplitude follows the inverse-cube law: A = (D_REF/d)^3. */
export function tideAmplitude(moonDist: number): number {
  return Math.pow(D_REF / moonDist, 3);
}

/** Tidal height at angle difference phi (radians) from the moon.
 *  P2 tidal term: +A toward (and opposite) the moon, -A/2 at quadrature. */
export function tideHeight(phi: number, moonDist: number): number {
  const c = Math.cos(phi);
  return tideAmplitude(moonDist) * ((3 * c * c - 1) / 2);
}

export interface TideState {
  label: string;
  emoji: string;
  description: string;
}

/** Label the harbor state from normalized level u = h / A (range [-0.5, 1])
 *  and its movement vs the previous sample. */
export function tideState(u: number, prevU: number | null): TideState {
  if (u >= 0.6) {
    return { label: "만조", emoji: "🌊", description: "바닷물이 가장 높이 차올랐어요!" };
  }
  if (u <= -0.35) {
    return { label: "간조", emoji: "🏖️", description: "바닷물이 가장 많이 빠졌어요! 갯벌이 보여요." };
  }
  const rising = prevU === null ? true : u > prevU;
  return rising
    ? { label: "밀물", emoji: "📈", description: "바닷물이 밀려오고 있어요. 슝~ 슝~" }
    : { label: "썰물", emoji: "📉", description: "바닷물이 빠져나가고 있어요. 슝~ 슝~" };
}

/** Radius of the ocean ring at a screen angle, with visual exaggeration.
 *  Angles in radians, clockwise from the top of the view. */
export function oceanRingRadius(
  baseRadius: number,
  pointAngleRad: number,
  moonAngleRad: number,
  moonDist: number,
  exaggeration: number,
): number {
  const phi = pointAngleRad - moonAngleRad;
  return baseRadius + tideHeight(phi, moonDist) * exaggeration;
}

/** Screen position for an angle (clockwise from top) at distance r. */
export function polar(
  cx: number,
  cy: number,
  r: number,
  angleRad: number,
): { x: number; y: number } {
  return { x: cx + r * Math.sin(angleRad), y: cy - r * Math.cos(angleRad) };
}
```

- [ ] **Step 4: Verify pass** — `npm test` PASS.
- [ ] **Step 5: Commit** — `git add src/lib/tides.ts src/lib/tides.test.ts && git commit -m "feat(tides): add tidal physics and state labeling"`

---

## Task 2: TidesSpace view

**Files:**
- Create: `src/components/TidesSpace.tsx`

**Interfaces (Consumes/Produces):** default export `TidesSpace({ moonAngleDeg, moonDistMult }: { moonAngleDeg: number; moonDistMult: number })`.

- [ ] **Step 1: Create component:**
```tsx
"use client";

import { oceanRingRadius, polar } from "@/lib/tides";

const CX = 200;
const CY = 200;
const EARTH_R = 70;
const OCEAN_BASE = 84;
const EXAGGERATION = 12;
const ORBIT_VISUAL = 140; // px at D_REF

export default function TidesSpace({
  moonAngleDeg,
  moonDistMult,
}: {
  moonAngleDeg: number;
  moonDistMult: number;
}) {
  const moonAngle = (moonAngleDeg * Math.PI) / 180;

  // Ocean ring path (drawn behind Earth): 72 samples around.
  const points: string[] = [];
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const r = oceanRingRadius(OCEAN_BASE, a, moonAngle, moonDistMult, EXAGGERATION);
    const p = polar(CX, CY, r, a);
    points.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }

  const moon = polar(CX, CY, moonDistMult * ORBIT_VISUAL, moonAngle);

  return (
    <svg viewBox="0 0 400 400" className="w-full" role="img" aria-label="지구와 달">
      {/* orbit guide */}
      <circle
        cx={CX}
        cy={CY}
        r={ORBIT_VISUAL}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeDasharray="4 6"
      />
      {/* ocean (behind Earth) */}
      <polygon points={points.join(" ")} fill="#2E86DE" opacity={0.55} />
      {/* Earth with land */}
      <circle cx={CX} cy={CY} r={EARTH_R} fill="#4C9F70" />
      <clipPath id="earth-clip">
        <circle cx={CX} cy={CY} r={EARTH_R} />
      </clipPath>
      <g clipPath="url(#earth-clip)">
        <ellipse cx={CX - 25} cy={CY - 20} rx={30} ry={18} fill="#3E8E41" transform={`rotate(-20 ${CX - 25} ${CY - 20})`} />
        <ellipse cx={CX + 25} cy={CY + 25} rx={26} ry={16} fill="#3E8E41" transform={`rotate(15 ${CX + 25} ${CY + 25})`} />
        <ellipse cx={CX + 10} cy={CY - 45} rx={20} ry={12} fill="#3E8E41" />
      </g>
      {/* harbor marker at the top */}
      <line x1={CX} y1={CY - EARTH_R + 4} x2={CX} y2={CY - OCEAN_BASE - 26} stroke="#FFD93D" strokeWidth={2} />
      <text x={CX} y={CY - OCEAN_BASE - 14} textAnchor="middle" fontSize={22}>🍩</text>
      <text x={CX + 34} y={CY - OCEAN_BASE - 14} fontSize={10} fill="#FFD93D">도넛항</text>
      {/* moon */}
      <g transform={`translate(${moon.x.toFixed(1)} ${moon.y.toFixed(1)})`}>
        <circle r={16} fill="#D9D9E3" />
        <circle cx={-5} cy={-4} r={3} fill="#B9B9C6" />
        <circle cx={6} cy={2} r={2.2} fill="#B9B9C6" />
        <circle cx={-2} cy={7} r={1.8} fill="#B9B9C6" />
      </g>
    </svg>
  );
}
```

- [ ] **Step 2: Compile check** — `npx tsc --noEmit` no errors.
- [ ] **Step 3: Commit** — `git commit -m "feat(tides): add space view with deformed ocean ring"`

---

## Task 3: TidesBeach view

**Files:**
- Create: `src/components/TidesBeach.tsx`

**Interfaces:** default export `TidesBeach({ h }: { h: number })` where `h` is the harbor's absolute tide height (amplitude included).

- [ ] **Step 1: Create component:**
```tsx
"use client";

// Side-view beach: sea level maps directly from the harbor's tide height h
// (amplitude included), so a closer moon visibly swings the sea further.

export default function TidesBeach({ h }: { h: number }) {
  const t = Math.max(-1, Math.min(1, h / 1.6));
  const waterTop = 115 - 55 * t;
  const lowTide = t < -0.5;
  const SEA_EDGE = 150;

  return (
    <svg viewBox="0 0 300 220" className="w-full" role="img" aria-label="도넛항 해변">
      {/* sand slope */}
      <path
        d="M 60 220 L 110 150 L 300 118 L 300 220 Z"
        fill="#E8C97A"
      />
      {/* wet sand band (reach of the water) */}
      <path
        d="M 60 220 L 110 150 L 300 118 L 300 140 L 110 168 Z"
        fill="#D4B265"
        opacity={0.8}
      />
      {/* sea with wavy top */}
      <path
        d={`M 0 ${waterTop.toFixed(1)} q 18 -6 36 0 t 36 0 t 36 0 t 42 0 L ${SEA_EDGE} 220 L 0 220 Z`}
        fill="#2E86DE"
        opacity={0.9}
      />
      {/* beach friends at low tide */}
      {lowTide && (
        <>
          <text x={78} y={178} fontSize={16}>🐚</text>
          <text x={104} y={186} fontSize={16}>⭐</text>
        </>
      )}
      {/* donut shop on the right */}
      <g>
        <rect x={205} y={78} width={62} height={42} rx={4} fill="#FF6B9D" />
        <polygon points="200,78 236,58 272,78" fill="#FFD93D" />
        <text x={236} y={106} textAnchor="middle" fontSize={18}>🍩</text>
      </g>
      {/* gauge */}
      <line x1={14} y1={60} x2={14} y2={170} stroke="#FEFEFE" strokeWidth={2} opacity={0.6} />
      <text x={22} y={63} fontSize={9} fill="#FEFEFE">만</text>
      <text x={22} y={171} fontSize={9} fill="#FEFEFE">간</text>
      <circle cx={14} cy={waterTop} r={4} fill="#FFD93D" />
    </svg>
  );
}
```

- [ ] **Step 2: Compile check** — `npx tsc --noEmit` no errors.
- [ ] **Step 3: Commit** — `git commit -m "feat(tides): add beach view with tide-dependent sea level"`

---

## Task 4: /tides page

**Files:**
- Create: `src/app/tides/page.tsx`

- [ ] **Step 1: Create page:**
```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import TidesSpace from "@/components/TidesSpace";
import TidesBeach from "@/components/TidesBeach";
import { tideAmplitude, tideHeight, tideState } from "@/lib/tides";

export default function TidesPage() {
  const [angleDeg, setAngleDeg] = useState(0);
  const [distMult, setDistMult] = useState(1);
  const [playing, setPlaying] = useState(true);

  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const prevURef = useRef<number | null>(null);

  // Auto-play: the moon orbits ~30°/s (one revolution ≈ 12s).
  useEffect(() => {
    if (!playing) return;
    const tick = (now: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = now;
      const dt = Math.min(100, now - lastTimeRef.current);
      lastTimeRef.current = now;
      setAngleDeg((a) => (a + (30 * dt) / 1000) % 360);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
    };
  }, [playing]);

  const moonAngle = (angleDeg * Math.PI) / 180;
  // Harbor sits at screen angle 0 (top); cos is even so sign of diff is moot.
  const h = tideHeight(-moonAngle, distMult);
  const u = h / tideAmplitude(distMult);
  const state = tideState(u, prevURef.current);
  useEffect(() => {
    prevURef.current = u;
  }, [u]);

  return (
    <div className="min-h-screen bg-[#1A0A2E] text-[#FEFEFE]">
      <main className="mx-auto max-w-5xl px-4 py-8">
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
            {playing ? "⏸ 일시정지" : "▶ 달 공전 시작"}
          </button>
        </div>

        <header className="mb-8 text-center">
          <h1
            className="text-4xl font-black leading-none md:text-6xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#00ccff",
              textShadow: "0 0 20px rgba(0,204,255,0.5), 3px 3px 0px #FF6B9D",
            }}
          >
            MOON &amp; TIDES
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            달과 바다의 숨바꼭질 🌙🌊
          </p>
        </header>

        {/* Sliders */}
        <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2">
          <label className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-sm font-bold text-white/70">달 위치</span>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={Math.round(angleDeg)}
              onChange={(e) => {
                setPlaying(false);
                setAngleDeg(Number(e.target.value));
              }}
              className="w-full accent-[#00ccff] cursor-pointer"
            />
          </label>
          <label className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-sm font-bold text-white/70">달 거리</span>
            <input
              type="range"
              min={60}
              max={140}
              step={1}
              value={Math.round(distMult * 100)}
              onChange={(e) => setDistMult(Number(e.target.value) / 100)}
              className="w-full accent-[#FFD93D] cursor-pointer"
            />
          </label>
        </div>

        {/* Views */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <TidesSpace moonAngleDeg={angleDeg} moonDistMult={distMult} />
            <p className="pb-1 text-center text-xs text-white/40">우주에서 보기</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0d1b3e] p-3">
            <TidesBeach h={h} />
            <p className="pb-1 text-center text-xs text-white/40">도넛항 해변에서 보기</p>
          </div>
        </div>

        {/* Status card */}
        <div
          className="mt-6 rounded-2xl border p-6 text-center"
          style={{ borderColor: "#00ccff50", background: "#00ccff10" }}
        >
          <p className="text-4xl">{state.emoji}</p>
          <p
            className="mt-2 text-3xl font-black"
            style={{ fontFamily: "'Fredoka', cursive", color: "#00ccff" }}
          >
            지금 도넛항은 {state.label}!
          </p>
          <p className="mt-1 text-white/70">{state.description}</p>
          {/* level gauge */}
          <div className="mx-auto mt-4 h-3 w-56 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2E86DE] to-[#00ccff] transition-none"
              style={{ width: `${Math.round(((u + 0.5) / 1.5) * 100)}%` }}
            />
          </div>
        </div>

        {/* Learn card */}
        <section className="mt-6 rounded-2xl border border-[#FFD93D]/30 bg-[#FFD93D]/10 p-6">
          <h2
            className="text-2xl font-black"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            🌙 왜 밀과 밀려나는 물이 생길까?
          </h2>
          <p className="mt-3 leading-relaxed text-white/85">
            달이 지구를 살짝 잡아당겨요. 바닷물도 함께 끌려서{" "}
            <b className="text-[#00ccff]">달 쪽</b>으로 몰리는데, 신기하게도{" "}
            <b className="text-[#00ccff]">정반대쪽</b>에도 바닷물이 몰려요!
            그래서 둥근 바다가 달쪽과 반대쪽, 두 곳으로 볼록해져요.
          </p>
          <p className="mt-2 leading-relaxed text-white/85">
            볼록해진 곳이 <b>만조</b>, 살짝 들어간 곳이 <b>간조</b>예요. 달이 지구를 한 바퀴
            돌면 도넛항은 만조를 <b>두 번</b> 만나요!
          </p>
          <p className="mt-2 leading-relaxed text-white/60">
            달 거리 슬라이더를 움직여 보세요 — 달이 가까워지면 당기는 힘이 훨씬 세져서
            물 때가 훨씬 커져요. 🌊
          </p>
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Build** — `npm run build`, `/tides` present.
- [ ] **Step 3: Commit** — `git commit -m "feat(tides): add /tides learning page"`

---

## Task 5: gino menu entry

**Files:**
- Modify: `src/data/gino.ts`

- [ ] **Step 1:** append to `ginoContents`:
```ts
  {
    slug: "moon-tides",
    name: "달과 바다",
    href: "/tides",
    emoji: "🌊",
    color: "#00ccff",
  },
```

- [ ] **Step 2: Build** — success.
- [ ] **Step 3: Commit** — `git commit -m "feat(tides): list 달과 바다 in the gino menu"`

---

## Task 6: Final verification

- [ ] `npm test` — all pass.
- [ ] `npm run build` — success.
- [ ] Browser: `/tides` loads in 만조 (moon at top); auto-play makes the sea rise/fall; position slider pauses; distance slider changes swing; gino dropdown lists 달과 바다 and links correctly.
