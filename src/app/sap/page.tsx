"use client";

import Link from "next/link";
import { useState } from "react";
import SapTree from "@/components/SapTree";
import BeetleArt from "@/components/BeetleArt";
import {
  sapGuests,
  beetleDifferences,
  type SapGuestId,
  type BeetlePart,
} from "@/lib/sap";

export default function SapPage() {
  const [guest, setGuest] = useState<SapGuestId>("stag");
  const [part, setPart] = useState<BeetlePart>("weapon");

  const selectedGuest = sapGuests.find((g) => g.id === guest) ?? sapGuests[0];
  const selectedDiff =
    beetleDifferences.find((d) => d.id === part) ?? beetleDifferences[0];

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
              color: "#FFC94D",
              textShadow: "0 0 20px rgba(255,201,77,0.5), 3px 3px 0px #FF6B9D",
            }}
          >
            SAP TREE
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            수액 나무 친구들 🪲
          </p>
        </header>

        {/* Section 1: the sap scene */}
        <section>
          <h2
            className="mb-3 text-center text-3xl font-black"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFC94D" }}
          >
            여름밤, 나무 식당이 열려요
          </h2>
          <p className="mb-5 text-center leading-relaxed text-white/70">
            무더운 여름, 참나무에서 스며 나오는{" "}
            <b className="text-[#FFC94D]">수액</b>(나무의 단물)은 곤충들의
            최고 맛집이에요. 밤이 되면 소문을 들은 친구들이 하나둘 모여든답니다.
            곤충을 눌러 소개를 들어보세요!
          </p>

          <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
            <div className="mx-auto w-72">
              <SapTree selected={guest} onSelect={setGuest} />
            </div>
            <div
              className="rounded-2xl border p-5"
              style={{ borderColor: "#FFC94D50", background: "#FFC94D10" }}
            >
              <p className="text-center text-4xl">{selectedGuest.emoji}</p>
              <h3
                className="mt-2 text-center text-2xl font-black"
                style={{ fontFamily: "'Fredoka', cursive", color: "#FFC94D" }}
              >
                {selectedGuest.name}
              </h3>
              <p className="mt-3 leading-relaxed text-white/85">
                {selectedGuest.what}
              </p>
              <p
                className="mt-3 rounded-xl px-3 py-2 text-sm"
                style={{ background: "#FFD93D15", color: "#FFD93D" }}
              >
                💡 {selectedGuest.funFact}
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: stag vs rhino */}
        <section className="mt-12">
          <h2
            className="mb-4 text-center text-3xl font-black"
            style={{ fontFamily: "'Fredoka', cursive", color: "#6BCB77" }}
          >
            사슴벌레 vs 장수풍뎅이
          </h2>

          <div className="grid grid-cols-2 gap-4 sm:gap-8">
            <div className="rounded-2xl border border-[#FF8C42]/40 bg-[#FF8C42]/10 p-4">
              <p
                className="text-center text-xl font-black"
                style={{ fontFamily: "'Fredoka', cursive", color: "#FF8C42" }}
              >
                사슴벌레
              </p>
              <div className="mx-auto mt-2 w-36 sm:w-48">
                <BeetleArt species="stag" highlight={part} />
              </div>
            </div>
            <div className="rounded-2xl border border-[#00ccff]/40 bg-[#00ccff]/10 p-4">
              <p
                className="text-center text-xl font-black"
                style={{ fontFamily: "'Fredoka', cursive", color: "#00ccff" }}
              >
                장수풍뎅이
              </p>
              <div className="mx-auto mt-2 w-36 sm:w-48">
                <BeetleArt species="rhino" highlight={part} />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {beetleDifferences.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setPart(d.id)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition cursor-pointer ${
                  part === d.id
                    ? "bg-[#FFD93D] text-black"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {d.title}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-[#FFD93D]/30 bg-[#FFD93D]/10 p-5">
            <h3
              className="text-center text-2xl font-black"
              style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
            >
              {selectedDiff.title}
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <p className="rounded-xl bg-[#FF8C42]/10 p-3 text-white/85">
                <b className="text-[#FF8C42]">사슴벌레</b> — {selectedDiff.stag}
              </p>
              <p className="rounded-xl bg-[#00ccff]/10 p-3 text-white/85">
                <b className="text-[#00ccff]">장수풍뎅이</b> —{" "}
                {selectedDiff.rhino}
              </p>
            </div>
            <p className="mt-3 text-center text-sm text-white/60">
              🕵️ {selectedDiff.tip}
            </p>
          </div>
        </section>

        {/* Learn card */}
        <section className="mt-8 rounded-2xl border border-[#6BCB77]/30 bg-[#6BCB77]/10 p-6">
          <h2
            className="text-2xl font-black"
            style={{ fontFamily: "'Fredoka', cursive", color: "#6BCB77" }}
          >
            🪲 셋이서 찾아낸 공통점
          </h2>
          <p className="mt-3 leading-relaxed text-white/85">
            사슴벌레와 장수풍뎅이는 여름밤에 활동하고, 수액을 제일 좋아하고,{" "}
            <b>곤봉 모양 더듬이</b>를 갖고 있어요. 그리고 둘 다{" "}
            <b className="text-[#6BCB77]">완전변태</b>! 알 → 유충 →{" "}
            <b>번데기</b> → 성충으로 자라요. 나비처럼 번데기가 있다는 뜻이에요.
          </p>
          <p className="mt-2 leading-relaxed text-white/60">
            기억나요? 사마귀는 번데기 없이 미니판으로 자라고(불완전변태), 꽃게는
            아기 때 모습이 완전히 다른 조에아로 태어났죠. 곤충과 갑각류의 자라는
            방법은 정말 다양해요! 🦗🦀🦋
          </p>
        </section>
      </main>
    </div>
  );
}
