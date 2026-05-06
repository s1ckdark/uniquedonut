import Link from "next/link";
import Sprinkles from "@/components/Sprinkles";
import WebShell from "@/components/WebShell";

export const metadata = {
  title: "Web Shell — Unique Donut",
  description: "A sandboxed browser shell for exploring Unique Donut demos.",
};

export default function ShellPage() {
  return (
    <>
      <Sprinkles />
      <main className="relative z-10 min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto mb-6 flex max-w-6xl items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#FF6B9D]/50 bg-[#FF6B9D]/15 px-4 py-2 text-sm font-bold text-[#FF6B9D] transition-transform hover:scale-105"
          >
            <span aria-hidden="true">←</span>
            Home
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full border border-[#FFD93D]/50 bg-[#FFD93D]/15 px-4 py-2 text-sm font-bold text-[#FFD93D] transition-transform hover:scale-105"
          >
            Menu
            <span aria-hidden="true">🍩</span>
          </Link>
        </div>

        <header className="mx-auto mb-7 max-w-6xl">
          <p
            className="mb-3 text-sm font-black uppercase tracking-[0.32em] text-[#6BCB77]"
            style={{ fontFamily: "'Fredoka', cursive" }}
          >
            Interactive demo
          </p>
          <h1
            className="text-5xl font-black leading-none text-[#FF6B9D] sm:text-6xl lg:text-7xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              textShadow:
                "0 0 20px rgba(255,107,157,0.42), 3px 3px 0px #FFD93D",
            }}
          >
            WEB SHELL
          </h1>
        </header>

        <WebShell />
      </main>
    </>
  );
}
