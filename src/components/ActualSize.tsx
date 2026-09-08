"use client";

import { useState } from "react";
import type { Device } from "@/lib/devices";

// Actual-size view: calibrate px-per-mm against a real 10mm ruler with the
// slider, then every selected device renders at true physical size.
// Sizes are never scaled down — the row scrolls instead.

const DEFAULT_PX_PER_MM = 96 / 25.4; // ≈3.78, the 96dpi CSS assumption

export default function ActualSize({ selected }: { selected: Device[] }) {
  const [pxPerMm, setPxPerMm] = useState(DEFAULT_PX_PER_MM);
  const bar10mm = 10 * pxPerMm;

  return (
    <div className="mt-6 rounded-2xl border border-[#6BCB77]/30 bg-[#6BCB77]/10 p-5">
      <h2
        className="text-xl font-black"
        style={{ fontFamily: "'Fredoka', cursive", color: "#6BCB77" }}
      >
        📏 실제 크기로 보기
      </h2>

      {/* calibration */}
      <div className="mt-4 rounded-xl bg-black/30 p-4">
        <p className="text-sm leading-relaxed text-white/70">
          진짜 자(또는 자 눈금이 있는 것)를 화면에 대고,{" "}
          <b className="text-[#6BCB77]">아래 막대가 정확히 10mm</b>가 되도록
          슬라이더를 움직여보세요. 그러면 기기들이 실제 크기로 보여요!
        </p>
        <div className="mt-3 flex items-center gap-3">
          {/* 10mm reference bar with end ticks */}
          <div className="flex flex-col items-center">
            <div className="flex items-end" aria-label="10mm 기준 막대">
              <span className="h-4 w-px bg-[#6BCB77]" />
              <div
                className="h-2 border-x border-[#6BCB77] bg-[#6BCB77]"
                style={{ width: `${bar10mm.toFixed(1)}px` }}
              />
              <span className="h-4 w-px bg-[#6BCB77]" />
            </div>
            <span className="mt-1 font-mono text-xs text-[#6BCB77]">10mm</span>
          </div>
          <input
            type="range"
            min={2.8}
            max={5.5}
            step={0.01}
            value={pxPerMm}
            onChange={(e) => setPxPerMm(Number(e.target.value))}
            className="flex-1 accent-[#6BCB77] cursor-pointer"
            aria-label="10mm 보정 슬라이더"
          />
          <button
            type="button"
            onClick={() => setPxPerMm(DEFAULT_PX_PER_MM)}
            className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70 transition hover:bg-white/20 cursor-pointer"
          >
            기본값
          </button>
        </div>
        <p className="mt-1 text-right font-mono text-xs text-white/40">
          {pxPerMm.toFixed(2)} px/mm
        </p>
      </div>

      {/* actual-size silhouettes — never scaled, scroll instead */}
      <div className="mt-5 overflow-x-auto pb-2">
        <div className="flex items-end gap-6" style={{ width: "max-content" }}>
          {selected.map((d) => {
            const w = d.widthMm * pxPerMm;
            const h = d.heightMm * pxPerMm;
            return (
              <div key={d.slug} className="flex flex-col items-center">
                <div
                  className="border-2"
                  style={{
                    width: `${w.toFixed(1)}px`,
                    height: `${h.toFixed(1)}px`,
                    background: d.color,
                    borderColor: "rgba(255,255,255,0.25)",
                    borderRadius: `${(d.widthMm * 0.08).toFixed(1)}px`,
                  }}
                >
                  <div
                    className="h-full w-full"
                    style={{
                      margin: `${(d.heightMm * 0.02 * pxPerMm).toFixed(1)}px ${(d.widthMm * 0.04 * pxPerMm).toFixed(1)}px`,
                      width: `${(d.widthMm * 0.92 * pxPerMm).toFixed(1)}px`,
                      height: `${(d.heightMm * 0.96 * pxPerMm).toFixed(1)}px`,
                      background: "linear-gradient(160deg, #123, #1d4ed8)",
                      borderRadius: `${(d.widthMm * 0.05).toFixed(1)}px`,
                      opacity: 0.85,
                    }}
                  />
                </div>
                <p className="mt-2 max-w-[140px] text-center text-xs font-bold text-white/70">
                  {d.name}
                  <span className="block font-mono font-normal text-white/40">
                    {d.widthMm}×{d.heightMm}mm
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-xs text-white/40">
        💡 브라우저 확대/축소(⌘±) 상태에서도 다시 보정하면 정확해져요.
      </p>
    </div>
  );
}
