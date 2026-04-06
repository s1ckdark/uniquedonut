import { categories } from "@/data/donuts";
import Hero from "@/components/Hero";
import MenuBoard from "@/components/MenuBoard";
import Sprinkles from "@/components/Sprinkles";

export default function Home() {
  return (
    <>
      <Sprinkles />
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Hero />

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
