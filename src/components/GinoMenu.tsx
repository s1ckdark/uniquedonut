"use client";

import Link from "next/link";
import { useState } from "react";
import { ginoContents } from "@/data/gino";

export default function GinoMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {open && (
        <button
          type="button"
          aria-label="메뉴 닫기"
          className="fixed inset-0 z-10 cursor-default"
          onClick={() => setOpen(false)}
        />
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="relative z-20 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all hover:scale-105 cursor-pointer"
        style={{
          background: "#FF8C4220",
          color: "#FF8C42",
          border: "1px solid #FF8C4250",
        }}
      >
        <span>gino</span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#241040] py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <p className="px-4 pb-1 pt-2 text-xs font-bold uppercase tracking-widest text-white/30">
            🎓 Gino's Learning
          </p>
          {ginoContents.map((item) => (
            <Link
              key={item.slug}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-white/10"
            >
              <span className="text-lg">{item.emoji}</span>
              <span className="font-bold" style={{ color: item.color }}>
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
