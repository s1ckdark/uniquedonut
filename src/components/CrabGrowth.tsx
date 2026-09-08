"use client";

import { useState } from "react";
import CrabArt from "./CrabArt";
import { crabStages } from "@/lib/crab";

export default function CrabGrowth() {
  const [index, setIndex] = useState(0);
  const stage = crabStages[index];
  const isLast = index === crabStages.length - 1;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      {/* dots */}
      <div className="mb-4 flex justify-center gap-2">
        {crabStages.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`${s.name} 단계로 이동`}
            onClick={() => setIndex(i)}
            className={`h-3 w-3 rounded-full transition cursor-pointer ${
              i === index ? "bg-[#FF8C42]" : "bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
        {/* visual — the body plan itself changes per stage; the box grows
            after the egg so the growing crab feels bigger. */}
        <div className="mx-auto flex h-56 items-center justify-center">
          <div style={{ width: `${Math.round(150 + stage.scale * 110)}px` }}>
            <CrabArt stage={stage.id} />
          </div>
        </div>

        {/* text */}
        <div className="text-center sm:text-left">
          <p className="text-4xl">{stage.emoji}</p>
          <h3
            className="mt-2 text-3xl font-black"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FF8C42" }}
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
          onClick={() =>
            setIndex((i) => Math.min(crabStages.length - 1, i + 1))
          }
          className="rounded-full bg-[#FF8C42] px-6 py-2 font-bold text-black transition hover:opacity-90 disabled:opacity-30 cursor-pointer"
        >
          다음 단계 →
        </button>
      </div>
    </div>
  );
}
