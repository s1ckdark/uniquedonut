"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import LocationBar from "@/components/LocationBar";
import WeatherCompare from "@/components/WeatherCompare";
import { fetchReverseGeocode, fetchWeather, type WeatherData } from "@/lib/weather";
import type { ProviderResponse } from "@/lib/image-providers";

type GeoStatus = "idle" | "requesting" | "granted" | "denied";

export default function WeatherPage() {
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<Record<string, ProviderResponse> | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);

  const resolveLocation = useCallback(async (lat: number, lon: number) => {
    setCoords({ lat, lon });
    try {
      const geo = await fetchReverseGeocode(lat, lon);
      setCity(geo.city);
    } catch {
      setCity("Unknown");
    }
    try {
      setWeather(await fetchWeather(lat, lon));
    } catch {
      setWeather(null);
    }
    setGeoStatus("granted");
  }, []);

  const requestGeo = useCallback(() => {
    setGeoStatus("requesting");
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolveLocation(pos.coords.latitude, pos.coords.longitude),
      () => setGeoStatus("denied"),
    );
  }, [resolveLocation]);

  // Auto-request on first mount.
  useEffect(() => {
    requestGeo();
  }, [requestGeo]);

  async function handleGenerate(cityName: string) {
    setGenerating(true);
    setResults(null);
    setPrompt(null);
    try {
      const res = await fetch("/api/weather/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: cityName,
          lat: coords?.lat,
          lon: coords?.lon,
        }),
      });
      const data = (await res.json()) as {
        prompt?: string;
        results?: Record<string, ProviderResponse>;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setPrompt(data.prompt ?? null);
      setResults(data.results ?? null);
    } catch (err) {
      setResults({
        Gemini: { error: (err as Error).message },
        OpenAI: { error: (err as Error).message },
      });
    } finally {
      setGenerating(false);
    }
  }

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
        </div>
        <header className="mb-8 text-center">
          <h1
            className="text-5xl font-black leading-none md:text-7xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#FF6B9D",
              textShadow:
                "0 0 20px rgba(255,107,157,0.5), 3px 3px 0px #FFD93D",
            }}
          >
            WEATHER ATELIER
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            내 도시의 날씨를 랜드마크와 함께 그리기 🌦️
          </p>
        </header>

        <LocationBar
          geoStatus={geoStatus}
          city={city}
          weather={weather}
          generating={generating}
          onGenerate={handleGenerate}
          onRetryGeo={requestGeo}
        />

        {generating && (
          <p className="py-12 text-center text-white/50">
            두 provider가 동시에 이미지를 굽고 있습니다...
          </p>
        )}

        {results && <WeatherCompare results={results} prompt={prompt} />}

        <footer className="mt-12 text-center text-xs text-white/30">
          ⚠️ 이미지 생성 시 실제 API 비용이 발생합니다
        </footer>
      </main>
    </div>
  );
}
