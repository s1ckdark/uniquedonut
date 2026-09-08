import Link from "next/link";
import { ginoContents } from "@/data/gino";
import Sprinkles from "@/components/Sprinkles";

export const metadata = {
  title: "GINO'S LEARNING — Unique Donut",
};

export default function GinoPage() {
  return (
    <>
      <Sprinkles />
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8">
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
            className="text-5xl font-black leading-none md:text-7xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#FF8C42",
              textShadow:
                "0 0 20px rgba(255,140,66,0.5), 3px 3px 0px #FFD93D",
            }}
          >
            GINO
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            지노를 위한 학습 놀이터 🎓
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {ginoContents.map((item) => (
            <Link
              key={item.slug}
              href={item.href}
              className="group rounded-2xl border-2 bg-[#241040]/95 p-6 text-center transition hover:scale-105"
              style={{
                borderColor: `${item.color}50`,
                boxShadow: `0 0 24px ${item.color}20`,
              }}
            >
              <p className="text-5xl transition group-hover:scale-110">
                {item.emoji}
              </p>
              <h2
                className="mt-3 text-2xl font-black"
                style={{ fontFamily: "'Fredoka', cursive", color: item.color }}
              >
                {item.name}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {item.description}
              </p>
            </Link>
          ))}
        </div>

        <footer className="mt-12 text-center text-xs text-white/30">
          🎓 Gino's Learning — 새로운 놀이가 계속 추가돼요!
        </footer>
      </main>
    </>
  );
}
