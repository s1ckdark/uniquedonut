"use client";

import Link from "next/link";
import CrabGrowth from "@/components/CrabGrowth";

export default function CrabPage() {
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

        <header className="mb-10 text-center">
          <h1
            className="text-4xl font-black leading-none md:text-6xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#FF8C42",
              textShadow:
                "0 0 20px rgba(255,140,66,0.5), 3px 3px 0px #00ccff",
            }}
          >
            CRAB LIFE
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            꽃게의 일생 🦀
          </p>
        </header>

        <section>
          <h2
            className="mb-4 text-center text-3xl font-black"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FF8C42" }}
          >
            꽃게는 어떻게 자랄까?
          </h2>
          <CrabGrowth />
        </section>

        {/* Learn card: contrast with the mantis */}
        <section className="mt-8 rounded-2xl border border-[#FF8C42]/30 bg-[#FF8C42]/10 p-6">
          <h2
            className="text-2xl font-black"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FF8C42" }}
          >
            🦀 사마귀와 아주 달라요 — 변신하는 아기
          </h2>
          <p className="mt-3 leading-relaxed text-white/85">
            <b>사마귀</b> 아기는 태어날 때부터 어른의{" "}
            <b className="text-[#6BCB77]">미니판</b>이라 탈피하며 커지기만
            해요. 하지만 <b>꽃게</b> 아기는 달라요! 태어날 때는 꽃게와 전혀
            닮지 않은 <b className="text-[#00ccff]">조에아</b>로 시작해,{" "}
            <b className="text-[#00ccff]">메가로파</b>를 거치며 마법처럼 게
            모습으로 변신해요.
          </p>
          <p className="mt-2 leading-relaxed text-white/60">
            나비는 알 → 애벌레 → 번데기 → 나비로 완전히 변하는{" "}
            <b>완전변태</b>! 꽃게는 번데기는 없지만 아기 모습이 완전히 다른
            것도 신기한 변신이랍니다. 🦋🦗🦀
          </p>
        </section>
      </main>
    </div>
  );
}
