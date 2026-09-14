"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import JejuSeaMap from "@/components/JejuSeaMap";
import { fishForStageIndex, yearlyAverages, type DailyRow } from "@/lib/sea";

function iso(d: Date): string {
  // Local date parts — toISOString() would shift KST midnight back a day
  // into the previous year (UTC).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function SeaPage() {
  const [rows, setRows] = useState<DailyRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [yearIndex, setYearIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    const end = new Date();
    const start = new Date(end.getFullYear() - 3, 0, 1); // Jan 1, three years back
    fetch(
      `https://marine-api.open-meteo.com/v1/marine?latitude=33.35&longitude=126.55` +
        `&start_date=${iso(start)}&end_date=${iso(end)}` +
        `&daily=sea_surface_temperature_max,sea_surface_temperature_min&timezone=Asia%2FSeoul`,
    )
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const time: string[] = data.daily?.time ?? [];
        const tmax = (data.daily?.sea_surface_temperature_max ?? []) as (
          | number
          | null
        )[];
        const tmin = (data.daily?.sea_surface_temperature_min ?? []) as (
          | number
          | null
        )[];
        setRows(
          time.map((date, i) => ({
            date,
            tmax: tmax[i] ?? null,
            tmin: tmin[i] ?? null,
          })),
        );
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const years = useMemo(() => (rows ? yearlyAverages(rows) : []), [rows]);

  // Default to the latest year once data arrives.
  const effectiveIndex =
    yearIndex ?? (years.length ? years.length - 1 : 0);
  const selected = years[effectiveIndex];
  const prev = years[effectiveIndex - 1];
  const delta = selected && prev ? selected.avg - prev.avg : null;

  const maxAvg = Math.max(...years.map((y) => y.avg), 1);
  const minAvg = Math.min(...years.map((y) => y.avg), 0);
  const currentYear = new Date().getFullYear();

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
        </div>

        <header className="mb-8 text-center">
          <h1
            className="text-4xl font-black leading-none md:text-6xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#2fae9d",
              textShadow:
                "0 0 20px rgba(47,174,157,0.5), 3px 3px 0px #FFD93D",
            }}
          >
            WARMING SEA
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            제주 바다, 3년의 변화 🌊🌡️
          </p>
        </header>

        {error && (
          <div className="rounded-2xl border border-[#FF6B9D]/40 bg-[#FF6B9D]/10 p-6 text-center">
            <p className="text-[#FF6B9D]">바다 데이터를 못 불러왔어요 ({error})</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-3 rounded-full bg-white/10 px-5 py-2 text-sm font-bold text-white/80 hover:bg-white/20 cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        )}

        {!error && !rows && (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center text-white/50">
            🌊 3년 치 바다 데이터를 불러오는 중...
          </div>
        )}

        {rows && selected && (
          <>
            {/* year stepper */}
            <div className="mb-5 flex flex-wrap justify-center gap-2">
              {years.map((y, i) => {
                const partial = y.year === currentYear;
                return (
                  <button
                    key={y.year}
                    type="button"
                    onClick={() => setYearIndex(i)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition cursor-pointer ${
                      effectiveIndex === i
                        ? "bg-[#2fae9d] text-black"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {y.year}
                    {partial && " · 현재까지"}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              {/* map */}
              <div className="lg:col-span-3">
                <div className="rounded-2xl border border-white/10 bg-[#0d1030] p-3">
                  <JejuSeaMap
                    yearAvg={selected.avg}
                    fish={fishForStageIndex(effectiveIndex)}
                  />
                </div>
              </div>

              {/* right column: verdict + trend + fish */}
              <div className="space-y-5 lg:col-span-2">
                <div
                  className="rounded-2xl border p-5 text-center"
                  style={{ borderColor: "#2fae9d50", background: "#2fae9d10" }}
                >
                  <p className="text-sm text-white/50">
                    {selected.year}
                    {selected.year === currentYear ? " (1월~현재)" : ""} 연평균
                    수온
                  </p>
                  <p
                    className="mt-1 text-5xl font-black"
                    style={{
                      fontFamily: "var(--font-space-grotesk)",
                      color: "#2fae9d",
                    }}
                  >
                    {selected.avg.toFixed(1)}°C
                  </p>
                  {delta !== null && (
                    <p
                      className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-black ${
                        delta >= 0
                          ? "bg-[#FF6B6B]/20 text-[#FF6B6B]"
                          : "bg-[#4895ef]/20 text-[#4895ef]"
                      }`}
                    >
                      전년 대비 {delta >= 0 ? "▲" : "▼"}{" "}
                      {Math.abs(delta).toFixed(2)}°C
                    </p>
                  )}
                </div>

                {/* trend chart */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">
                    연평균 수온 추이
                  </p>
                  <div className="flex h-28 items-end gap-2">
                    {years.map((y, i) => {
                      const hPct =
                        ((y.avg - minAvg) / (maxAvg - minAvg || 1)) * 80 + 20;
                      return (
                        <button
                          key={y.year}
                          type="button"
                          onClick={() => setYearIndex(i)}
                          className="flex flex-1 flex-col items-center justify-end gap-1 cursor-pointer"
                          aria-label={`${y.year}년 평균 ${y.avg.toFixed(1)}도`}
                        >
                          <span className="font-mono text-[10px] text-white/60">
                            {y.avg.toFixed(1)}
                          </span>
                          <div
                            className={`w-full rounded-t-md transition-all ${
                              effectiveIndex === i ? "bg-[#FFD93D]" : "bg-[#2fae9d]/60"
                            }`}
                            style={{ height: `${hPct}%` }}
                          />
                          <span className="text-[10px] text-white/50">
                            {String(y.year).slice(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* fishery cards */}
                <div>
                  <p className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white/40">
                    <span>그해 바다의 어자원</span>
                    <span className="normal-case">
                      ↗ 등장 · ↘ 감소 · • 유지
                    </span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {fishForStageIndex(effectiveIndex).map((f) => {
                      const color =
                        f.trend === "in"
                          ? "#FFD93D"
                          : f.trend === "out"
                            ? "#FF6B9D"
                            : "#FEFEFE";
                      const badge =
                        f.trend === "in"
                          ? "↗ 따뜻한 바다 선호"
                          : f.trend === "out"
                            ? "↘ 시원한 바다로 이동"
                            : "• 여전히 제주의 주인공";
                      return (
                        <div
                          key={f.name}
                          className="rounded-xl border border-white/10 bg-black/30 p-3"
                        >
                          <p className="text-2xl">{f.emoji}</p>
                          <p className="mt-1 font-black" style={{ color }}>
                            {f.name}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-snug text-white/60">
                            {badge}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-white/40">
                    ※ 어종 카드는 실측 어획량이 아닌, 언론에 보도된 제주 연안
                    추세를 바탕으로 만든 교육용 시나리오예요.
                  </p>
                </div>
              </div>
            </div>

            {/* learn card */}
            <section className="mt-8 rounded-2xl border border-[#2fae9d]/30 bg-[#2fae9d]/10 p-6">
              <h2
                className="text-2xl font-black"
                style={{ fontFamily: "'Fredoka', cursive", color: "#2fae9d" }}
              >
                🌍 왜 바다가 따뜻해질까?
              </h2>
              <p className="mt-3 leading-relaxed text-white/85">
                지구가 점점 따뜻해지면서 바다도 함께 따뜻해져요. 물고기들은{" "}
                <b>자기에게 딱 맞는 온도</b>의 바다를 찾아 이동해요. 그래서
                따뜻한 제주 바다에서 변화가 가장 먼저 나타나요 — 시원한 바다를
                좋아하던 친구들은 떠나고, 따뜻한 바다를 좋아하는 새 친구들이
                찾아와요.
              </p>
              <p className="mt-2 leading-relaxed text-white/60">
                등고선을 따라 색이 해마다 따뜻해지는 것을 눈으로 확인해
                보세요! 🌡️
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
