"use client";

import Link from "next/link";
import { useState } from "react";
import ColdArt from "@/components/ColdArt";
import { coldScenes } from "@/lib/cold";

export default function ColdPage() {
  const [index, setIndex] = useState(0);
  const scene = coldScenes[index];
  const isLast = index === coldScenes.length - 1;

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
          <span className="font-mono text-sm text-white/50">
            {index + 1} / {coldScenes.length}
          </span>
        </div>

        <header className="mb-8 text-center">
          <h1
            className="text-4xl font-black leading-none md:text-6xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#9b5de5",
              textShadow:
                "0 0 20px rgba(155,93,229,0.5), 3px 3px 0px #FF6B9D",
            }}
          >
            COLD STORY
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            몸속 감기 전쟁 이야기 🤧
          </p>
        </header>

        {/* story page */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          {/* dots */}
          <div className="mb-4 flex justify-center gap-2">
            {coldScenes.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`${s.title} 장면으로 이동`}
                onClick={() => setIndex(i)}
                className={`h-3 w-3 rounded-full transition cursor-pointer ${
                  i === index ? "bg-[#9b5de5]" : "bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

          <div className="mx-auto w-72 sm:w-80">
            <ColdArt scene={scene.id} />
          </div>

          <div className="mt-5 text-center">
            <p className="text-3xl">{scene.emoji}</p>
            <h2
              className="mt-2 text-3xl font-black"
              style={{ fontFamily: "'Fredoka', cursive", color: "#9b5de5" }}
            >
              {scene.title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/85">
              {scene.text}
            </p>
            <p
              className="mx-auto mt-4 max-w-xl rounded-xl px-4 py-2 text-sm"
              style={{ background: "#FFD93D15", color: "#FFD93D" }}
            >
              💡 사실! {scene.fact}
            </p>
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
            {isLast ? (
              <button
                type="button"
                onClick={() => setIndex(0)}
                className="rounded-full bg-gradient-to-r from-[#9b5de5] to-[#FF6B9D] px-6 py-2 font-bold text-black transition hover:opacity-90 cursor-pointer"
              >
                🔄 처음부터
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setIndex((i) => Math.min(coldScenes.length - 1, i + 1))
                }
                className="rounded-full bg-[#9b5de5] px-6 py-2 font-bold text-black transition hover:opacity-90 cursor-pointer"
              >
                다음 이야기 →
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
