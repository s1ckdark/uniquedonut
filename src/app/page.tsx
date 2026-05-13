import Link from "next/link";
import Sprinkles from "@/components/Sprinkles";

export default function Home() {
  return (
    <>
      <Sprinkles />
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Spinning donut */}
        <div className="text-[120px] md:text-[180px] mb-4 animate-spin-slow select-none">
          🍩
        </div>

        {/* Title */}
        <h1
          className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight leading-none"
          style={{
            fontFamily: "'Bungee Shade', cursive",
            color: "#FF6B9D",
            textShadow:
              "0 0 20px rgba(255,107,157,0.5), 0 0 40px rgba(255,107,157,0.3), 0 0 80px rgba(255,107,157,0.15), 4px 4px 0px #FFD93D",
          }}
        >
          UNIQUE
          <br />
          DONUT
        </h1>

        {/* Tagline */}
        <p
          className="mt-6 text-xl md:text-2xl font-bold tracking-widest uppercase"
          style={{
            fontFamily: "'Fredoka', cursive",
            color: "#FFD93D",
            textShadow: "0 0 10px rgba(255,217,61,0.4)",
          }}
        >
          Fresh-baked creative demos, served hot 🔥
        </p>

        {/* CTA Buttons */}
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/shop"
            className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-full text-2xl font-black uppercase tracking-wider transition-all duration-300 hover:scale-110"
            style={{
              fontFamily: "'Fredoka', cursive",
              background: "linear-gradient(135deg, #FF6B9D, #FF8C42)",
              color: "#1A0A2E",
              boxShadow: "0 0 30px rgba(255,107,157,0.4), 0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <span>Enter the Shop</span>
            <span className="text-3xl group-hover:animate-bounce">🍩</span>
          </Link>
          <Link
            href="/ebs-documentaries"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-full text-lg font-black uppercase tracking-wider transition-all duration-300 hover:scale-105"
            style={{
              fontFamily: "'Fredoka', cursive",
              background: "#6BCB7725",
              color: "#6BCB77",
              border: "1px solid #6BCB7770",
              boxShadow: "0 0 24px rgba(107,203,119,0.22)",
            }}
          >
            <span>EBS Docu Shelf</span>
            <span className="text-2xl group-hover:animate-bounce">📺</span>
          </Link>
          <Link
            href="/visualizer"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-full text-lg font-black uppercase tracking-wider transition-all duration-300 hover:scale-105"
            style={{
              fontFamily: "'Fredoka', cursive",
              background: "#00ccff20",
              color: "#00ccff",
              border: "1px solid #00ccff50",
              boxShadow: "0 0 24px rgba(0,204,255,0.2)",
            }}
          >
            <span>Audio Visualizer</span>
            <span className="text-2xl group-hover:animate-bounce">🎙️</span>
          </Link>
        </div>

        {/* Decorative bar */}
        <div className="mt-16 flex items-center gap-3 opacity-50">
          <div className="h-0.5 w-12 rounded-full bg-[#FF6B9D]" />
          <span className="text-sm" style={{ fontFamily: "'Fredoka', cursive", color: "#6BCB77" }}>
            13 flavors available
          </span>
          <div className="h-0.5 w-12 rounded-full bg-[#FFD93D]" />
        </div>
      </main>
    </>
  );
}
