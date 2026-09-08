# Moon & Tides — Sun Extension (`/tides`) — Design

**Date:** 2026-09-08
**Status:** Approved
**Route:** `/tides` (extends `2026-09-08-moon-tides-design.md`)

## Goal

Add the sun to the tides simulation: a sun-position slider, day/night
rendering on Earth and at the beach, and physically-correct solar tides
unlocking 사리 (spring) / 조금 (neap) — the combined tide visibly grows when
sun and moon align and nearly cancels at quadrature.

## Decisions

| Decision | Choice |
|---|---|
| Sun's role | Day/night **and** tidal contribution (A_SUN = 0.46 × moon at D_REF) |
| New UI | Sun position slider (orange accent); 사리/조금 badge on the status card |
| Start state | Moon 0°, sun 0° ⇒ daytime + spring tide + 만조 |
| Files | Modify existing five only; no new files |

## Physics

- `sunTideHeight(phi) = 0.46 · (3cos²phi − 1)/2` — same P₂ shape, fixed
  amplitude (the sun's distance is effectively constant here).
- `combinedTideHeight(harbor, moon, sun, d) =
  tideHeight(harbor − moon, d) + sunTideHeight(harbor − sun)`.
- Alignment check (Δ = smallest angle between sun and moon):
  Δ ≤ 30° or ≥ 150° → **사리**; 60°–120° → **조금**; otherwise mid.
- Gauge normalization: `u = h_total / (A_moon(d) + A_SUN)` so u stays in
  [−0.5, 1]; the beach uses absolute `h_total`, so springs swing wider and
  neaps barely move — the 1/d³ and 0.46 lessons stay visible.

## View Changes

- **TidesSpace**: orbit visual shrinks 140→120 px (moon max 1.4×120+16 fits
  the 400 viewBox); sun added at fixed 178 px (yellow disc + rays + label);
  night hemisphere = dark semicircle over Earth rotated to face away from
  the sun.
- **TidesBeach**: receives `sunAngleDeg`; harbor is daytime when
  `cos(sunAngle) > 0`. Day: blue sky + sun icon crossing the sky
  (x from sin). Night: dark sky + stars + moon icon.
- **page**: third slider (태양 위치, default 0°); status card gains the
  spring/neap badge; learn card gains a 사리/조금 paragraph.

## Testing

- `sunTideHeight`: 0.46 / −0.23 / 0.46 at φ = 0 / π⁄2 / π.
- `combinedTideHeight`: both aligned = 1.46; neap configuration
  (moon 90°, sun 0°) = −0.04.
- `springNeap`: Δ=0 and 180 → spring; Δ=90 → neap; Δ=45 → mid.
- Spring swing exceeds neap swing at the harbor.
