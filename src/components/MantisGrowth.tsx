"use client";

import { useState } from "react";
import MantisArt from "./MantisArt";
import { growthStages } from "@/lib/mantis";

function OothecaArt({ hatched }: { hatched: boolean }) {
  return (
    <svg
      viewBox="0 0 240 260"
      className="h-auto w-full"
      role="img"
      aria-label={hatched ? "부화 중인 알주머니" : "나뭇가지의 알주머니"}
    >
      {/* branch */}
      <path
        d="M 10 70 q 90 10 220 34"
        fill="none"
        stroke="#8B5A2B"
        strokeWidth={8}
        strokeLinecap="round"
      />
      {/* foam egg sac */}
      <g transform="translate(120 110)">
        <ellipse rx={34} ry={52} fill="#C9A86C" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={0}
              y1={0}
              x2={Math.sin(a) * 30}
              y2={Math.cos(a) * 48}
              stroke="#B08F55"
              strokeWidth={2}
            />
          );
        })}
      </g>
      {hatched && (
        <>
          {/* hatch hole */}
          <ellipse cx={120} cy={64} rx={10} ry={5} fill="#1A0A2E" opacity={0.6} />
          {/* scattering nymphs */}
          <g transform="translate(60 40) scale(0.16)">
            <MantisArt sex="nymph" />
          </g>
          <g transform="translate(170 30) scale(0.13)">
            <MantisArt sex="nymph" />
          </g>
          <g transform="translate(155 150) scale(0.15)">
            <MantisArt sex="nymph" />
          </g>
        </>
      )}
    </svg>
  );
}

export default function MantisGrowth() {
  const [index, setIndex] = useState(0);
  const stage = growthStages[index];
  const isLast = index === growthStages.length - 1;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      {/* dots */}
      <div className="mb-4 flex justify-center gap-2">
        {growthStages.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`${s.name} 단계로 이동`}
            onClick={() => setIndex(i)}
            className={`h-3 w-3 rounded-full transition cursor-pointer ${
              i === index ? "bg-[#6BCB77]" : "bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
        {/* visual */}
        <div className="mx-auto flex h-56 items-center justify-center">
          {stage.id === "ootheca" ? (
            <div className="w-44">
              <OothecaArt hatched={false} />
            </div>
          ) : stage.id === "hatch" ? (
            <div className="w-44">
              <OothecaArt hatched />
            </div>
          ) : (
            <div style={{ width: `${Math.round(90 + stage.scale * 110)}px` }}>
              <MantisArt sex={stage.wings ? "female" : "nymph"} />
            </div>
          )}
        </div>

        {/* text */}
        <div className="text-center sm:text-left">
          <p className="text-4xl">{stage.emoji}</p>
          <h3
            className="mt-2 text-3xl font-black"
            style={{ fontFamily: "'Fredoka', cursive", color: "#6BCB77" }}
          >
            {index + 1}단계 — {stage.name}
          </h3>
          <p className="mt-3 leading-relaxed text-white/85">{stage.description}</p>
          <p
            className="mt-3 rounded-xl px-3 py-2 text-sm"
            style={{ background: "#FFD93D15", color: "#FFD93D" }}
          >
            💡 {stage.funFact}
          </p>
        </div>
      </div>

      {/* controls */}
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="rounded-full bg-white/10 px-6 py-2 font-bold text-white/70 transition hover:bg-white/20 disabled:opacity-30 cursor-pointer"
        >
          ← 이전
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={() => setIndex((i) => Math.min(growthStages.length - 1, i + 1))}
          className="rounded-full bg-[#6BCB77] px-6 py-2 font-bold text-black transition hover:opacity-90 disabled:opacity-30 cursor-pointer"
        >
          다음 단계 →
        </button>
      </div>
    </div>
  );
}
