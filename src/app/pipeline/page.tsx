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
              textShadow:
                "0 0 20px rgba(107,203,119,0.5), 3px 3px 0px #FF6B9D",
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
              <div
                key={stage.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelected(stage.id)}
                  className="w-full cursor-pointer rounded-2xl border-2 bg-[#241040]/95 p-4 text-center transition hover:scale-105"
                  style={{
                    borderColor:
                      selected === stage.id ? stage.color : "#FFFFFF20",
                    boxShadow:
                      selected === stage.id
                        ? `0 0 24px ${stage.color}50`
                        : undefined,
                  }}
                >
                  <span className="text-3xl">{stage.emoji}</span>
                  <p
                    className="mt-2 text-lg font-black"
                    style={{
                      fontFamily: "'Fredoka', cursive",
                      color: stage.color,
                    }}
                  >
                    {stage.name}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">
                    {stage.short}
                  </p>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <section
          className="mt-8 rounded-2xl border p-6"
          style={{
            borderColor: `${selectedStage.color}50`,
            background: `${selectedStage.color}10`,
          }}
        >
          <h2
            className="text-2xl font-black"
            style={{
              fontFamily: "'Fredoka', cursive",
              color: selectedStage.color,
            }}
          >
            {selectedStage.emoji} {selectedStage.name}
          </h2>
          <p className="mt-3 leading-relaxed text-white/85">
            {selectedStage.detail.role}
          </p>
          <p className="mt-2 leading-relaxed text-white/60">
            🍩 {selectedStage.detail.donutStory}
          </p>
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
