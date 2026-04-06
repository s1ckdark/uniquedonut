export default function Hero() {
  return (
    <section className="relative z-10 pt-16 pb-12 text-center">
      {/* Spinning donut */}
      <div className="text-8xl mb-6 animate-spin-slow">🍩</div>

      {/* Main title */}
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

      {/* Subtitle */}
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

      {/* Decorative bar */}
      <div className="mt-8 mx-auto flex items-center justify-center gap-3">
        <div className="h-1 w-16 rounded-full bg-[#FF6B9D]" />
        <span className="text-2xl">🍩</span>
        <div className="h-1 w-16 rounded-full bg-[#FFD93D]" />
        <span className="text-2xl">🍩</span>
        <div className="h-1 w-16 rounded-full bg-[#6BCB77]" />
        <span className="text-2xl">🍩</span>
        <div className="h-1 w-16 rounded-full bg-[#FF8C42]" />
      </div>

      {/* Open hours badge */}
      <div
        className="mt-8 inline-block px-6 py-3 rounded-full border-2 border-dashed border-[#FF6B9D] text-[#FEFEFE]"
        style={{ fontFamily: "'Fredoka', cursive" }}
      >
        ⏰ OPEN 24/7 &mdash; {categories()} flavors available
      </div>
    </section>
  );
}

function categories() {
  return "13";
}
