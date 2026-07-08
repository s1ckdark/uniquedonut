# Weather Atelier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/weather` demo page that detects the user's city, fetches live weather, and generates an isometric 3D landmark image under those conditions — using Gemini and GPT image providers side by side for comparison.

**Architecture:** Client page owns geolocation + weather lookup (key-free APIs). A server Route Handler builds the prompt (user-supplied template + explicit weather injection) and calls both image providers in parallel via `Promise.allSettled`, keeping API keys server-only. Presentational components render the two results side by side.

**Tech Stack:** Next.js 16 (app router), React 19, Tailwind v4, TypeScript. APIs: BigDataCloud reverse geocode (key-free), Open-Meteo (key-free), Gemini Interactions API, OpenAI images API. Tests via `node:test` + `tsx` (already set up).

**Spec:** `docs/superpowers/specs/2026-07-07-weather-atelier-design.md`

**Conventions (from existing code):** Client pages at `src/app/<route>/page.tsx` with `"use client"`. Components in `src/components/`. Lib in `src/lib/`. The visualizer page (`src/app/visualizer/page.tsx`) is the closest template — same permission state machine, same Tailwind tokens (`#1A0A2E` bg, `#FF6B9D`/`#FFD93D`/`#6BCB77` accents, Bungee Shade headings). Route Handlers under `src/app/api/`.

---

## File Structure

- **Create:** `src/lib/weather.ts` — pure functions: WMO code → text, prompt builder, types. Plus thin network fetch wrappers.
- **Create:** `src/lib/weather.test.ts` — unit tests for the pure transforms.
- **Create:** `src/lib/image-providers.ts` — provider wrappers (Gemini, OpenAI) behind a common `ImageProvider` interface; server-only (uses `process.env`).
- **Create:** `src/app/api/weather/generate/route.ts` — Route Handler: orchestrates prompt build + parallel provider calls.
- **Create:** `src/components/LocationBar.tsx` — city/weather readout + generate button + geolocation states.
- **Create:** `src/components/WeatherCompare.tsx` — side-by-side result panels.
- **Create:** `src/app/weather/page.tsx` — client page tying it together.
- **Modify:** `src/data/donuts.ts` — add the demo card to the shop menu.
- **Create:** `.env.local.example` — documents the two keys (actual keys added by user).

---

## Task 1: Weather types + WMO code → text (TDD)

**Files:**
- Create: `src/lib/weather.ts`
- Test: `src/lib/weather.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/weather.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { describeWeather } from "./weather";

test("describeWeather: clear sky (code 0)", () => {
  assert.equal(describeWeather(0), "clear sky");
});

test("describeWeather: partly cloudy (code 2)", () => {
  assert.match(describeWeather(2), /partly cloudy/i);
});

test("describeWeather: moderate rain (code 63)", () => {
  assert.match(describeWeather(63), /rain/i);
});

test("describeWeather: snow (code 75)", () => {
  assert.match(describeWeather(75), /snow/i);
});

test("describeWeather: fog (code 45)", () => {
  assert.match(describeWeather(45), /fog/i);
});

test("describeWeather: unknown code falls back gracefully", () => {
  assert.match(describeWeather(999), /unknown/i);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './weather'`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/weather.ts`:
```ts
// Weather data + prompt assembly for the Weather Atelier.
// The describe/build functions are pure and unit-tested; the fetch wrappers
// hit the network and are exercised manually.

export interface WeatherData {
  tempMinC: number;
  tempMaxC: number;
  wmoCode: number;
}

// WMO weather interpretation codes (subset). See Open-Meteo docs.
// https://open-meteo.com/en/docs  →  "WMO Weather interpretation codes (WW)"
const WMO: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "fog",
  48: "depositing rime fog",
  51: "light drizzle",
  53: "moderate drizzle",
  55: "dense drizzle",
  61: "slight rain",
  63: "moderate rain",
  65: "heavy rain",
  71: "slight snow fall",
  73: "moderate snow fall",
  75: "heavy snow fall",
  77: "snow grains",
  80: "slight rain showers",
  81: "moderate rain showers",
  82: "violent rain showers",
  85: "slight snow showers",
  86: "heavy snow showers",
  95: "thunderstorm",
  96: "thunderstorm with slight hail",
  99: "thunderstorm with heavy hail",
};

/** Convert a WMO weather code into a natural-language description. */
export function describeWeather(wmoCode: number): string {
  return WMO[wmoCode] ?? "unknown conditions";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/weather.ts src/lib/weather.test.ts
git commit -m "feat(weather): add weather types and WMO code descriptions"
```

---

## Task 2: Prompt builder (TDD)

**Files:**
- Modify: `src/lib/weather.ts`
- Test: `src/lib/weather.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/weather.test.ts` (also import `buildPrompt`):
```ts
import { describeWeather, buildPrompt } from "./weather";

// ...existing tests...

test("buildPrompt fills the city name into the template", () => {
  const prompt = buildPrompt("서울", { tempMinC: 5, tempMaxC: 12, wmoCode: 63 });
  assert.ok(prompt.includes("서울"), "city name must appear in the prompt");
  assert.ok(
    prompt.includes("City name: 서울"),
    "city should appear in the City name line",
  );
});

test("buildPrompt appends the explicit weather clause", () => {
  const prompt = buildPrompt("London", { tempMinC: 8, tempMaxC: 14, wmoCode: 0 });
  assert.ok(
    prompt.toLowerCase().includes("current weather to render"),
    "weather injection clause header must be present",
  );
  assert.ok(
    prompt.toLowerCase().includes("clear sky"),
    "weather description must be injected",
  );
  assert.ok(prompt.includes("8"), "min temp must be injected");
  assert.ok(prompt.includes("14"), "max temp must be injected");
});

test("buildPrompt without weather data omits the weather clause cleanly", () => {
  const prompt = buildPrompt("Paris");
  assert.ok(prompt.includes("Paris"));
  assert.ok(
    !prompt.toLowerCase().includes("current weather to render"),
    "no weather clause when weather is missing",
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `buildPrompt is not a function`.

- [ ] **Step 3: Write minimal implementation**

Append to `src/lib/weather.ts`:
```ts
const PROMPT_TEMPLATE = `Present a clear, 45° top-down view of a vertical (9:16) isometric miniature 3D cartoon scene, highlighting iconic landmarks centered in the composition to showcase precise and delicate modeling.

The scene features soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadow effects. Weather elements are creatively integrated into the urban architecture, establishing a dynamic interaction between the city's landscape and atmospheric conditions, creating an immersive weather ambiance.

Use a clean, unified composition with minimalistic aesthetics and a soft, solid-colored background that highlights the main content. The overall visual style is fresh and soothing.

Display a prominent weather icon at the top-center, with the date (x-small text) and temperature range (medium text) beneath it. The city name (large text) is positioned directly above the weather icon. The weather information has no background and can subtly overlap with the buildings.

The text should match the input city's native language.
Please retrieve current weather conditions for the specified city before rendering.

City name: {city}`;

/** Build the full image prompt. When weather is supplied, an explicit
 *  description is appended — image models can't reliably search the web, so
 *  we inject concrete conditions. */
export function buildPrompt(city: string, weather?: WeatherData): string {
  let prompt = PROMPT_TEMPLATE.replace("{city}", city);
  if (weather) {
    const desc = describeWeather(weather.wmoCode);
    prompt += `\n\nCurrent weather to render: ${desc} (${weather.tempMinC}–${weather.tempMaxC}°C)`;
  }
  return prompt;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/weather.ts src/lib/weather.test.ts
git commit -m "feat(weather): add prompt builder with explicit weather injection"
```

---

## Task 3: Network fetch wrappers

**Files:**
- Modify: `src/lib/weather.ts`

These hit the network, so they aren't unit-tested. They live next to the pure functions they relate to.

- [ ] **Step 1: Add reverse-geocode and weather fetch functions**

Append to `src/lib/weather.ts`:
```ts
/** BigDataCloud reverse geocode (client-side, no API key). Returns the
 *  city/locality name in the requested language. `lang` defaults to the
 *  device locale for native-language city names. */
export interface GeoResult {
  city: string;
  countryName: string;
}

export async function fetchReverseGeocode(
  lat: number,
  lon: number,
  lang: string = "local",
): Promise<GeoResult> {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${encodeURIComponent(lang)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`reverse geocode failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    city?: string;
    locality?: string;
    principalSubdivision?: string;
    countryName?: string;
  };
  const city = data.city || data.locality || data.principalSubdivision || "Unknown";
  return { city, countryName: data.countryName ?? "" };
}

/** Open-Meteo current + daily forecast (no API key). Returns today's min/max
 *  temperature (°C) and the current WMO weather code. */
export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=weather_code&daily=temperature_2m_max,temperature_2m_min` +
    `&timezone=auto&forecast_days=1`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`weather fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    current?: { weather_code: number };
    daily?: {
      temperature_2m_max: number[];
      temperature_2m_min: number[];
    };
  };
  const wmoCode = data.current?.weather_code ?? 0;
  const tempMaxC = data.daily?.temperature_2m_max?.[0] ?? 0;
  const tempMinC = data.daily?.temperature_2m_min?.[0] ?? 0;
  return { wmoCode, tempMaxC, tempMinC };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/weather.ts
git commit -m "feat(weather): add reverse-geocode and weather network fetchers"
```

---

## Task 4: Image provider wrappers

**Files:**
- Create: `src/lib/image-providers.ts`

Server-only — uses `process.env`. Each provider returns either a base64 data URL + latency, or an error object (never throws).

- [ ] **Step 1: Create the provider module**

Create `src/lib/image-providers.ts`:
```ts
// Image-generation provider wrappers. Server-only (reads process.env secrets).
// Each provider returns a result OR an error object — never throws — so the
// Route Handler can render one provider's failure alongside the other's success.

export interface ImageResult {
  image: string; // base64 data URL, e.g. "data:image/png;base64,..."
  latencyMs: number;
}

export interface ProviderError {
  error: string;
}

export type ProviderResponse = ImageResult | ProviderError;

export interface ImageProvider {
  name: string;
  /** True when the required API key env var is set. */
  configured: boolean;
  generate(prompt: string): Promise<ProviderResponse>;
}

function isError(x: ProviderResponse): x is ProviderError {
  return "error" in x;
}

// --- Gemini (Nano Banana 2) via the Interactions API ---
const GEMINI_MODEL = "gemini-3.1-flash-image";

export const geminiProvider: ImageProvider = {
  name: "Gemini",
  get configured() {
    return Boolean(process.env.GEMINI_API_KEY);
  },
  async generate(prompt: string): Promise<ProviderResponse> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return { error: "GEMINI_API_KEY not configured" };
    const start = Date.now();
    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key,
          },
          body: JSON.stringify({
            model: GEMINI_MODEL,
            input: prompt,
            response_format: { type: "image", aspect_ratio: "9:16", image_size: "1K" },
          }),
        },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { error: `Gemini API error ${res.status}: ${text.slice(0, 200)}` };
      }
      const data = (await res.json()) as { output_image?: { data?: string } };
      const b64 = data.output_image?.data;
      if (!b64) return { error: "Gemini returned no image data" };
      return { image: `data:image/png;base64,${b64}`, latencyMs: Date.now() - start };
    } catch (err) {
      return { error: `Gemini request failed: ${(err as Error).message}` };
    }
  },
};

// --- OpenAI gpt-image-1 via the images API ---
const OPENAI_MODEL = "gpt-image-1";

export const openaiProvider: ImageProvider = {
  name: "OpenAI",
  get configured() {
    return Boolean(process.env.OPENAI_API_KEY);
  },
  async generate(prompt: string): Promise<ProviderResponse> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return { error: "OPENAI_API_KEY not configured" };
    const start = Date.now();
    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          prompt,
          size: "1024x1792", // closest 9:16 option
          n: 1,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { error: `OpenAI API error ${res.status}: ${text.slice(0, 200)}` };
      }
      const data = (await res.json()) as { data?: { b64_json?: string }[] };
      const b64 = data.data?.[0]?.b64_json;
      if (!b64) return { error: "OpenAI returned no image data" };
      return { image: `data:image/png;base64,${b64}`, latencyMs: Date.now() - start };
    } catch (err) {
      return { error: `OpenAI request failed: ${(err as Error).message}` };
    }
  },
};

export const allProviders: ImageProvider[] = [geminiProvider, openaiProvider];

export { isError };
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/image-providers.ts
git commit -m "feat(weather): add Gemini and OpenAI image provider wrappers"
```

---

## Task 5: Route Handler

**Files:**
- Create: `src/app/api/weather/generate/route.ts`

Re-fetches weather server-side (authoritative), builds the prompt, calls both providers in parallel with `Promise.allSettled`, returns normalized results.

- [ ] **Step 1: Create the route handler**

Create `src/app/api/weather/generate/route.ts`:
```ts
import { NextResponse } from "next/server";
import { buildPrompt, fetchWeather } from "@/lib/weather";
import { allProviders, type ProviderResponse } from "@/lib/image-providers";

// Always dynamic: reads request body + process.env secrets.
export const dynamic = "force-dynamic";

interface GenerateBody {
  city: string;
  lat?: number;
  lon?: number;
}

export async function POST(request: Request) {
  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { city, lat, lon } = body;
  if (!city || typeof city !== "string") {
    return NextResponse.json({ error: "city is required" }, { status: 400 });
  }

  // Re-fetch weather server-side for authority (falls back to city-only if it fails).
  let weather;
  if (typeof lat === "number" && typeof lon === "number") {
    try {
      weather = await fetchWeather(lat, lon);
    } catch {
      weather = undefined;
    }
  }
  const prompt = buildPrompt(city, weather);

  // Call every configured provider in parallel; one failure does not block the rest.
  const settled = await Promise.allSettled(
    allProviders.map((provider) => provider.generate(prompt)),
  );

  const results: Record<string, ProviderResponse> = {};
  allProviders.forEach((provider, i) => {
    const outcome = settled[i];
    results[provider.name] = outcome.status === "fulfilled"
      ? outcome.value
      : { error: `provider threw: ${outcome.reason}` };
  });

  return NextResponse.json({ prompt, weather, results });
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/weather/generate/route.ts
git commit -m "feat(weather): add generate route handler with parallel providers"
```

---

## Task 6: LocationBar component

**Files:**
- Create: `src/components/LocationBar.tsx`

Shows the resolved city + weather readout, the geolocation permission states, a manual city-input fallback, and the generate button.

- [ ] **Step 1: Create the component**

Create `src/components/LocationBar.tsx`:
```tsx
"use client";

import { useState } from "react";
import type { WeatherData } from "@/lib/weather";

interface LocationBarProps {
  geoStatus: "idle" | "requesting" | "granted" | "denied";
  city: string | null;
  weather: WeatherData | null;
  generating: boolean;
  onGenerate: (city: string, lat?: number, lon?: number) => void;
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
            className="mb-4 rounded-full bg-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/20 cursor-pointer"
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
              className="rounded-full bg-[#6BCB77] px-4 py-2 text-sm font-bold text-black disabled:opacity-50 cursor-pointer"
            >
              생성
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={onRetryGeo}
          className="rounded-full bg-[#6BCB77] px-6 py-2 font-bold text-black cursor-pointer"
        >
          📍 내 위치 찾기
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/LocationBar.tsx
git commit -m "feat(weather): add LocationBar component"
```

---

## Task 7: WeatherCompare component

**Files:**
- Create: `src/components/WeatherCompare.tsx`

Renders the two provider results side by side with name, latency, and image (or error/placeholder). Includes a collapsible prompt view.

- [ ] **Step 1: Create the component**

Create `src/components/WeatherCompare.tsx`:
```tsx
"use client";

import { useState } from "react";
import type { ProviderResponse } from "@/lib/image-providers";

interface WeatherCompareProps {
  results: Record<string, ProviderResponse> | null;
  prompt: string | null;
}

function Panel({ name, response }: { name: string; response?: ProviderResponse }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="font-bold text-[#6BCB77]">{name}</span>
        {response && "latencyMs" in response && (
          <span className="text-xs text-white/50">{response.latencyMs}ms</span>
        )}
      </div>
      <div className="p-2">
        {!response ? (
          <div className="flex aspect-[9/16] max-h-96 items-center justify-center text-white/30">
            대기 중
          </div>
        ) : "error" in response ? (
          <div className="flex aspect-[9/16] max-h-96 items-center justify-center p-4 text-center text-sm text-[#FF6B9D]">
            {response.error}
          </div>
        ) : (
          <img
            src={response.image}
            alt={`${name} result`}
            className="mx-auto max-h-96 rounded"
          />
        )}
      </div>
    </div>
  );
}

export default function WeatherCompare({ results, prompt }: WeatherCompareProps) {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <section className="mt-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Panel name="Gemini" response={results?.Gemini} />
        <Panel name="OpenAI" response={results?.OpenAI} />
      </div>

      {prompt && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowPrompt((s) => !s)}
            className="text-xs text-white/50 underline hover:text-white/70 cursor-pointer"
          >
            {showPrompt ? "프롬프트 숨기기" : "사용된 프롬프트 보기"}
          </button>
          {showPrompt && (
            <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white/60">
              {prompt}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/WeatherCompare.tsx
git commit -m "feat(weather): add WeatherCompare component"
```

---

## Task 8: /weather page

**Files:**
- Create: `src/app/weather/page.tsx`

Ties together geolocation, weather lookup, the generate call, and the comparison UI. Mirrors the visualizer's permission state machine.

- [ ] **Step 1: Create the page**

Create `src/app/weather/page.tsx`:
```tsx
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

  async function handleGenerate(cityName: string, lat?: number, lon?: number) {
    setGenerating(true);
    setResults(null);
    setPrompt(null);
    try {
      const res = await fetch("/api/weather/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: cityName, lat, lon }),
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
              textShadow: "0 0 20px rgba(255,107,157,0.5), 3px 3px 0px #FFD93D",
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
          onGenerate={(c) => handleGenerate(c, coords?.lat, coords?.lon)}
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
```

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: build succeeds, `/weather` route present.

- [ ] **Step 3: Commit**

```bash
git add src/app/weather/page.tsx
git commit -m "feat(weather): add /weather page"
```

---

## Task 9: List the demo in the shop + env example

**Files:**
- Modify: `src/data/donuts.ts`
- Create: `.env.local.example`

- [ ] **Step 1: Add the donut entry**

In `src/data/donuts.ts`, add after the `ascii-oven` entry (inside the `allDonuts` array, before the closing `];`):
```ts
  {
    slug: "weather-atelier",
    name: "Weather Atelier",
    description: "Landmarks painted in live weather, by two AIs",
    route: "/weather",
    category: "Chef's Special",
    tags: ["Image", "AI"],
    price: "$9.00",
    color: "#00ccff",
  },
```

- [ ] **Step 2: Update the flavor count**

In `src/app/page.tsx`, change `20 flavors available` to `21 flavors available`.

- [ ] **Step 3: Create the env example file**

Create `.env.local.example`:
```
# Weather Atelier image providers. Copy to .env.local and fill in.
# Without a key, that provider's panel shows "not configured" gracefully.
GEMINI_API_KEY=
OPENAI_API_KEY=
```

- [ ] **Step 4: Verify it builds**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/data/donuts.ts src/app/page.tsx .env.local.example
git commit -m "feat(weather): list Weather Atelier in shop and add env example"
```

---

## Task 10: Final verification

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass (weather + prior ascii/ansi tests).

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: build succeeds, `/weather` and `/api/weather/generate` routes present.

- [ ] **Step 3: Manual smoke test (requires keys)**

Run: `npm run dev`
Then open `http://localhost:3000/weather` and verify:
1. On load, geolocation prompts; after allow, city + temp appear.
2. Click "🎨 이미지 생성" → both panels populate (or show "not configured" if keys are absent).
3. Deny geolocation → manual city input appears and works.
4. Click "사용된 프롬프트 보기" → prompt with city + weather clause is shown.
5. Open `/shop` → "Weather Atelier" card is present and links to `/weather`.

If keys are absent, the panels should show "GEMINI_API_KEY not configured" / "OPENAI_API_KEY not configured" respectively — this is the expected graceful degradation.

- [ ] **Step 4: Final commit if anything was fixed during smoke test**

```bash
git add -A
git commit -m "chore(weather): final smoke-test fixes"
```
(Only if there were changes; otherwise skip.)
