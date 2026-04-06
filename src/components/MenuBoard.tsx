import type { Category } from "@/data/donuts";
import DonutCard from "./DonutCard";

export default function MenuBoard({ category }: { category: Category }) {
  return (
    <section className="relative z-10 mb-16">
      {/* Category header — chalkboard style */}
      <div className="flex items-center gap-4 mb-8">
        <span className="text-4xl">{category.emoji}</span>
        <h2
          className="text-3xl md:text-4xl font-black uppercase tracking-wide"
          style={{
            fontFamily: "'Fredoka', cursive",
            color: category.color,
            textShadow: `0 0 15px ${category.color}40`,
          }}
        >
          {category.name}
        </h2>
        <div
          className="flex-1 h-0.5 rounded-full"
          style={{ background: `linear-gradient(to right, ${category.color}, transparent)` }}
        />
      </div>

      {/* Donut cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {category.donuts.map((donut) => (
          <DonutCard key={donut.slug} donut={donut} />
        ))}
      </div>
    </section>
  );
}
