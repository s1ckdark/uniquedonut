"use client";

import Link from "next/link";
import { useState } from "react";
import MantisArt from "@/components/MantisArt";
import MantisGrowth from "@/components/MantisGrowth";
import { differences, type MantisPart } from "@/lib/mantis";

export default function MantisPage() {
  const [selectedPart, setSelectedPart] = useState<MantisPart>("body");
  const selected = differences.find((d) => d.id === selectedPart) ?? differences[0];

  return (
    <div className="min-h-screen bg-[#1A0A2E] text-[#FEFEFE]">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/gino"
            className="rounded-full bg-[#FF6B9D]/15 px-4 py-2 text-sm font-bold text-[#FF6B9D] transition hover:scale-105"
          >
            ← Gino
          </Link>
        </div>

        <header className="mb-10 text-center">
          <h1
            className="text-4xl font-black leading-none md:text-6xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#6BCB77",
              textShadow:
                "0 0 20px rgba(107,203,119,0.5), 3px 3px 0px #FFD93D",
            }}
          >
            MANTIS
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            사마귀 관찰일지 🦗
          </p>
        </header>

        {/* Section 1: male vs female */}
        <section>
          <h2
            className="mb-4 text-center text-3xl font-black"
            style={{ fontFamily: "'Fredoka', cursive", color: "#6BCB77" }}
          >
            수컷과 암컷, 어떻게 다를까?
          </h2>

          <div className="grid grid-cols-2 gap-4 sm:gap-8">
            <div className="rounded-2xl border border-[#FF6B9D]/40 bg-[#FF6B9D]/10 p-4">
              <p
                className="text-center text-xl font-black"
                style={{ fontFamily: "'Fredoka', cursive", color: "#FF6B9D" }}
              >
                암컷 ♀
              </p>
              <div className="mx-auto mt-2 w-36 sm:w-44">
                <MantisArt sex="female" highlight={selectedPart} />
              </div>
            </div>
            <div className="rounded-2xl border border-[#00ccff]/40 bg-[#00ccff]/10 p-4">
              <p
                className="text-center text-xl font-black"
                style={{ fontFamily: "'Fredoka', cursive", color: "#00ccff" }}
              >
                수컷 ♂
              </p>
              <div className="mx-auto mt-2 w-32 sm:w-40">
                <MantisArt sex="male" highlight={selectedPart} />
              </div>
            </div>
          </div>

          {/* difference chips */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {differences.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedPart(d.id)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition cursor-pointer ${
                  selectedPart === d.id
                    ? "bg-[#FFD93D] text-black"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {d.title}
              </button>
            ))}
          </div>

          {/* explanation card */}
          <div className="mt-4 rounded-2xl border border-[#FFD93D]/30 bg-[#FFD93D]/10 p-5">
            <h3
              className="text-center text-2xl font-black"
              style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
            >
              {selected.title}
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <p className="rounded-xl bg-[#FF6B9D]/10 p-3 text-white/85">
                <b className="text-[#FF6B9D]">암컷 ♀</b> — {selected.female}
              </p>
              <p className="rounded-xl bg-[#00ccff]/10 p-3 text-white/85">
                <b className="text-[#00ccff]">수컷 ♂</b> — {selected.male}
              </p>
            </div>
            <p className="mt-3 text-center text-sm text-white/60">
              🕵️ {selected.tip}
            </p>
          </div>
        </section>

        {/* Section 2: growth */}
        <section className="mt-12">
          <h2
            className="mb-4 text-center text-3xl font-black"
            style={{ fontFamily: "'Fredoka', cursive", color: "#6BCB77" }}
          >
            사마귀는 어떻게 자랄까?
          </h2>
          <MantisGrowth />
        </section>

        {/* Learn card */}
        <section className="mt-8 rounded-2xl border border-[#FF6B9D]/30 bg-[#FF6B9D]/10 p-6">
          <h2
            className="text-2xl font-black"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FF6B9D" }}
          >
            🦗 번데기가 없어요 — 불완전변태
          </h2>
          <p className="mt-3 leading-relaxed text-white/85">
            나비는 알 → 애벌레 → <b>번데기</b> → 나비로 완전히 모습이 바뀌지만,
            사마귀는 번데기가 없어요! 아기 사마귀는 처음부터{" "}
            <b className="text-[#6BCB77]">어른의 미니판</b>이라, 탈피를 거듭하며
            커지기만 해요. 이렇게 번데기 없이 자라는 변태를{" "}
            <b>불완전변태</b>라고 불러요. 잠자리, 메뚜기도 이 방식으로 자란답니다!
          </p>
        </section>
      </main>
    </div>
  );
}
