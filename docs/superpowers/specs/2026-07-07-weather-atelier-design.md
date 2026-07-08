# Weather Atelier (`/weather`) — Design

**Date:** 2026-07-07
**Status:** Approved (pending spec review)
**Route:** `/weather`

## Goal

A demo page that detects the user's current city, fetches its live weather,
and generates an isometric 3D miniature image of an iconic landmark under
those weather conditions — using two image-generation providers side by side
for comparison.

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Output form | Image generation (isometric 3D landmark + weather) |
| Providers compared | Gemini image vs GPT image (2-way). Anthropic/zai/local excluded — they can't generate images |
| Location source | `navigator.geolocation` → BigDataCloud reverse geocoding (client-side, no key) → city name (native language) |
| Weather source | Open-Meteo (no API key required) |
| Prompt | User-supplied template with `{{current location}}` filled, plus explicit weather injected |
| API call location | Server-side Route Handler (`/api/weather/generate`) — API keys must stay server-only |

## Why these decisions

- **Provider scope narrowed to image-capable ones.** The original ask listed
  Anthropic, GPT, zai, Gemini, and local. Of these, only Gemini image and GPT
  image (`gpt-image-1`) generate images. Comparing image output against
  text-only models would be unfair and meaningless, so we compare the two that
  can actually produce the artifact.
- **Server-side provider calls.** Unlike every other demo in this project
  (which are pure client-side), this one needs secret API keys. Exposing them
  in the client bundle is unacceptable, so a Route Handler owns the calls. The
  page is still a client component for the interactive UI.
- **Weather is injected, not "retrieved by the model."** The prompt template
  says *"retrieve current weather before rendering,"* but image models cannot
  reliably search the web. We fetch weather via Open-Meteo on the server and
  insert a concrete description into the prompt. This is the key reliability
  fix.

## Non-goals (YAGNI)

- No local Stable Diffusion support (explicitly dropped in brainstorming).
- No image storage, gallery, or history. Generated images live only in memory.
- No landmark database/mapping — landmark selection is delegated to the model
  via "iconic landmarks of {city}" in the prompt.
- No text-only provider comparison mode.
- No streaming/progress beyond a loading state.

## File Structure

```
src/app/weather/page.tsx                    # Client page: UI, geolocation, comparison
src/app/api/weather/generate/route.ts       # Route Handler: calls providers in parallel
src/lib/weather.ts                          # Pure: Open-Meteo fetch, weather-code → text, prompt builder
src/lib/weather.test.ts                     # Unit tests for the pure functions
src/lib/image-providers.ts                  # Provider wrappers (Gemini, OpenAI) sharing one interface
src/components/WeatherCompare.tsx           # Side-by-side result panels
src/components/LocationBar.tsx              # City/weather readout + generate button
```

Responsibility split:
- `src/lib/weather.ts` — **pure**: city/coordinate resolution, weather fetch,
  WMO code → natural language, prompt assembly. No provider SDK, no React.
  Unit-tested.
- `src/lib/image-providers.ts` — provider API calls behind a common
  `ImageProvider` interface. Server-only (uses `process.env` secrets).
- `src/app/api/weather/generate/route.ts` — orchestrates: builds prompt, calls
  both providers in parallel with `Promise.allSettled`, returns a normalized
  result. One provider failing does not fail the other.
- `src/app/weather/page.tsx` — client UI: geolocation, weather lookup,
  generate button, renders comparison. Mirrors the visualizer's permission UX.
- `src/components/*` — presentational.

## Prompt Template

The user-supplied template (used verbatim), with `{{current location}}`
replaced by the resolved city name and an explicit weather clause appended:

```
Present a clear, 45° top-down view of a vertical (9:16) isometric miniature 3D
cartoon scene, highlighting iconic landmarks centered in the composition to
showcase precise and delicate modeling.

The scene features soft, refined textures with realistic PBR materials and
gentle, lifelike lighting and shadow effects. Weather elements are creatively
integrated into the urban architecture, establishing a dynamic interaction
between the city's landscape and atmospheric conditions, creating an immersive
weather ambiance.

Use a clean, unified composition with minimalistic aesthetics and a soft,
solid-colored background that highlights the main content. The overall visual
style is fresh and soothing.

Display a prominent weather icon at the top-center, with the date (x-small text)
and temperature range (medium text) beneath it. The city name (large text) is
positioned directly above the weather icon. The weather information has no
background and can subtly overlap with the buildings.

The text should match the input city's native language.

City name: {city}

Current weather to render: {weatherDescription} ({tempRange})
```

The `weatherDescription` comes from `describeWeather(wmoCode)` and
`tempRange` from the Open-Meteo daily min/max. This explicit injection is what
makes the output reliable regardless of the model's web-search ability.

## Data Flow

1. Page loads → request geolocation (state machine:
   `idle | requesting | granted | denied`, same UX as `/visualizer`).
2. On coords → `fetchReverseGeocode(lat, lon)` (BigDataCloud reverse
   geocode-client endpoint, no key) → city name in native language;
   `fetchWeather(lat, lon)` (Open-Meteo, no key) → temp + WMO code.
   Both run client-side (no keys needed).
3. User clicks "Generate" → `POST /api/weather/generate` with
   `{ city, lat, lon }`.
4. Server re-fetches fresh weather (keeps server authoritative), builds the
   prompt, calls Gemini + GPT image **in parallel** via `Promise.allSettled`.
5. Each provider returns `{ image: base64DataUrl, latencyMs }` or
   `{ error: string }`.
6. Page renders both panels. If geolocation was denied, a manual city-input
   field is shown (Open-Meteo forward geocoding resolves it to coords).

## Pure Functions (`src/lib/weather.ts`)

- `describeWeather(wmoCode: number): string` — WMO code → natural language
  ("63" → "moderate rain").
- `buildPrompt(city: string, weather: WeatherData): string` — fills the
  template + appends weather clause. Template stored as a module constant.
- `fetchReverseGeocode(lat, lon)` / `fetchWeather(lat, lon)` — thin fetch
  wrappers. `fetchReverseGeocode` calls BigDataCloud's client-side endpoint
  (`https://api.bigdatacloud.net/data/reverse-geocode-client`) with
  `localityLanguage=local` to get the native-language city name.
  `fetchWeather` calls Open-Meteo. These hit the network so they aren't
  unit-tested directly; the pure transforms above are.

```ts
export interface WeatherData {
  tempMinC: number;
  tempMaxC: number;
  wmoCode: number;
}
```

## Provider Interface (`src/lib/image-providers.ts`)

```ts
export interface ImageResult {
  image: string;        // base64 data URL
  latencyMs: number;
}
export interface ProviderError {
  error: string;
}
export interface ImageProvider {
  name: string;
  generate(prompt: string): Promise<ImageResult | ProviderError>;
}
```

Two implementations:
- **Gemini** (`GEMINI_API_KEY`): `gemini-3.1-flash-image` (Nano Banana 2,
  the current recommended image model) via the Interactions API endpoint
  `POST https://generativelanguage.googleapis.com/v1beta/interactions`. Request
  body: `{ model, input, response_format: { type: "image", aspect_ratio: "9:16",
  image_size: "1K" } }`. Image extracted from the JSON response's
  `output_image.data` field as base64. Auth header `x-goog-api-key`.
- **OpenAI** (`OPENAI_API_KEY`): `gpt-image-1` via
  `POST https://api.openai.com/v1/images/generations`. Request body:
  `{ model, prompt, size: "1024x1792" }` (1024×1792 ≈ 9:16). Image extracted
  from `data[0].b64_json`. Auth header `Authorization: Bearer <key>`. Note:
  `response_format` is not accepted by gpt-image-1 — it always returns b64_json.

If a key is absent, the provider's `generate` returns
`{ error: "API key not configured" }` rather than throwing — so the UI can
show that provider as unavailable while the other still works.

## Route Handler (`/api/weather/generate`)

- `POST`, accepts `{ city: string, lat: number, lon: number }`.
- Re-fetches weather server-side (authoritative), builds prompt, dispatches to
  both providers via `Promise.allSettled`.
- Returns `{ gemini: ImageResult | ProviderError, openai: ... , prompt: string }`.
- Marked dynamic (uses request body + env). No caching.

## UI Components

- **`LocationBar`** — shows resolved city, current temp + weather description,
  and a "Generate" button. Renders the geolocation permission states. Falls
  back to a manual city input when denied.
- **`WeatherCompare`** — two panels side by side (stack on mobile). Each panel:
  provider name, latency, image (or error/placeholder), click-to-zoom.
  Shows the shared prompt in a collapsible section.

## Styling

Reuse Unique Donut tokens: `#1A0A2E` background, `#FF6B9D/#FFD93D/#6BCB77`
accents, Bungee Shade header "WEATHER ATELIER". Result panels borrow the
visualizer's framed-canvas look.

## Error Handling

- **geolocation denied/unsupported** → manual city input fallback.
- **Open-Meteo failure** → proceed with city name only (weather clause
  omitted, prompt still valid).
- **One provider fails / key missing** → that panel shows the error; the other
  still renders. `Promise.allSettled` guarantees isolation.
- **Both providers fail** → clear message, prompt still shown for transparency.
- **Rate-limit / double-click** → generate button disabled while in-flight.

## API Keys (added later by user)

User will populate `.env.local`:
```
GEMINI_API_KEY=...
OPENAI_API_KEY=...
```
The code degrades gracefully when these are absent — the corresponding panel
shows "API key not configured" and the other provider still runs. This lets
the page be built and shipped before keys exist.

## Testing

`src/lib/weather.test.ts` covers the pure transforms:
- `describeWeather` for representative WMO codes (clear, rain, snow, fog).
- `buildPrompt` interpolates the city name and includes the weather clause.
- `buildPrompt` omits the weather clause gracefully when weather is missing.

Provider calls and Route Handler are network/key-dependent → manual
verification only.

## Open question resolved during implementation

- Confirm exact Gemini image model id and OpenAI image model id against the
  live APIs at implementation time (model catalogs shift); the provider
  wrappers keep the model id in one constant each so it's a one-line change.
