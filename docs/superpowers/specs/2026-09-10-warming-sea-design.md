# Warming Sea (`/sea`) — Design

**Date:** 2026-09-10
**Status:** Approved
**Route:** `/sea` (shop listing: "Warming Sea")

## Goal

A data-viz demo centered on Jeju island: fetch three years of real sea
surface temperature (SST) from the Open-Meteo Marine API (key-free), render
the sea as **isotherm-style contour bands** around the island, and step
through years (2023 → current) watching the bands warm while a fishery
timeline shows species arriving and leaving.

## Data

`GET https://marine-api.open-meteo.com/v1/marine?latitude=33.35&longitude=126.55&start_date={Jan 1, three years ago}&end_date={today}&daily=sea_surface_temperature_max,sea_surface_temperature_min&timezone=Asia/Seoul`

- Verified working (2023-01-01..05 → 18.1/17.8/17.6°C at ~33.3N 126.7E).
- Client-side fetch (no key). ~1,100 daily rows. Years = full years for the
  three previous calendar years + current year (partial, labeled).
- Missing days arrive as `null` and are skipped in aggregation.

## Pure Functions (`src/lib/sea.ts`)

- `yearlyAverages(rows: DailyRow[]): YearAverage[]` — mean of daily
  (max+min)/2 grouped by year; skips non-finite values; sorted by year.
- `tempToSeaColor(temp: number): string` — piecewise-linear interpolation
  over a blue→teal→green stop ramp (15–26°C, clamped).
- `contourBands(yearAvg: number): number[]` — coast-outward band temps:
  `+2, +1, avg, −1, −2` (coastal shallows warm fastest).
- `FISH_STAGES` — four per-year fishery scenario arrays (education content
  based on reported Jeju trends: 옥돔/소라/보말 decline, 돌돔/벤자리/
  그물반지 arrival), each entry `{ emoji, name, note, trend: in|out|stable }`.
  UI labels this as scenario, not measured data.

## Map (`src/components/JejuSeaMap.tsx`)

viewBox 420×420, center 210,210. Concentric ellipse bands around an organic
Jeju-island blob (wider than tall, 한라산 marker + label). Largest band =
outermost/coolest filled with `tempToSeaColor(bandTemp)`; inner bands drawn
over it with a dashed contour stroke at each edge; band temps labeled at the
right vertex of each ellipse (1 decimal, °C). CSS `transition: fill .8s`
gives the year-warming motion. Fish icons sit on fixed band positions with
a trend badge (↑ arriving yellow / ↓ leaving pink / • stable). Props:
`{ bandTemps: number[]; fish: FishEntry[] }`.

## Page (`src/app/sea/page.tsx`)

- Year stepper buttons (one per available year; partial years suffixed
  "· 현재까지").
- Verdict strip: year avg (1 decimal), Δ vs previous year badge (▲ red /
  ▼ blue).
- Mini trend chart: bars of yearly averages (clamped 15–26 scale).
- Fishery cards for the selected year (grid of 4, trend-colored).
- Learn card: why seas warm (지구 온난화), fish follow their preferred
  temperature, Jeju's warm waters show it early.
- Loading state while fetching; error state with retry.

## Shop Integration

`donuts.ts` entry ("Warming Sea", route `/sea`, tags `Data`, `Ocean`), home
flavor count 24 → 25.

## Testing

`sea.test.ts`: yearly aggregation across a year boundary skipping nulls;
tempToSeaColor monotonic + known endpoint; contourBands ordering
(coast warmest → outward cooler); FISH_STAGES has 4 stages with filled
entries and valid trend values.
