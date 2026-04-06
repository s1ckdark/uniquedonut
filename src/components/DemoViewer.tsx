"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Donut } from "@/data/donuts";

export default function DemoViewer({ donut }: { donut: Donut }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        window.location.href = "/shop";
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "#1A0A2E" }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{
          background: `linear-gradient(90deg, ${donut.color}, ${donut.color}88)`,
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🍩</span>
          <h1
            className="text-lg font-bold text-[#1A0A2E]"
            style={{ fontFamily: "'Fredoka', cursive" }}
          >
            {donut.name}
          </h1>
          <div className="flex gap-2 ml-2">
            {donut.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#1A0A2E]/20 text-[#1A0A2E]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <Link
          href="/shop"
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all hover:scale-105"
          style={{
            background: "#1A0A2E",
            color: donut.color,
          }}
        >
          ← Back to Menu
          <span className="text-xs opacity-60">(ESC)</span>
        </Link>
      </div>

      {/* Demo iframe */}
      <iframe
        src={`/demos/${donut.file}`}
        className="flex-1 w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
      />
    </div>
  );
}
