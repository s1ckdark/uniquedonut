"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DeviceScene from "@/components/DeviceScene";
import {
  devices as curated,
  DEFAULT_SELECTION,
  type Device,
} from "@/lib/devices";

const MAX_SELECTED = 8;

const inputCls =
  "w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#00ccff]";

export default function PhonesPage() {
  const [selectedSlugs, setSelectedSlugs] =
    useState<string[]>(DEFAULT_SELECTION);
  const [customDevices, setCustomDevices] = useState<Device[]>([]);
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewKey, setViewKey] = useState(0);

  // custom form state
  const [name, setName] = useState("내 기기");
  const [width, setWidth] = useState("71");
  const [height, setHeight] = useState("150");
  const [depth, setDepth] = useState("7.8");
  const [screen, setScreen] = useState("6.1");
  const [color, setColor] = useState("#FF6B9D");
  const [formError, setFormError] = useState("");

  const allDevices = useMemo(
    () => [...curated, ...customDevices],
    [customDevices],
  );
  const selected = useMemo(
    () =>
      selectedSlugs
        .map((slug) => allDevices.find((d) => d.slug === slug))
        .filter((d): d is Device => Boolean(d)),
    [selectedSlugs, allDevices],
  );

  function toggle(slug: string) {
    setSelectedSlugs((current) => {
      if (current.includes(slug)) {
        return current.length > 1 ? current.filter((s) => s !== slug) : current;
      }
      if (current.length >= MAX_SELECTED) return current;
      return [...current, slug];
    });
  }

  function addCustom() {
    const w = Number(width);
    const h = Number(height);
    const d = Number(depth);
    const s = Number(screen);
    if (!name.trim() || !(w > 0) || !(h > 0) || !(d > 0) || !(s > 0)) {
      setFormError("이름과 치수(양수)를 모두 채워주세요!");
      return;
    }
    if (!/^#[0-9a-f]{6}$/i.test(color)) {
      setFormError("색상이 이상해요!");
      return;
    }
    const device: Device = {
      slug: `custom-${Date.now()}`,
      name: name.trim(),
      brand: "커스텀",
      widthMm: w,
      heightMm: h,
      depthMm: d,
      screenIn: s,
      color,
      custom: true,
    };
    setFormError("");
    setCustomDevices((cur) => [...cur, device]);
    setSelectedSlugs((cur) =>
      cur.length >= MAX_SELECTED ? cur : [...cur, device.slug],
    );
  }

  // extremes for the stats table
  const maxW = Math.max(...selected.map((d) => d.widthMm));
  const maxH = Math.max(...selected.map((d) => d.heightMm));
  const maxD = Math.max(...selected.map((d) => d.depthMm));
  const maxS = Math.max(...selected.map((d) => d.screenIn));

  return (
    <div className="min-h-screen bg-[#1A0A2E] text-[#FEFEFE]">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/shop"
            className="rounded-full bg-[#FF6B9D]/15 px-4 py-2 text-sm font-bold text-[#FF6B9D] transition hover:scale-105"
          >
            ← Shop
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAutoRotate((r) => !r)}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/20 cursor-pointer"
            >
              {autoRotate ? "⏸ 자동회전 끄기" : "▶ 자동회전"}
            </button>
            <button
              type="button"
              onClick={() => setViewKey((k) => k + 1)}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/20 cursor-pointer"
            >
              ⟲ 뷰 초기화
            </button>
          </div>
        </div>

        <header className="mb-8 text-center">
          <h1
            className="text-4xl font-black leading-none md:text-6xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#00ccff",
              textShadow:
                "0 0 20px rgba(0,204,255,0.5), 3px 3px 0px #FF6B9D",
            }}
          >
            PHONE LAB
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            기기 크기 3D 비교 📱
          </p>
        </header>

        {/* device chips */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="mb-3 text-sm text-white/50">
            비교할 기기를 골라세요 (최대 {MAX_SELECTED}개)
          </p>
          <div className="flex flex-wrap gap-2">
            {allDevices.map((d) => {
              const on = selectedSlugs.includes(d.slug);
              return (
                <button
                  key={d.slug}
                  type="button"
                  onClick={() => toggle(d.slug)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition cursor-pointer ${
                    on ? "text-black" : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                  style={on ? { background: d.color } : undefined}
                >
                  {d.custom && "🎨 "}
                  {d.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3D scene */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1030]">
          <DeviceScene
            key={viewKey}
            selected={selected}
            autoRotate={autoRotate}
          />
          <p className="border-t border-white/10 px-4 py-2 text-center text-xs text-white/40">
            드래그로 회전 · 휠/핀치로 확대 · 실제 mm 스케일
          </p>
        </div>

        {/* stats table */}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-5">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-white/40">
                <th className="pb-2">기기</th>
                <th className="pb-2">가로 (mm)</th>
                <th className="pb-2">세로 (mm)</th>
                <th className="pb-2">두께 (mm)</th>
                <th className="pb-2">화면 (인치)</th>
              </tr>
            </thead>
            <tbody>
              {selected.map((d) => (
                <tr key={d.slug} className="border-t border-white/10">
                  <td className="py-2 font-bold">
                    <span
                      className="mr-2 inline-block h-3 w-3 rounded-full align-middle"
                      style={{ background: d.color }}
                    />
                    {d.name}
                  </td>
                  <td className={d.widthMm === maxW ? "font-black text-[#FF6B9D]" : ""}>
                    {d.widthMm}
                  </td>
                  <td className={d.heightMm === maxH ? "font-black text-[#FF6B9D]" : ""}>
                    {d.heightMm}
                  </td>
                  <td className={d.depthMm === maxD ? "font-black text-[#FF6B9D]" : ""}>
                    {d.depthMm}
                  </td>
                  <td className={d.screenIn === maxS ? "font-black text-[#FF6B9D]" : ""}>
                    {d.screenIn}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-white/40">
            🩷 해당 열의 최대값 하이라이트
          </p>
        </div>

        {/* custom form */}
        <div className="mt-6 rounded-2xl border border-[#FFD93D]/30 bg-[#FFD93D]/10 p-5">
          <h2
            className="mb-3 text-xl font-black"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            🎨 내 기기 추가하기
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              aria-label="기기 이름"
            />
            <input
              className={inputCls}
              type="number"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="가로 mm"
              aria-label="가로 mm"
            />
            <input
              className={inputCls}
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="세로 mm"
              aria-label="세로 mm"
            />
            <input
              className={inputCls}
              type="number"
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              placeholder="두께 mm"
              aria-label="두께 mm"
            />
            <input
              className={inputCls}
              type="number"
              step="0.1"
              value={screen}
              onChange={(e) => setScreen(e.target.value)}
              placeholder="화면 인치"
              aria-label="화면 인치"
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label="색상"
                className="h-10 w-12 cursor-pointer rounded-lg border border-white/15 bg-transparent"
              />
              <button
                type="button"
                onClick={addCustom}
                className="flex-1 rounded-xl bg-[#FFD93D] px-3 py-2 text-sm font-black text-black transition hover:opacity-90 cursor-pointer"
              >
                추가
              </button>
            </div>
          </div>
          {formError && (
            <p className="mt-2 text-sm text-[#FF6B9D]">{formError}</p>
          )}
        </div>
      </main>
    </div>
  );
}
