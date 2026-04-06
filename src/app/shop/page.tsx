import Link from "next/link";
import { categories } from "@/data/donuts";
import MenuBoard from "@/components/MenuBoard";
import Sprinkles from "@/components/Sprinkles";

export default function Shop() {
  return (
    <>
      <Sprinkles />
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Shop header */}
        <section className="relative z-10 pt-12 pb-10">
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all hover:scale-105"
              style={{
                background: "#FF6B9D20",
                color: "#FF6B9D",
                border: "1px solid #FF6B9D50",
              }}
            >
              ← Home
            </Link>
            <div
              className="px-4 py-2 rounded-full border border-dashed border-[#FFD93D] text-sm"
              style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
            >
              ⏰ OPEN 24/7
            </div>
          </div>

          <h1
            className="text-5xl md:text-7xl font-black text-center leading-none"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#FF6B9D",
              textShadow:
                "0 0 20px rgba(255,107,157,0.5), 0 0 40px rgba(255,107,157,0.3), 3px 3px 0px #FFD93D",
            }}
          >
            THE MENU
          </h1>
          <p
            className="text-center mt-4 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            Pick your flavor 🍩
          </p>

          {/* Decorative bar */}
          <div className="mt-6 mx-auto flex items-center justify-center gap-3">
            <div className="h-1 w-16 rounded-full bg-[#FF6B9D]" />
            <span className="text-2xl">🍩</span>
            <div className="h-1 w-16 rounded-full bg-[#FFD93D]" />
            <span className="text-2xl">🍩</span>
            <div className="h-1 w-16 rounded-full bg-[#6BCB77]" />
            <span className="text-2xl">🍩</span>
            <div className="h-1 w-16 rounded-full bg-[#FF8C42]" />
          </div>
        </section>

        {/* Menu sections */}
        {categories.map((cat) => (
          <MenuBoard key={cat.name} category={cat} />
        ))}

        {/* Footer */}
        <footer className="relative z-10 text-center pt-12 pb-8 border-t border-white/10">
          <p className="text-3xl mb-2">🍩</p>
          <p
            className="text-sm text-gray-500"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            &copy; {new Date().getFullYear()} Unique Donut &mdash; All demos baked with love
          </p>
        </footer>
      </main>
    </>
  );
}
