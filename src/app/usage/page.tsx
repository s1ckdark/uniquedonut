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
  type DailyReport,
  type RankedParticipant,
  type UsageSnapshot,
} from "@/lib/usage";
import { CountUp, GrowBar, Reveal, useInView } from "@/components/ScrollFX";

const MONO = "var(--font-geist-mono, ui-monospace, SFMono-Regular, monospace)";
const DOW_LABELS = ["", "월", "화", "수", "목", "금", "토", "일"];
const GRANULARITIES = [
  { key: "hour", label: "시간별" },
  { key: "day", label: "일별" },
  { key: "week", label: "주간별" },
  { key: "month", label: "월별" },
] as const;
type Granularity = (typeof GRANULARITIES)[number]["key"];
const PERIODS = [
  { key: "d1", days: 1, label: "1일" },
  { key: "w1", days: 7, label: "1주" },
  { key: "m1", days: 31, label: "1달" },
  { key: "m3", days: 92, label: "3달" },
  { key: "all", days: Infinity, label: "전체" },
] as const;
type Period = (typeof PERIODS)[number]["key"];
/** "전체"일 때 일별 목록 상한 — 최대 800일이라 최근치만 노출 */
const DAY_ROW_CAP = 120;

const HEAT_BG = [
  "bg-white/[0.06]",
  "bg-white/25",
  "bg-white/45",
  "bg-white/65",
  "bg-white/90",
];

/** Log-ish color bins for heatmap cells (0..4). */
function heatBin(tokens: number, max: number): number {
  if (tokens <= 0 || max <= 0) return 0;
  const ratio = tokens / max;
  if (ratio > 0.6) return 4;
  if (ratio > 0.3) return 3;
  if (ratio > 0.12) return 2;
  return 1;
}

/** Vertical mini bar row (hour view) that grows on scroll-in. */
function VerticalBars({
  values,
  labels,
}: {
  values: number[];
  labels: string[];
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const max = Math.max(...values, 1);
  return (
    <div ref={ref} className="mt-4 flex h-44 items-end gap-1">
      {values.map((v, i) => (
        <div
          key={i}
          title={labels[i]}
          className="flex-1 rounded-t-[2px] bg-white/80 transition-[height] duration-700 ease-out"
          style={{
            height: inView ? `${Math.max(2, (v / max) * 100)}%` : "0%",
            transitionDelay: `${i * 25}ms`,
          }}
        />
      ))}
    </div>
  );
}

/** Hover-interactive point chart (일별/월별): draw-on line + data points
 *  with a bubble tooltip on hover. Points thin out automatically for long
 *  ranges; the focus dot + bubble work for any density. */
function HoverPointChart({
  points,
  tickEvery = 0,
}: {
  points: Array<{ label: string; tokens: number; usd: number | null }>;
  /** x축 라벨 간격(포인트 수) — 0이면 자동 */
  tickEvery?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.25);
  const [drawn, setDrawn] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setDrawn(true), 150);
    return () => clearTimeout(t);
  }, [inView]);
  if (points.length < 2) return null;

  const w = 720;
  const h = 150;
  const axisH = 18;
  const max = Math.max(...points.map((p) => p.tokens), 1);
  const step = w / (points.length - 1);
  const xy = points.map((p, i) => ({
    x: i * step,
    y: h - (p.tokens / max) * (h - 14) - 7,
  }));
  const line = `M ${xy.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" L ")}`;
  const area = `${line} L ${w},${h} L 0,${h} Z`;
  const showDots = points.length <= 92;
  const dotR = points.length > 45 ? 2 : 3.5;
  const tick = tickEvery > 0 ? tickEvery : Math.max(1, Math.ceil(points.length / 6));

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(ratio * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, idx)));
  };

  const hp = hover !== null ? xy[hover] : null;
  const hpData = hover !== null ? points[hover] : null;
  // 버블 위치: 위쪽 60% 영역이면 포인트 아래로, 아니면 위로 — 좌우는 8~92%로 클램프
  const bubbleLeft = hp ? Math.min(92, Math.max(8, (hp.x / w) * 100)) : 0;
  const bubbleBelow = hp ? hp.y / h > 0.6 : false;

  return (
    <div
      ref={ref}
      className="relative mt-4 cursor-crosshair"
      onPointerMove={onMove}
      onPointerLeave={() => setHover(null)}
    >
      <svg
        viewBox={`0 0 ${w} ${h + axisH}`}
        className="block w-full"
        role="img"
        aria-label="기간별 토큰 추이"
      >
        <path
          d={area}
          fill="#FFFFFF"
          opacity={drawn ? 0.12 : 0}
          style={{ transition: "opacity 1.2s ease 0.6s" }}
        />
        <path
          d={line}
          fill="none"
          stroke="#FEFEFE"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{
            strokeDasharray: 2400,
            strokeDashoffset: drawn ? 0 : 2400,
            transition: "stroke-dashoffset 1.6s ease-out",
          }}
        />
        {showDots &&
          xy.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={dotR}
              fill="#0A0A0A"
              stroke="#FEFEFE"
              strokeWidth={1.5}
              opacity={drawn ? 1 : 0}
              style={{ transition: "opacity 0.6s ease 0.9s" }}
            />
          ))}
        {hp && (
          <>
            <line
              x1={hp.x}
              y1={hp.y}
              x2={hp.x}
              y2={h}
              stroke="#FFFFFF"
              strokeOpacity={0.35}
              strokeDasharray="3 3"
            />
            <circle cx={hp.x} cy={hp.y} r={5} fill="#FEFEFE" />
            <circle cx={hp.x} cy={hp.y} r={9} fill="#FEFEFE" opacity={0.2} />
          </>
        )}
        {points.map((p, i) =>
          i % tick === 0 || i === points.length - 1 ? (
            <text
              key={`t-${i}`}
              x={Math.min(w - 4, Math.max(4, xy[i].x))}
              y={h + axisH - 6}
              textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
              fontSize={9}
              fill="#52525B"
              style={{ fontFamily: "inherit" }}
            >
              {p.label.length > 7 ? p.label.slice(5) : p.label}
            </text>
          ) : null,
        )}
      </svg>
      {hp && hpData && (
        <div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-neutral-600 bg-[#18181B] px-2.5 py-1.5 text-[10px] leading-snug shadow-lg"
          style={{
            left: `${bubbleLeft}%`,
            top: `${(hp.y / (h + axisH)) * 100}%`,
            transform: bubbleBelow
              ? "translate(-50%, 14px)"
              : "translate(-50%, calc(-100% - 14px))",
          }}
        >
          <p className="font-bold text-neutral-400">{hpData.label}</p>
          <p className="text-white">
            {fmtTokens(hpData.tokens)} tokens · {fmtUsd(hpData.usd)}
          </p>
        </div>
      )}
    </div>
  );
}

/** KST 기준 오늘 YYYY-MM-DD — 스냅샷 날짜 체계(한국 시간)와 맞춘다 */
function kstToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** YYYY-MM-DD를 delta일만큼 이동 */
function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** 요일 라벨 — Date.getUTCDay()(0=일)를 DOW_LABELS(1=월) 체계로 변환 */
function weekdayKo(day: string): string {
  const js = new Date(`${day}T00:00:00Z`).getUTCDay();
  return DOW_LABELS[js === 0 ? 7 : js];
}

/** 1일(당일) 뷰 — 날짜를 좌우로 옮겨 하루 총액을 확인. 당일은 업로드 전이면 준비 중 표시 */
function DayNavigator({ snapshot }: { snapshot: UsageSnapshot }) {
  const [navDay, setNavDay] = useState<string>(() => kstToday());
  const sorted = useMemo(
    () => [...snapshot.daily].sort((a, b) => a.day.localeCompare(b.day)),
    [snapshot],
  );
  const point = sorted.find((d) => d.day === navDay);
  const prev = useMemo(
    () => sorted.filter((d) => d.day < navDay).at(-1),
    [sorted, navDay],
  );
  const today = kstToday();
  const isTodayOrFuture = navDay >= today;
  const weekday = weekdayKo(navDay);
  const deltaPct =
    point && prev && prev.tokens > 0
      ? ((point.tokens - prev.tokens) / prev.tokens) * 100
      : null;

  const arrowCls =
    "rounded-full border border-neutral-800 px-4 py-1.5 text-xs font-bold text-neutral-300 transition hover:border-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-neutral-800 disabled:hover:text-neutral-300 cursor-pointer";

  return (
    <div className="mt-4 rounded-xl border border-neutral-800 bg-[#0D0D0D] p-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          aria-label="하루 전으로 이동"
          disabled={navDay <= snapshot.firstDay}
          onClick={() => setNavDay((d) => shiftDay(d, -1))}
          className={arrowCls}
        >
          ← 하루 전
        </button>
        <p className="text-base font-black text-white md:text-lg">
          {navDay}
          <span className="ml-2 text-sm font-bold text-neutral-500">
            ({weekday})
          </span>
          {navDay === today && (
            <span className="ml-2 rounded-full border border-neutral-700 px-2 py-0.5 align-middle text-[10px] font-bold text-neutral-400">
              오늘
            </span>
          )}
        </p>
        <button
          type="button"
          aria-label="다음날로 이동"
          disabled={isTodayOrFuture}
          onClick={() => setNavDay((d) => shiftDay(d, +1))}
          className={arrowCls}
        >
          다음날 →
        </button>
      </div>

      {point ? (
        <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <p className="text-2xl font-black text-white md:text-3xl">
            {fmtTokens(point.tokens)}
            <span className="ml-2 text-sm text-neutral-500">tokens</span>
            {deltaPct !== null && (
              <span className="ml-2 rounded-full border border-neutral-700 px-2 py-0.5 align-middle text-xs font-bold text-neutral-400">
                {deltaPct >= 0 ? "▲" : "▼"} {Math.abs(deltaPct).toFixed(0)}%
              </span>
            )}
          </p>
          <p className="text-lg font-black text-white md:text-xl">
            {fmtUsd(point.usd)}
            <span className="ml-2 text-xs font-bold text-neutral-500">
              est. spend
            </span>
            {point.usd !== null && !point.costComplete && (
              <span className="ml-2 text-xs font-bold text-neutral-500">
                (부분 합계)
              </span>
            )}
          </p>
          {prev && (
            <p className="w-full text-[11px] text-neutral-600">
              전일 {prev.day} — {fmtTokens(prev.tokens)} 토큰 ·{" "}
              {fmtUsd(prev.usd)}
            </p>
          )}
        </div>
      ) : navDay > snapshot.lastDay ? (
        <div className="mt-5 rounded-lg border border-dashed border-neutral-800 px-4 py-6 text-center">
          <p className="text-sm font-bold text-neutral-300">
            ⏳ 데이터 준비 중
          </p>
          <p className="mt-2 text-xs leading-relaxed text-neutral-600">
            당일 사용량은 매일 자정(한국 시간)에 자동으로 올라와요
            <br />
            마지막 확정 데이터 — {snapshot.lastDay}
          </p>
          <button
            type="button"
            onClick={() => setNavDay(snapshot.lastDay)}
            className="mt-3 rounded-full border border-neutral-700 px-4 py-1.5 text-xs font-bold text-neutral-300 transition hover:border-neutral-500 hover:text-white cursor-pointer"
          >
            ← {snapshot.lastDay} 총액 보기
          </button>
        </div>
      ) : navDay < snapshot.firstDay ? (
        <p className="mt-5 text-center text-xs text-neutral-600">
          {snapshot.firstDay} 이전 날짜는 수집되지 않았어요
        </p>
      ) : (
        <p className="mt-5 text-center text-xs text-neutral-600">
          이 날짜는 수집 공백 구간이에요 — 좌우 화살표로 이동해 보세요
        </p>
      )}
    </div>
  );
}

/** 참여 신청 폼 + 운영자 승인 패널 (마스터 키는 세션에만 보관). */
interface AdminRequestRow {
  id: number;
  name: string;
  status: string;
  created_at: string;
}

function JoinPanel() {
  const [name, setName] = useState("");
  const [reqMsg, setReqMsg] = useState<string | null>(null);
  const [reqErr, setReqErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [showAdmin, setShowAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [reqs, setReqs] = useState<AdminRequestRow[]>([]);
  const [issued, setIssued] = useState<{ name: string; key: string } | null>(null);
  const [adminErr, setAdminErr] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("tokenholic-admin");
    if (saved) {
      setAuthed(true);
      setShowAdmin(true);
      void loadReqs(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadReqs(key: string) {
    try {
      const r = await fetch("/api/usage/requests", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = (await r.json()) as { requests: AdminRequestRow[] };
      setReqs(d.requests ?? []);
    } catch (e) {
      setAdminErr((e as Error).message);
    }
  }

  async function submitRequest() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSending(true);
    setReqErr(null);
    setReqMsg(null);
    try {
      const r = await fetch("/api/usage/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const d = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !d.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
      setReqMsg("신청 완료! 운영자 승인 후 키를 전달드릴게요");
      setName("");
    } catch (e) {
      setReqErr((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function adminLogin() {
    setAdminErr(null);
    try {
      const r = await fetch("/api/usage/requests", {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      sessionStorage.setItem("tokenholic-admin", adminKey);
      setAuthed(true);
      await loadReqs(adminKey);
    } catch (e) {
      setAdminErr("키가 올바르지 않습니다");
    }
  }

  async function decide(id: number, action: "approve" | "deny") {
    const key = sessionStorage.getItem("tokenholic-admin");
    if (!key) return;
    setAdminErr(null);
    setIssued(null);
    try {
      const r = await fetch("/api/usage/requests", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      const d = (await r.json()) as {
        ok?: boolean;
        error?: string;
        name?: string;
        key?: string;
      };
      if (!r.ok || !d.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
      if (action === "approve" && d.name && d.key) {
        setIssued({ name: d.name, key: d.key });
      }
      await loadReqs(key);
      // 상단 대기 배지 갱신 트리거
      window.dispatchEvent(new CustomEvent("tokenholic-requests"));
    } catch (e) {
      setAdminErr((e as Error).message);
    }
  }

  const inputCls =
    "rounded-lg border border-neutral-700 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-neutral-400";
  const btnCls =
    "rounded-lg bg-white px-4 py-2 text-xs font-bold text-black transition hover:opacity-80 disabled:opacity-40 cursor-pointer";

  return (
    <div className="mt-4 space-y-4">
      {/* 신청 폼 */}
      <div className="rounded-lg border border-neutral-800 bg-black/40 p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          $ join-request --name
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 16))}
            onKeyDown={(e) => e.key === "Enter" && submitRequest()}
            placeholder="랭킹에 표시될 이름 (1-16자)"
            className={`${inputCls} min-w-0 flex-1`}
            aria-label="참여 신청 이름"
          />
          <button type="button" onClick={submitRequest} disabled={sending || !name.trim()} className={btnCls}>
            {sending ? "전송 중…" : "✋ 참여 신청"}
          </button>
        </div>
        {reqMsg && <p className="mt-2 text-[11px] text-white">{reqMsg}</p>}
        {reqErr && <p className="mt-2 text-[11px] text-red-400">{reqErr}</p>}
      </div>

      {/* 운영자 패널 */}
      <div className="rounded-lg border border-dashed border-neutral-800 p-4">
        <button
          type="button"
          onClick={() => setShowAdmin((s) => !s)}
          className="text-[10px] font-bold text-neutral-600 transition hover:text-neutral-300 cursor-pointer"
        >
          {showAdmin ? "▾" : "▸"} 운영자 승인 패널
        </button>
        {showAdmin && !authed && (
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && adminLogin()}
              type="password"
              placeholder="마스터 키"
              className={`${inputCls} min-w-0 flex-1`}
              aria-label="운영자 마스터 키"
            />
            <button type="button" onClick={adminLogin} className={btnCls}>
              로그인
            </button>
            {adminErr && <p className="w-full text-[11px] text-red-400">{adminErr}</p>}
          </div>
        )}
        {showAdmin && authed && (
          <div className="mt-3 space-y-2">
            {reqs.filter((r) => r.status === "pending").length === 0 && (
              <p className="text-[11px] text-neutral-600">// 대기 중인 신청 없음</p>
            )}
            {reqs
              .filter((r) => r.status === "pending")
              .map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-neutral-800 px-3 py-2"
                >
                  <p className="text-xs font-bold text-white">{r.name}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => decide(r.id, "approve")}
                      className="rounded-md bg-white px-3 py-1 text-[11px] font-bold text-black transition hover:opacity-80 cursor-pointer"
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      onClick={() => decide(r.id, "deny")}
                      className="rounded-md border border-neutral-700 px-3 py-1 text-[11px] font-bold text-neutral-400 transition hover:border-neutral-500 hover:text-white cursor-pointer"
                    >
                      거절
                    </button>
                  </div>
                </div>
              ))}
            {issued && (
              <div className="rounded-lg border border-white/50 bg-white/[0.06] p-3">
                <p className="text-[10px] text-neutral-500">
                  // {issued.name} 키 — 이 화면에서 한 번만 표시됨, 복사 후 전달:
                </p>
                <p className="mt-1 break-all font-bold text-white">{issued.key}</p>
              </div>
            )}
            {reqs.some((r) => r.status !== "pending") && (
              <details className="text-[11px] text-neutral-600">
                <summary className="cursor-pointer">처리 이력</summary>
                <div className="mt-1 space-y-0.5">
                  {reqs
                    .filter((r) => r.status !== "pending")
                    .map((r) => (
                      <p key={r.id}>
                        {r.name} — {r.status}
                      </p>
                    ))}
                </div>
              </details>
            )}
            {adminErr && <p className="text-[11px] text-red-400">{adminErr}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-lg font-bold tracking-tight text-white"
      style={{ fontFamily: MONO }}
    >
      <span className="mr-2 text-neutral-600">#</span>
      {children}
    </h2>
  );
}

export default function UsagePage() {
  const [snapshot, setSnapshot] = useState<UsageSnapshot | null>(null);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [league, setLeague] = useState<RankedParticipant[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [gran, setGran] = useState<Granularity>("day");
  const [period, setPeriod] = useState<Period>("m1");
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  // 운영자 세션이 살아 있으면 대기 신청 수를 상단 배지에 띄운다.
  // JoinPanel 이 승인/거절할 때마다 'tokenholic-requests' 이벤트로 갱신.
  useEffect(() => {
    const adminKey = sessionStorage.getItem("tokenholic-admin");
    if (!adminKey) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const r = await fetch("/api/usage/requests", {
          headers: { Authorization: `Bearer ${adminKey}` },
        });
        if (!r.ok) return;
        const d = (await r.json()) as {
          requests: Array<{ status: string }>;
        };
        if (!cancelled) {
          setPendingCount(d.requests.filter((x) => x.status === "pending").length);
        }
      } catch {
        // 배지는 부가 기능 — 조용히 실패
      }
    };
    void refresh();
    window.addEventListener("tokenholic-requests", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("tokenholic-requests", refresh);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/usage")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as {
          snapshot: UsageSnapshot | null;
          report?: DailyReport | null;
          league?: RankedParticipant[];
        };
      })
      .then((data) => {
        if (cancelled) return;
        setLeague(data.league ?? []);
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
  const periodDaily = useMemo(() => {
    if (!snapshot) return [];
    const sorted = [...snapshot.daily].sort((a, b) => a.day.localeCompare(b.day));
    const p = PERIODS.find((x) => x.key === period);
    return !p || p.days === Infinity ? sorted : sorted.slice(-p.days);
  }, [snapshot, period]);
  const maxPeriodDaily = useMemo(
    () => Math.max(...periodDaily.map((d) => d.tokens), 1),
    [periodDaily],
  );
  const dailyRows = useMemo(
    // 최신일부터 위에서 아래로 — tail 순서
    () => [...periodDaily].reverse().slice(0, DAY_ROW_CAP),
    [periodDaily],
  );
  const dailyRowsTruncated = periodDaily.length > dailyRows.length;
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
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-200">
      <main className="mx-auto max-w-4xl px-4 py-10" style={{ fontFamily: MONO }}>
        <div className="mb-10 flex items-center justify-between">
          <Link
            href="/"
            className="rounded-full border border-neutral-800 px-4 py-2 text-xs font-bold text-neutral-400 transition hover:border-neutral-500 hover:text-white"
          >
            ← cd ~
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-neutral-800 px-3 py-1 text-[10px] font-bold text-neutral-500 sm:inline">
              $ = API 환산 추정
            </span>
            {pendingCount !== null && (
              <button
                type="button"
                onClick={() =>
                  document.getElementById("join")?.scrollIntoView({ behavior: "smooth" })
                }
                className={`rounded-full border px-3 py-2 text-xs font-bold transition cursor-pointer ${
                  pendingCount > 0
                    ? "animate-pulse border-white bg-white text-black"
                    : "border-neutral-800 text-neutral-500 hover:text-white"
                }`}
                aria-label="대기 중인 참여 신청"
              >
                🔔 {pendingCount}
              </button>
            )}
            <a
              href="/tokenholic-agent.mjs"
              download
              className="rounded-full border border-neutral-500 bg-white px-4 py-2 text-xs font-bold text-black transition hover:opacity-80"
            >
              ⬇ join.mjs — 참여하기
            </a>
          </div>
        </div>

        {/* terminal window header */}
        <header className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0D0D0D]">
          <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-2.5">
            <span className="h-3 w-3 rounded-full bg-neutral-700" />
            <span className="h-3 w-3 rounded-full bg-neutral-700" />
            <span className="h-3 w-3 rounded-full bg-neutral-700" />
            <span className="ml-3 text-[11px] text-neutral-600">
              tokenholic — zsh — 80×24
            </span>
          </div>
          <div className="px-6 py-8 text-center">
            <p className="text-xs text-neutral-600">$ whoami --tokens --flex</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
              TOKENHOLIC<span className="animate-cursor ml-1">▊</span>
            </h1>
            <p className="mt-3 text-sm font-bold text-neutral-400 md:text-base">
              너, 토큰 얼마나 태웠어? 개발자 AI 사용량 랭킹전
            </p>
          </div>
        </header>

        {state === "loading" && (
          <p className="mt-12 text-center text-sm text-neutral-600">
            $ loading<span className="animate-cursor">▊</span>
          </p>
        )}

        {state === "error" && (
          <p className="mt-12 text-center text-sm text-red-400">
            fetch failed: {error}
          </p>
        )}

        {state === "empty" && (
          <div className="mt-12 rounded-xl border border-dashed border-neutral-800 p-10 text-center">
            <p className="text-4xl">🛰️</p>
            <p className="mt-4 text-sm font-bold text-neutral-300">
              아직 첫 스냅샷이 도착하지 않았어요
            </p>
            <p className="mt-2 text-xs text-neutral-600">
              매일 자정(한국 시간) 사용량이 자동으로 올라옵니다
            </p>
          </div>
        )}

        {state === "ready" && snapshot && (
          <>
            {/* ---------- sync header + totals ---------- */}
            <Reveal>
              <section className="mt-8 rounded-xl border border-neutral-800 bg-[#0D0D0D] p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-neutral-600">
                  <span>
                    마지막 갱신 {syncedKst} · {snapshot.rows.toLocaleString("ko-KR")}행
                    · 단가 기준 {snapshot.pricingAsOf}
                  </span>
                  {snapshot.partial && (
                    <span className="rounded-full border border-neutral-700 px-3 py-1 font-bold text-neutral-400">
                      ⚠ 일부 기기 미수집
                    </span>
                  )}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-6 text-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                      total tokens
                    </p>
                    <p className="mt-1 text-3xl font-black text-white">
                      <CountUp to={snapshot.totalTokens} format={fmtTokens} />
                    </p>
                    <p className="mt-1 text-[10px] text-neutral-600">
                      {snapshot.firstDay} ~ {snapshot.lastDay}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                      est. spend (api환산)
                    </p>
                    <p className="mt-1 text-3xl font-black text-white">
                      <CountUp to={snapshot.totalUsd} format={(n) => fmtUsd(n)} />
                    </p>
                    <p className="mt-1 text-[10px] text-neutral-600">
                      실제 청구액이 아닌 정가 환산 추정치
                    </p>
                  </div>
                </div>
              </section>
            </Reveal>

            {/* ---------- daily report ---------- */}
            {report && (
              <Reveal>
                <section className="mt-4 rounded-xl border border-neutral-800 bg-[#0D0D0D] p-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                    $ cat daily-report.json
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-3">
                    <p className="text-2xl font-black text-white">
                      {fmtTokens(report.tokens)}
                      <span className="ml-2 text-sm text-neutral-500">tokens</span>
                      {report.deltaPct !== null && (
                        <span
                          className="ml-2 rounded-full border px-2 py-0.5 align-middle text-xs font-bold"
                          style={{
                            borderColor:
                              report.deltaPct >= 0 ? "#52525B" : "#3F3F46",
                            color: report.deltaPct >= 0 ? "#E4E4E7" : "#A1A1AA",
                          }}
                        >
                          {report.deltaPct >= 0 ? "▲" : "▼"}{" "}
                          {Math.abs(report.deltaPct).toFixed(0)}%
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-neutral-400">
                      {report.day} · {fmtUsd(report.usd)}
                      {!report.costComplete && " (부분 합계)"}
                    </p>
                    {report.prev7Avg !== null && (
                      <p className="text-xs text-neutral-600">
                        직전 7일 평균 {fmtTokens(report.prev7Avg)}
                      </p>
                    )}
                    {report.topModel && (
                      <p className="text-sm text-neutral-300">
                        mvp: <b className="text-white">{report.topModel.model}</b>
                      </p>
                    )}
                  </div>
                </section>
              </Reveal>
            )}

            {/* ---------- league ranking ---------- */}
            {league.length > 1 && (
              <Reveal>
                <section className="mt-4 rounded-xl border border-neutral-800 bg-[#0D0D0D] p-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                    $ rank --period=30d --sort=usd
                  </p>
                  <div className="mt-4 space-y-2">
                    {league.map((p) => (
                      <div
                        key={p.name}
                        className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border px-4 py-3 ${
                          p.rank === 1
                            ? "border-white/60 bg-white/[0.06]"
                            : "border-neutral-800 bg-black/40"
                        }`}
                      >
                        <p className="text-base font-bold text-white">
                          <span className="mr-3 text-neutral-500">
                            #{p.rank}
                          </span>
                          {p.name}
                          {p.delta7dPct !== null && (
                            <span className="ml-2 text-xs font-bold text-neutral-500">
                              {p.delta7dPct >= 0 ? "▲" : "▼"}{" "}
                              {Math.abs(p.delta7dPct).toFixed(0)}%
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-neutral-400">
                          <b className="text-white">{fmtUsd(p.usd30d)}</b>
                          <span className="mx-2 text-neutral-700">·</span>
                          {fmtTokens(p.tokens30d)} tk
                          <span className="mx-2 text-neutral-700">·</span>
                          <span className="text-neutral-600">{p.lastDay}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] text-neutral-600">
                    공정 축은 환산 비용($) — 캐시·집계 편차 때문에 원시 토큰은
                    참고용
                  </p>
                </section>
              </Reveal>
            )}

            {/* ---------- calendar heatmap ---------- */}
            <Reveal>
              <section className="mt-10">
                <SectionTitle>사용 잔디 contribution-graph</SectionTitle>
                <p className="mt-1 text-xs text-neutral-600">
                  하루 토큰량 — 밝을수록 많이 사용
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
              <section className="mt-10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <SectionTitle>사용 추이 timeseries</SectionTitle>
                  <div className="flex gap-1 rounded-full border border-neutral-800 p-1">
                    {GRANULARITIES.map((g) => (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => setGran(g.key)}
                        className={`rounded-full px-3 py-1 text-[11px] font-bold transition cursor-pointer ${
                          gran === g.key
                            ? "bg-white text-black"
                            : "text-neutral-500 hover:text-white"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {gran === "day" && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                      range
                    </span>
                    <div className="flex gap-1 rounded-full border border-neutral-800 p-1">
                      {PERIODS.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setPeriod(p.key)}
                          className={`rounded-full px-3 py-1 text-[11px] font-bold transition cursor-pointer ${
                            period === p.key
                              ? "bg-white text-black"
                              : "text-neutral-500 hover:text-white"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {gran === "hour" && (
                  <>
                    <p className="mt-1 text-xs text-neutral-600">
                      시간대별 총 사용량 (전체 기간 합산 · Z.AI 제외)
                    </p>
                    <VerticalBars
                      values={hourBars.map((h) => h.tokens)}
                      labels={hourBars.map((h) => `${h.hour}시 · ${fmtTokens(h.tokens)} 토큰`)}
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-neutral-600">
                      <span>00h</span>
                      <span>12h</span>
                      <span>23h</span>
                    </div>
                  </>
                )}

                {gran === "day" && period === "d1" && (
                  <>
                    <p className="mt-1 text-xs text-neutral-600">
                      하루 총액 — 화살표로 날짜를 이동해 확인 · 당일은 매일
                      자정(한국 시간) 업로드 예정
                    </p>
                    <DayNavigator snapshot={snapshot} />
                  </>
                )}

                {gran === "day" && period !== "d1" && (
                  <>
                    <p className="mt-1 text-xs text-neutral-600">
                      {`선택 기간 ${periodDaily.length}일 — 그래프에 마우스를 올리면 수치가 버블로 표시`}
                    </p>
                    <HoverPointChart
                      points={periodDaily.map((d) => ({
                        label: d.day,
                        tokens: d.tokens,
                        usd: d.usd,
                      }))}
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-neutral-600">
                      <span>peak {fmtTokens(maxPeriodDaily)} /일</span>
                    </div>
                    <div className="mt-6 space-y-4">
                      {dailyRows.map((d, i) => (
                        <GrowBar
                          key={d.day}
                          pct={(d.tokens / maxPeriodDaily) * 100}
                          color="#E4E4E7"
                          trackClass="bg-white/5"
                          heightClass="h-4"
                          delay={Math.min(i, 24) * 40}
                          label={d.day}
                          valueLabel={`${fmtTokens(d.tokens)} · ${fmtUsd(d.usd)}${
                            d.usd !== null && !d.costComplete ? " (부분)" : ""
                          }`}
                        />
                      ))}
                    </div>
                    {dailyRowsTruncated && (
                      <p className="mt-2 text-[10px] text-neutral-600">
                        {`// 전체 기간이 길어 최근 ${DAY_ROW_CAP}일만 표시 — 전체 모양은 잔디 그래프에서`}
                      </p>
                    )}
                  </>
                )}

                {gran === "week" && (
                  <>
                    <p className="mt-1 text-xs text-neutral-600">
                      주간별 합계 — 최근 {weekBars.length}주
                    </p>
                    <div className="mt-6 space-y-4">
                      {weekBars.map((w, i) => (
                        <GrowBar
                          key={w.weekStart}
                          pct={(w.tokens / Math.max(...weekBars.map((x) => x.tokens), 1)) * 100}
                          color="#E4E4E7"
                          trackClass="bg-white/5"
                          heightClass="h-4"
                          delay={i * 50}
                          label={w.weekStart}
                          valueLabel={`${fmtTokens(w.tokens)} · ${fmtUsd(w.usd)}`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {gran === "month" && (
                  <>
                    <p className="mt-1 text-xs text-neutral-600">
                      월별 합계 — 전체 {monthBars.length}개월 · 포인트에 마우스를
                      올리면 버블
                    </p>
                    <HoverPointChart
                      points={monthBars.map((m) => ({
                        label: m.month,
                        tokens: m.tokens,
                        usd: m.usd,
                      }))}
                      tickEvery={Math.max(1, Math.ceil(monthBars.length / 8))}
                    />
                    <div className="mt-6 space-y-4">
                      {monthBars.map((m, i) => (
                        <GrowBar
                          key={m.month}
                          pct={(m.tokens / Math.max(...monthBars.map((x) => x.tokens), 1)) * 100}
                          color="#A1A1AA"
                          trackClass="bg-white/5"
                          heightClass="h-4"
                          delay={Math.min(i, 24) * 40}
                          label={m.month}
                          valueLabel={`${fmtTokens(m.tokens)} · ${fmtUsd(m.usd)}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </section>
            </Reveal>

            {/* ---------- weekday x hour heatmap ---------- */}
            <Reveal>
              <section className="mt-10">
                <SectionTitle>언제 제일 쓸까 heat-map</SectionTitle>
                <p className="mt-1 text-xs text-neutral-600">
                  요일×시간 사용량 (Z.AI는 시간 정보가 없어 제외)
                </p>
                <div className="mt-6 overflow-x-auto pb-2">
                  <div className="min-w-[640px]">
                    <div className="mb-1 flex gap-[3px] pl-8">
                      {Array.from({ length: 24 }, (_, h) => (
                        <span
                          key={h}
                          className="w-[22px] text-center text-[9px] text-neutral-600"
                        >
                          {h % 3 === 0 ? h : ""}
                        </span>
                      ))}
                    </div>
                    {[1, 2, 3, 4, 5, 6, 7].map((dow) => (
                      <div key={dow} className="mb-[3px] flex items-center gap-[3px]">
                        <span className="w-8 text-[10px] text-neutral-600">
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
              <section className="mt-10">
                <SectionTitle>모델 랭킹 top-models</SectionTitle>
                <div className="mt-6 space-y-4">
                  {snapshot.models.map((m, i) => (
                    <GrowBar
                      key={`${m.provider}/${m.model}`}
                      pct={(m.tokens / maxModel) * 100}
                      color="#E4E4E7"
                      trackClass="bg-white/5"
                      heightClass="h-4"
                      delay={i * 60}
                      label={m.model}
                      valueLabel={`${fmtTokens(m.tokens)} · ${fmtUsd(m.usd)}`}
                    />
                  ))}
                </div>
              </section>
            </Reveal>

            {/* ---------- providers ---------- */}
            <Reveal>
              <section className="mt-10">
                <SectionTitle>최근 30일 제공자별 providers</SectionTitle>
                <div className="mt-6 space-y-5">
                  {snapshot.providers.map((p, i) => (
                    <GrowBar
                      key={p.provider}
                      pct={(p.tokens / (providerTotal || 1)) * 100}
                      color="#A1A1AA"
                      trackClass="bg-white/5"
                      heightClass="h-5"
                      delay={i * 80}
                      label={p.provider}
                      valueLabel={`${fmtTokens(p.tokens)} (${((p.tokens / (providerTotal || 1)) * 100).toFixed(1)}%) · ${fmtUsd(p.usd)}`}
                    />
                  ))}
                </div>
              </section>
            </Reveal>

            {/* ---------- join guide ---------- */}
            <Reveal>
              <section id="join" className="mt-12 scroll-mt-6 rounded-xl border border-neutral-800 bg-[#0D0D0D] p-6">
                <SectionTitle>참여 방법 how-to-join</SectionTitle>
                <div className="mt-4 space-y-2 text-xs leading-relaxed text-neutral-400">
                  <p>
                    <b className="text-white">1.</b> 아래에서 참여 신청 → 운영자 승인 후
                    참가자 키 수령
                  </p>
                  <JoinPanel />
                  <p>
                    <b className="text-white">2.</b> 에이전트 설치 — 우측 상단 ⬇ 버튼 또는:
                  </p>
                  <pre className="overflow-x-auto rounded-lg border border-neutral-800 bg-black/60 p-3 text-[11px] text-neutral-300">
{`curl -fsSL ${typeof window !== "undefined" ? window.location.origin : "https://uniquedonut.s1ckdark.workers.dev"}/tokenholic-agent.mjs -o /tmp/tokenholic-agent.mjs
node /tmp/tokenholic-agent.mjs install <참가자키>`}
                  </pre>
                  <p>
                    <b className="text-white">3.</b> <code className="text-neutral-300">~/.tokenholic/collect.sh</code> 에
                    아래 규격의 JSON을 stdout으로 출력하는 수집기 연결 (설치 시 스텁이 생성됨)
                  </p>
                  <pre className="overflow-x-auto rounded-lg border border-neutral-800 bg-black/60 p-3 text-[11px] text-neutral-500">
{`{ "syncedAt": "YYYY-MM-DDTHH:MM:SS+09:00", "rows": n, "firstDay": "…", "lastDay": "…",
  "partial": bool, "pricingAsOf": "…", "totalTokens": n, "totalUsd": n,
  "daily":     [{ day, tokens, usd, costComplete }],        // ≤800행
  "providers": [{ provider, tokens, usd }],                 // ≤20행 (30일)
  "models":    [{ provider, model, tokens, usd }],          // ≤40행
  "heatmap":   [{ dow: 1-7, hour: 0-23, tokens }] }         // 168행`}
                  </pre>
                  <p className="text-neutral-600">
                    // 자동 실행: 매일 00:15 (참가자 현지 시각) · 점검:{" "}
                    <code className="text-neutral-400">node ~/.tokenholic/agent.mjs doctor</code> ·
                    탈퇴: <code className="text-neutral-400">uninstall</code>
                  </p>
                </div>
              </section>
            </Reveal>

            {/* ---------- caveats ---------- */}
            <Reveal>
              <footer className="mt-4 rounded-xl border border-neutral-900 p-5 text-[10px] leading-relaxed text-neutral-600">
                <p>// 금액은 구독 사용량을 API 정가로 환산한 추정치 (단가 미공개 모델 포함 시 부분 합계)</p>
                <p>// grok-4.7-build 수치는 실제보다 약 8% 낮게 집계</p>
                <p>// 데이터 {snapshot.firstDay}~ — 초기 구간은 듬성할 수 있음 · 세션/기기 정보 미포함</p>
              </footer>
            </Reveal>
          </>
        )}
      </main>
    </div>
  );
}
