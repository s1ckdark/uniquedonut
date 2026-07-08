"use client";

import { useState } from "react";
import type { WeatherData } from "@/lib/weather";

interface LocationBarProps {
  geoStatus: "idle" | "requesting" | "granted" | "denied";
  city: string | null;
  weather: WeatherData | null;
  generating: boolean;
  onGenerate: (city: string) => void;
  onRetryGeo: () => void;
}

export default function LocationBar({
  geoStatus,
  city,
  weather,
  generating,
  onGenerate,
  onRetryGeo,
}: LocationBarProps) {
  const [manualCity, setManualCity] = useState("");

  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
      {geoStatus === "granted" && city ? (
        <div>
          <p
            className="text-3xl font-black"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            {city}
          </p>
          {weather && (
            <p className="mt-1 text-lg text-white/70">
              {weather.tempMinC}–{weather.tempMaxC}°C
            </p>
          )}
          <button
            type="button"
            disabled={generating}
            onClick={() => onGenerate(city)}
            className="mt-4 rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#FF8C42] px-8 py-3 font-bold text-black transition hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {generating ? "생성 중..." : "🎨 이미지 생성"}
          </button>
        </div>
      ) : geoStatus === "requesting" ? (
        <p className="text-white/70">위치를 확인하는 중...</p>
      ) : geoStatus === "denied" ? (
        <div>
          <p className="mb-3 text-[#FF6B9D]">위치 권한이 거부되었습니다.</p>
          <button
            type="button"
            onClick={onRetryGeo}
            className="mb-4 rounded-full bg-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/20 cursor-pointer"
          >
            다시 시도
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualCity.trim()) onGenerate(manualCity.trim());
            }}
          >
            <input
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              placeholder="도시명 직접 입력 (예: Seoul)"
              className="mr-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-[#FF6B9D]"
            />
            <button
              type="submit"
              disabled={generating}
              className="rounded-full bg-[#6BCB77] px-4 py-2 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              생성
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={onRetryGeo}
          className="rounded-full bg-[#6BCB77] px-6 py-2 font-bold text-black transition hover:opacity-90 cursor-pointer"
        >
          📍 내 위치 찾기
        </button>
      )}
    </div>
  );
}
