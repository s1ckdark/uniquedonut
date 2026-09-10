"use client";

import Link from "next/link";
import { useState } from "react";
import GrowthDay from "@/components/GrowthDay";
import {
  BEDTIME_EARLIEST,
  BEDTIME_LATEST,
  WAKE_HOUR,
  sleepDurationHours,
  sleepVerdict,
  formatBedtime,
} from "@/lib/growth";

const HABITS = [
  {
    emoji: "😴",
    title: "잠 9~11시간",
    body: "우리 나이의 목표예요. 밤에 일찍 자고 아침에 개운하게!",
  },
  {
    emoji: "🤸",
    title: "뛰어놀기",
    body: "뛰고 놀면 뼈와 근육이 '더 자라고 싶다!'고 신호를 보내요.",
  },
  {
    emoji: "🥛",
    title: "우유·달걀·치즈",
    body: "키 크는 재료(단백질과 칼슘)가 가득해요.",
  },
  {
    emoji: "😄",
    title: "즐거운 마음",
    body: "웃고 놀면 잠도 더 잘 와요. 마음도 몸의 일부예요!",
  },
];

export default function GrowthPage() {
  const [bedHour, setBedHour] = useState(22);

  const duration = sleepDurationHours(bedHour);
  const verdict = sleepVerdict(duration);

  return (
    <div className="min-h-screen bg-[#1A0A2E] text-[#FEFEFE]">
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/gino"
            className="rounded-full bg-[#FF6B9D]/15 px-4 py-2 text-sm font-bold text-[#FF6B9D] transition hover:scale-105"
          >
            ← Gino
          </Link>
        </div>

        <header className="mb-8 text-center">
          <h1
            className="text-4xl font-black leading-none md:text-6xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#f4a261",
              textShadow:
                "0 0 20px rgba(244,162,97,0.5), 3px 3px 0px #4895ef",
            }}
          >
            SLEEP &amp; GROW
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            키 크는 마법은 잠자는 동안! 😴
          </p>
        </header>

        {/* interactive: bedtime slider + curve */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <label className="flex items-center gap-3 text-sm font-bold text-white/70">
              취침 시간
              <input
                type="range"
                min={BEDTIME_EARLIEST * 2}
                max={BEDTIME_LATEST * 2}
                step={1}
                value={Math.round(bedHour * 2)}
                onChange={(e) => setBedHour(Number(e.target.value) / 2)}
                className="w-44 accent-[#f4a261] cursor-pointer"
              />
            </label>
            <span
              className="rounded-full px-4 py-1 text-sm font-black text-black"
              style={{ background: "#f4a261" }}
            >
              {formatBedtime(bedHour)} 자기 · 아침 {WAKE_HOUR}시 기상
            </span>
          </div>

          <div className="rounded-xl bg-[#10142e] p-3">
            <GrowthDay bedHour={bedHour} />
          </div>

          {/* verdict */}
          <div
            className="mt-4 rounded-2xl border p-4 text-center"
            style={{ borderColor: "#f4a26150", background: "#f4a26110" }}
          >
            <p className="text-3xl">{verdict.emoji}</p>
            <p
              className="mt-1 text-2xl font-black"
              style={{ fontFamily: "'Fredoka', cursive", color: "#f4a261" }}
            >
              총 잠 {duration}시간 — {verdict.label}!
            </p>
            <p className="mt-1 text-white/70">{verdict.description}</p>
          </div>
        </section>

        {/* learn: what is GH */}
        <section className="mt-8 grid grid-cols-1 items-center gap-6 rounded-2xl border border-[#6BCB77]/30 bg-[#6BCB77]/10 p-6 sm:grid-cols-2">
          <div>
            <h2
              className="text-2xl font-black"
              style={{ fontFamily: "'Fredoka', cursive", color: "#6BCB77" }}
            >
              🧠 성장호르몬이 뭐예요?
            </h2>
            <p className="mt-3 leading-relaxed text-white/85">
              뇌 속의 작은 공장(뇌하수체)에서{" "}
              <b className="text-[#6BCB77]">키 크는 마법 물약</b>이 나와요!
              이 물약은 팔과 다리 <b>뼈의 끝</b>으로 가요. 그곳에는{" "}
              <b className="text-[#6BCB77]">성장판</b>이라는 부드러운 부분이
              있는데, 물약이 닿으면 뼈가 조금씩 길어져요.
            </p>
          </div>
          {/* body silhouette */}
          <svg viewBox="0 0 200 240" className="mx-auto h-auto w-40" role="img" aria-label="몸속 성장판 지도">
            <circle cx={100} cy={34} r={20} fill="#f5d7a3" />
            <circle cx={100} cy={30} r={5} fill="#6BCB77" />
            <text x={124} y={32} fontSize={10} fill="#6BCB77">뇌하수체</text>
            <rect x={86} y={58} width={28} height={64} rx={10} fill="#4C9F70" />
            <rect x={58} y={62} width={12} height={54} rx={6} fill="#4C9F70" />
            <rect x={130} y={62} width={12} height={54} rx={6} fill="#4C9F70" />
            <rect x={84} y={126} width={14} height={70} rx={7} fill="#4C9F70" />
            <rect x={102} y={126} width={14} height={70} rx={7} fill="#4C9F70" />
            {/* growth plates glowing at bone ends */}
            {[
              { x: 64, y: 110, label: "" },
              { x: 136, y: 110, label: "" },
              { x: 91, y: 190, label: "성장판!" },
              { x: 109, y: 190, label: "" },
            ].map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={6} fill="#FFD93D" opacity={0.9} />
                <circle cx={p.x} cy={p.y} r={10} fill="none" stroke="#FFD93D" strokeWidth={1.5} opacity={0.5} />
                {p.label && (
                  <text x={p.x + 14} y={p.y + 4} fontSize={10} fill="#FFD93D">{p.label}</text>
                )}
              </g>
            ))}
            {/* magic arrows */}
            <path d="M 100 40 Q 130 60 136 100" fill="none" stroke="#6BCB77" strokeWidth={2} strokeDasharray="4 4" markerEnd="url(#gh-arrow)" />
            <path d="M 100 40 Q 80 120 91 182" fill="none" stroke="#6BCB77" strokeWidth={2} strokeDasharray="4 4" />
            <defs>
              <marker id="gh-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#6BCB77" />
              </marker>
            </defs>
          </svg>
        </section>

        {/* learn: why sleep */}
        <section className="mt-6 rounded-2xl border border-[#4895ef]/30 bg-[#4895ef]/10 p-6">
          <h2
            className="text-2xl font-black"
            style={{ fontFamily: "'Fredoka', cursive", color: "#4895ef" }}
          >
            🌙 왜 잠에서 제일 많이 나올까?
          </h2>
          <p className="mt-3 leading-relaxed text-white/85">
            몸이 깊은 잠에 빠지면 "이제 자랄 시간이야!" 하고 마법 물약이{" "}
            <b className="text-[#f4a261]">폭포처럼</b> 쏟아져요. 특히{" "}
            <b>잠든 뒤 처음 3시간</b>의 깊은 자 때 가장 많이 나와요. 그래서
            그래프의 큰 파도가 딱 그 구간에 있죠!
          </p>
          <p className="mt-2 leading-relaxed text-white/60">
            💡 사실! "밤 10시부터 2시가 골든타임"이라는 말이 있지만, 사실
            시계가 아니라 <b>잠든 지 얼마나 됐는지</b>가 중요해요. 다만 일찍
            자야 깊은 잠 파도도 충분히 타고, 잠 시간도 늘어나는 거예요!
          </p>
        </section>

        {/* habit cards */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {HABITS.map((h) => (
            <div
              key={h.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
            >
              <p className="text-3xl">{h.emoji}</p>
              <h3
                className="mt-1 text-lg font-black"
                style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
              >
                {h.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-white/70">
                {h.body}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
