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
              textShadow:
                "0 0 20px rgba(0,204,255,0.5), 3px 3px 0px #FF6B9D",
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
            <span className="w-20 shrink-0 text-sm font-bold text-white/70">
              달 위치
            </span>
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
            <span className="w-20 shrink-0 text-sm font-bold text-white/70">
              달 거리
            </span>
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
            <p className="pb-1 text-center text-xs text-white/40">
              우주에서 보기
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0d1b3e] p-3">
            <TidesBeach h={h} />
            <p className="pb-1 text-center text-xs text-white/40">
              도넛항 해변에서 보기
            </p>
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
              className="h-full rounded-full bg-gradient-to-r from-[#2E86DE] to-[#00ccff]"
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
            🌙 왜 물이 밀리고 빠질까?
          </h2>
          <p className="mt-3 leading-relaxed text-white/85">
            달이 지구를 살짝 잡아당겨요. 바닷물도 함께 끌려서{" "}
            <b className="text-[#00ccff]">달 쪽</b>으로 몰리는데, 신기하게도{" "}
            <b className="text-[#00ccff]">정반대쪽</b>에도 바닷물이 몰려요!
            그래서 둥근 바다가 달쪽과 반대쪽, 두 곳으로 볼록해져요.
          </p>
          <p className="mt-2 leading-relaxed text-white/85">
            볼록해진 곳이 <b>만조</b>, 살짝 들어간 곳이 <b>간조</b>예요. 달이
            지구를 한 바퀴 돌면 도넛항은 만조를 <b>두 번</b> 만나요!
          </p>
          <p className="mt-2 leading-relaxed text-white/60">
            달 거리 슬라이더를 움직여 보세요 — 달이 가까워지면 당기는 힘이 훨씬
            세져서 물 때가 훨씬 커져요. 🌊
          </p>
        </section>
      </main>
    </div>
  );
}
