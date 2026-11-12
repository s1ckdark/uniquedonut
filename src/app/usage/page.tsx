"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  aggregateByHour,
  aggregateByMonth,
  aggregateByWeek,
  buildDailyReport,
  calendarWeeks,
  fmtTokens,
  fmtUsd,
  providerColor,
  type DailyReport,
  type UsageSnapshot,
} from "@/lib/usage";
import { CountUp, GrowBar, Reveal, useInView } from "@/components/ScrollFX";

const DOW_LABELS = ["", "월", "화", "수", "목", "금", "토", "일"];
const TREND_DAYS = 90;
const GRANULARITIES = [
  { key: "hour", label: "시간별" },
  { key: "day", label: "일별" },
  { key: "week", label: "주간별" },
  { key: "month", label: "월별" },
] as const;
type Granularity = (typeof GRANULARITIES)[number]["key"];

/** Vertical mini bar row (hour view) that grows on scroll-in. */
function VerticalBars({
  values,
  labels,
  color,
}: {
  values: number[];
  labels: string[];
  color: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const max = Math.max(...values, 1);
  return (
    <div ref={ref} className="mt-4 flex h-44 items-end gap-1">
      {values.map((v, i) => (
        <div
          key={i}
          title={labels[i]}
          className="flex-1 rounded-t-[3px] transition-[height] duration-700 ease-out"
          style={{
            height: inView ? `${Math.max(2, (v / max) * 100)}%` : "0%",
            background: color,
            transitionDelay: `${i * 25}ms`,
          }}
        />
      ))}
    </div>
  );
}

/** Log-ish color bins for heatmap cells (0..4). */
function heatBin(tokens: number, max: number): number {
  if (tokens <= 0 || max <= 0) return 0;
  const ratio = tokens / max;
  if (ratio > 0.6) return 4;
  if (ratio > 0.3) return 3;
  if (ratio > 0.12) return 2;
  return 1;
}

const HEAT_BG = [
  "bg-white/[0.06]",
  "bg-[#4D96FF]/25",
  "bg-[#4D96FF]/50",
  "bg-[#4D96FF]/75",
  "bg-[#4D96FF]",
];

/** Last N days area chart that draws itself on scroll. */
function TrendChart({ days }: { days: Array<{ day: string; tokens: number }> }) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    // draw on the next frame after mount (Reveal parent gates visibility)
    const t = setTimeout(() => setDrawn(true), 150);
    return () => clearTimeout(t);
  }, []);
  if (days.length < 2) return null;
  const w = 720;
  const h = 160;
  const max = Math.max(...days.map((d) => d.tokens), 1);
  const step = w / (days.length - 1);
  const pts = days.map((d, i) => {
    const x = i * step;
    const y = h - (d.tokens / max) * (h - 12) - 6;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M ${pts.join(" L ")}`;
  const area = `${line} L ${w},${h} L 0,${h} Z`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-4 w-full"
      style={{ overflow: "visible" }}
      role="img"
      aria-label="최근 90일 토큰 추이"
    >
      <path
        d={area}
        fill="#4D96FF"
        opacity={drawn ? 0.18 : 0}
        style={{ transition: "opacity 1.2s ease 0.6s" }}
      />
      <path
        d={line}
        fill="none"
        stroke="#4D96FF"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{
          strokeDasharray: 2400,
          strokeDashoffset: drawn ? 0 : 2400,
          transition: "stroke-dashoffset 1.6s ease-out",
        }}
      />
    </svg>
  );
}

export default function UsagePage() {
  const [snapshot, setSnapshot] = useState<UsageSnapshot | null>(null);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [gran, setGran] = useState<Granularity>("day");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/usage")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as {
          snapshot: UsageSnapshot | null;
          report?: DailyReport | null;
        };
      })
      .then((data) => {
        if (cancelled) return;
        if (data.snapshot) {
          setSnapshot(data.snapshot);
          setReport(data.report ?? null);
          setState("ready");
        } else {
          setState("empty");
        }
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const weeks = useMemo(
    () => (snapshot ? calendarWeeks(snapshot.daily) : []),
    [snapshot],
  );
  const maxDaily = useMemo(
    () => Math.max(...(snapshot?.daily.map((d) => d.tokens) ?? [0]), 1),
    [snapshot],
  );
  const trendDays = useMemo(() => {
    if (!snapshot) return [];
    const sorted = [...snapshot.daily].sort((a, b) => a.day.localeCompare(b.day));
    return sorted.slice(-TREND_DAYS);
  }, [snapshot]);
  const providerTotal = useMemo(
    () => snapshot?.providers.reduce((a, p) => a + p.tokens, 0) ?? 0,
    [snapshot],
  );
  const maxModel = useMemo(
    () => Math.max(...(snapshot?.models.map((m) => m.tokens) ?? [0]), 1),
    [snapshot],
  );
  const heatIndex = useMemo(() => {
    const map = new Map<string, number>();
    for (const cell of snapshot?.heatmap ?? []) map.set(`${cell.dow}:${cell.hour}`, cell.tokens);
    return map;
  }, [snapshot]);
  const maxHeat = useMemo(
    () => Math.max(...(snapshot?.heatmap.map((c) => c.tokens) ?? [0]), 1),
    [snapshot],
  );
  const hourBars = useMemo(
    () => aggregateByHour(snapshot?.heatmap ?? []),
    [snapshot],
  );
  const weekBars = useMemo(
    () => aggregateByWeek(snapshot?.daily ?? []).slice(-16),
    [snapshot],
  );
  const monthBars = useMemo(
    () => aggregateByMonth(snapshot?.daily ?? []),
    [snapshot],
  );

  const syncedKst = snapshot
    ? snapshot.syncedAt.replace("T", " ").replace(/([+-]\d{2}:\d{2}|Z)$/, " KST")
    : "";

  return (
    <div className="min-h-screen bg-[#12081F] text-[#FEFEFE]">
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-10 flex items-center justify-between">
          <Link
            href="/shop"
            className="rounded-full bg-[#4D96FF]/15 px-4 py-2 text-sm font-bold text-[#4D96FF] transition hover:scale-105"
          >
            ← Shop
          </Link>
          <span className="rounded-full border border-[#FFD93D]/40 bg-[#FFD93D]/10 px-3 py-1 text-xs font-bold text-[#FFD93D]">
            $ API 환산 추정
          </span>
        </div>

        <header className="mb-12 text-center">
          <p className="text-5xl">⚡</p>
          <h1
            className="mt-4 text-4xl font-black md:text-5xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#4D96FF",
              textShadow: "0 0 20px rgba(77,150,255,0.5), 3px 3px 0px #FFD93D",
            }}
          >
            TOKEN BOARD
          </h1>
          <p
            className="mt-3 text-lg font-bold"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            내 AI 서비스 사용량 리포트
          </p>
        </header>

        {state === "loading" && (
          <p className="text-center text-white/50">불러오는 중…</p>
        )}

        {state === "error" && (
          <p className="text-center text-[#FF6B9D]">불러오기 실패: {error}</p>
        )}

        {state === "empty" && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            <p className="text-5xl">🛰️</p>
            <p className="mt-4 text-lg font-bold text-white/80">
              아직 첫 스냅샷이 도착하지 않았어요
            </p>
            <p className="mt-2 text-sm text-white/50">
              매일 자정(한국 시간) 토큰 사용량이 자동으로 올라옵니다 — racknerd
              적재 작업이 한 번 실행되면 차트가 채워집니다
            </p>
          </div>
        )}

        {state === "ready" && snapshot && (
          <>
            {/* ---------- sync header + totals ---------- */}
            <Reveal>
              <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/50">
                  <span className="font-mono">
                    마지막 갱신 {syncedKst} · {snapshot.rows.toLocaleString("ko-KR")}행
                    · 단가 기준 {snapshot.pricingAsOf}
                  </span>
                  {snapshot.partial && (
                    <span className="rounded-full bg-[#FF8C42]/15 px-3 py-1 font-bold text-[#FF8C42]">
                      ⚠ 일부 기기 미수집
                    </span>
                  )}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-6 text-center">
                  <div>
                    <p className="text-sm font-bold text-white/50">총 토큰</p>
                    <p className="mt-1 text-4xl font-black text-[#4D96FF]">
                      <CountUp to={snapshot.totalTokens} format={fmtTokens} />
                    </p>
                    <p className="mt-1 font-mono text-xs text-white/40">
                      {snapshot.firstDay} ~ {snapshot.lastDay}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/50">
                      추정 비용 (API 환산)
                    </p>
                    <p className="mt-1 text-4xl font-black text-[#FFD93D]">
                      <CountUp
                        to={snapshot.totalUsd}
                        format={(n) => fmtUsd(n)}
                      />
                    </p>
                    <p className="mt-1 font-mono text-xs text-white/40">
                      실제 청구액이 아닌 정가 환산 추정치
                    </p>
                  </div>
                </div>
              </section>
            </Reveal>

            {/* ---------- daily report (00:00 자동 작성) ---------- */}
            {report && (
              <Reveal>
                <section className="mt-6 rounded-3xl border border-[#FFD93D]/25 bg-[#FFD93D]/[0.07] p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black tracking-widest text-[#FFD93D]">
                      🪪 일일 리포트 · {report.day}
                    </p>
                    <span className="text-[10px] text-white/40">
                      매일 00:00 자정 적재와 함께 자동 작성
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
                    <p className="text-2xl font-black text-white">
                      {fmtTokens(report.tokens)} 토큰
                      {report.deltaPct !== null && (
                        <span
                          className="ml-2 rounded-full px-2 py-0.5 align-middle text-sm font-bold"
                          style={{
                            background:
                              report.deltaPct >= 0 ? "#FF8C4222" : "#6BCB7722",
                            color: report.deltaPct >= 0 ? "#FF8C42" : "#6BCB77",
                          }}
                        >
                          {report.deltaPct >= 0 ? "▲" : "▼"}{" "}
                          {Math.abs(report.deltaPct).toFixed(0)}%
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-sm text-white/60">
                      {fmtUsd(report.usd)}
                      {!report.costComplete && " (부분 합계)"}
                    </p>
                    {report.prev7Avg !== null && (
                      <p className="font-mono text-xs text-white/40">
                        직전 7일 평균 {fmtTokens(report.prev7Avg)}
                      </p>
                    )}
                    {report.topModel && (
                      <p className="text-sm text-white/70">
                        최근 30일 최다 모델{" "}
                        <b style={{ color: providerColor(report.topModel.provider) }}>
                          {report.topModel.model}
                        </b>
                      </p>
                    )}
                  </div>
                </section>
              </Reveal>
            )}

            {/* ---------- calendar heatmap ---------- */}
            <Reveal>
              <section className="mt-16">
                <h2
                  className="text-2xl font-black"
                  style={{ fontFamily: "'Fredoka', cursive", color: "#6BCB77" }}
                >
                  사용 잔디 🌱
                </h2>
                <p className="mt-1 text-sm text-white/50">
                  하루 토큰량 — 진할수록 많이 사용 (클린 커서에 날짜 표시)
                </p>
                <div className="mt-6 overflow-x-auto pb-2">
                  <div className="flex gap-[3px]">
                    {weeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-[3px]">
                        {week.map((cell, ci) => {
                          const bin = cell ? heatBin(cell.tokens, maxDaily) : -1;
                          return (
                            <div
                              key={ci}
                              title={
                                cell
                                  ? `${cell.day} · ${fmtTokens(cell.tokens)} 토큰${cell.usd !== null ? ` · ${fmtUsd(cell.usd)}` : ""}`
                                  : undefined
                              }
                              className={`h-[11px] w-[11px] rounded-[2px] ${bin >= 0 ? HEAT_BG[bin] : "bg-transparent"}`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </Reveal>

            {/* ---------- trend with granularity toggle ---------- */}
            <Reveal>
              <section className="mt-16">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2
                    className="text-2xl font-black"
                    style={{ fontFamily: "'Fredoka', cursive", color: "#4D96FF" }}
                  >
                    사용 추이 📈
                  </h2>
                  <div className="flex gap-1 rounded-full bg-white/5 p-1">
                    {GRANULARITIES.map((g) => (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => setGran(g.key)}
                        className={`rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                          gran === g.key
                            ? "bg-[#4D96FF] text-black"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {gran === "hour" && (
                  <>
                    <p className="mt-1 text-sm text-white/50">
                      시간대별 총 사용량 (전체 기간 합산 · Z.AI 제외)
                    </p>
                    <VerticalBars
                      values={hourBars.map((h) => h.tokens)}
                      labels={hourBars.map((h) => `${h.hour}시 · ${fmtTokens(h.tokens)} 토큰`)}
                      color="#4D96FF"
                    />
                    <div className="mt-1 flex justify-between font-mono text-[10px] text-white/30">
                      <span>0시</span>
                      <span>12시</span>
                      <span>23시</span>
                    </div>
                  </>
                )}

                {gran === "day" && (
                  <>
                    <p className="mt-1 text-sm text-white/50">
                      최근 {TREND_DAYS}일 (전체 기간은 잔디 캘린더에서)
                    </p>
                    <TrendChart days={trendDays} />
                    <div className="mt-1 flex justify-between font-mono text-xs text-white/40">
                      <span>{trendDays[0]?.day}</span>
                      <span>최고 {fmtTokens(maxDaily)} /일</span>
                      <span>{trendDays[trendDays.length - 1]?.day}</span>
                    </div>
                  </>
                )}

                {gran === "week" && (
                  <>
                    <p className="mt-1 text-sm text-white/50">
                      주간별 합계 — 최근 {weekBars.length}주 (월요일 시작)
                    </p>
                    <div className="mt-6 space-y-4">
                      {weekBars.map((w, i) => (
                        <GrowBar
                          key={w.weekStart}
                          pct={(w.tokens / Math.max(...weekBars.map((x) => x.tokens), 1)) * 100}
                          color="#4D96FF"
                          heightClass="h-5"
                          delay={i * 50}
                          label={`${w.weekStart.slice(5).replace("-", "/")}주`}
                          valueLabel={`${fmtTokens(w.tokens)} · ${fmtUsd(w.usd)}`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {gran === "month" && (
                  <>
                    <p className="mt-1 text-sm text-white/50">
                      월별 합계 — 전체 {monthBars.length}개월
                    </p>
                    <div className="mt-6 space-y-4">
                      {monthBars.map((m, i) => (
                        <GrowBar
                          key={m.month}
                          pct={(m.tokens / Math.max(...monthBars.map((x) => x.tokens), 1)) * 100}
                          color="#9775FA"
                          heightClass="h-5"
                          delay={i * 50}
                          label={m.month}
                          valueLabel={`${fmtTokens(m.tokens)} · ${fmtUsd(m.usd)}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </section>
            </Reveal>

            {/* ---------- providers (30d) ---------- */}
            <Reveal>
              <section className="mt-16">
                <h2
                  className="text-2xl font-black"
                  style={{ fontFamily: "'Fredoka', cursive", color: "#FF6B9D" }}
                >
                  최근 30일 제공자별 🤖
                </h2>
                <div className="mt-6 space-y-6">
                  {snapshot.providers.map((p, i) => (
                    <GrowBar
                      key={p.provider}
                      pct={(p.tokens / (providerTotal || 1)) * 100}
                      color={providerColor(p.provider)}
                      heightClass="h-7"
                      delay={i * 80}
                      label={p.provider}
                      valueLabel={`${fmtTokens(p.tokens)} (${((p.tokens / (providerTotal || 1)) * 100).toFixed(1)}%) · ${fmtUsd(p.usd)}`}
                    />
                  ))}
                </div>
              </section>
            </Reveal>

            {/* ---------- weekday x hour heatmap ---------- */}
            <Reveal>
              <section className="mt-16">
                <h2
                  className="text-2xl font-black"
                  style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
                >
                  언제 제일 쓸까? ⏰
                </h2>
                <p className="mt-1 text-sm text-white/50">
                  요일×시간 사용량 (Z.AI는 시간 정보가 없어 제외)
                </p>
                <div className="mt-6 overflow-x-auto pb-2">
                  <div className="min-w-[640px]">
                    <div className="mb-1 flex gap-[3px] pl-8">
                      {Array.from({ length: 24 }, (_, h) => (
                        <span
                          key={h}
                          className="w-[22px] text-center font-mono text-[9px] text-white/30"
                        >
                          {h % 3 === 0 ? h : ""}
                        </span>
                      ))}
                    </div>
                    {[1, 2, 3, 4, 5, 6, 7].map((dow) => (
                      <div key={dow} className="mb-[3px] flex items-center gap-[3px]">
                        <span className="w-8 font-mono text-[10px] text-white/40">
                          {DOW_LABELS[dow]}
                        </span>
                        {Array.from({ length: 24 }, (_, h) => {
                          const tokens = heatIndex.get(`${dow}:${h}`) ?? 0;
                          const bin = heatBin(tokens, maxHeat);
                          return (
                            <div
                              key={h}
                              title={`${DOW_LABELS[dow]} ${h}시 · ${fmtTokens(tokens)} 토큰`}
                              className={`h-[22px] w-[22px] rounded-[3px] ${HEAT_BG[bin]}`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </Reveal>

            {/* ---------- models ---------- */}
            <Reveal>
              <section className="mt-16">
                <h2
                  className="text-2xl font-black"
                  style={{ fontFamily: "'Fredoka', cursive", color: "#6BCB77" }}
                >
                  모델 랭킹 🏆
                </h2>
                <div className="mt-6 space-y-5">
                  {snapshot.models.map((m, i) => (
                    <GrowBar
                      key={`${m.provider}/${m.model}`}
                      pct={(m.tokens / maxModel) * 100}
                      color={providerColor(m.provider)}
                      heightClass="h-5"
                      delay={i * 60}
                      label={m.model}
                      valueLabel={`${fmtTokens(m.tokens)} · ${fmtUsd(m.usd)}`}
                    />
                  ))}
                </div>
              </section>
            </Reveal>

            {/* ---------- caveats ---------- */}
            <Reveal>
              <footer className="mt-16 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-xs leading-relaxed text-white/40">
                <p>
                  · 금액은 구독 사용량을 API 정가로 환산한 추정치이며 단가 미공개
                  모델이 포함된 날은 부분 합계입니다.
                </p>
                <p>· Grok(grok-4.7-build) 수치는 실제보다 약 8% 낮게 집계됩니다.</p>
                <p>
                  · 데이터 범위 {snapshot.firstDay}부터 — 초기 구간은 원본 로그가
                  일부만 남아 듬성할 수 있습니다.
                </p>
                <p>
                  · 집계에는 제공자·모델·토큰 수·추정 비용만 담겨 있고 세션·기기
                  정보는 없습니다.
                </p>
              </footer>
            </Reveal>
          </>
        )}
      </main>
    </div>
  );
}
