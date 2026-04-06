"use client";

import { useState } from "react";
import Link from "next/link";
import type { Donut } from "@/data/donuts";

export default function DonutCard({ donut }: { donut: Donut }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={`/demo/${donut.slug}`}>
      <div
        className="relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          border: `3px solid ${donut.color}`,
          boxShadow: hovered
            ? `0 0 30px ${donut.color}60, 0 8px 32px rgba(0,0,0,0.4)`
            : "0 4px 16px rgba(0,0,0,0.3)",
          transform: hovered ? "scale(1.05) rotate(-1deg)" : "scale(1)",
          background: "#1A0A2E",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Live preview iframe on hover */}
        <div className="relative w-full aspect-[4/3] bg-black overflow-hidden">
          {hovered ? (
            <iframe
              src={`/demos/${donut.file}`}
              className="w-full h-full border-0 pointer-events-none"
              style={{ transform: "scale(0.5)", transformOrigin: "0 0", width: "200%", height: "200%" }}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-6xl"
              style={{ background: `${donut.color}15` }}
            >
              🍩
            </div>
          )}

          {/* Price tag */}
          <div
            className="absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-black text-[#1A0A2E]"
            style={{
              background: donut.color,
              fontFamily: "'Fredoka', cursive",
              transform: "rotate(5deg)",
            }}
          >
            {donut.price}
          </div>
        </div>

        {/* Info bar */}
        <div className="p-4">
          <h3
            className="text-lg font-black text-white mb-1"
            style={{ fontFamily: "'Fredoka', cursive" }}
          >
            {donut.name}
          </h3>
          <p className="text-sm text-gray-400 mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {donut.description}
          </p>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            {donut.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{
                  background: `${donut.color}25`,
                  color: donut.color,
                  border: `1px solid ${donut.color}50`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
