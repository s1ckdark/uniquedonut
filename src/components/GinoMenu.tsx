"use client";

import Link from "next/link";
import { useState } from "react";
import { getRouteDemos } from "@/data/donuts";

export default function GinoMenu() {
  const [open, setOpen] = useState(false);
  const demos = getRouteDemos();

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
          {demos.map((demo) => (
            <Link
              key={demo.slug}
              href={demo.route!}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-white/10"
            >
              <span className="font-bold" style={{ color: demo.color }}>
                {demo.name}
              </span>
              <span className="text-xs text-white/30">{demo.price}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
