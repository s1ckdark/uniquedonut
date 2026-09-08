# Moon & Tides (`/tides`) — Design

**Date:** 2026-09-08
**Status:** Approved
**Route:** `/tides` (also listed in the gino menu)

## Goal

An exploration-style learning page for Gino explaining why tides happen:
two sliders (moon position around Earth, moon distance) drive a dual-view
simulation — a space view (Earth, deformed ocean ring, orbiting moon) and a
beach view (sea level rising/falling against donut-shop land) — with a live
status card naming the current tide state (만조/간조/밀물/썰물).

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Scope | Moon only — no sun / spring-neap |
| Form | Exploration (no quiz); text updates with state |
| Views | Dual: space view + beach view, synchronized |
| Motion | Manual sliders + auto-play (moon orbits, ~12s/revolution); touching the position slider pauses |
| Menu | Added to gino contents as "🌊 달과 바다" |

## Non-goals (YAGNI)

- No sun/spring-neap tides, no real coastline data, no time-of-day mapping.
- No quiz; no persistence.
- Earth does not rotate on screen (the harbor stays fixed; the moon moves).

## Physics (simplified for kids, but correct)

- Tidal height at angle difference φ from the moon:
  `h = A · (3·cos²φ − 1) / 2` (the P₂ tidal term).
  Max `+A` at φ=0 **and** φ=180° (two bulges); min `−A/2` at 90°/270°.
- Amplitude follows the inverse-cube law: `A(d) = (D_REF / d)³` with the
  distance slider mapping d ∈ [0.6, 1.4]·D_REF (A ranges ≈ 0.36×–4.6×).
  Visual exaggeration is applied at render time, not in the math.
- Teaching point surfaced in copy: one moon revolution ⇒ the harbor sees
  **two** high tides and **two** low tides.

## File Structure

```
src/lib/tides.ts               # Pure physics + state labeling + ring math
src/lib/tides.test.ts          # Unit tests
src/components/TidesSpace.tsx  # Space view SVG (client)
src/components/TidesBeach.tsx  # Beach view SVG (client)
src/app/tides/page.tsx         # Page: state, sliders, auto-play, panels
src/data/gino.ts               # add "달과 바다" entry
```

- `src/lib/tides.ts` — **pure**: `tideAmplitude(d)`, `tideHeight(φ, d)`,
  `tideState(u, prevU)` → label/emoji/description, `oceanRingRadius(...)`,
  constants `D_REF`, `D_MIN`, `D_MAX`. No DOM/React. Unit-tested.
- `TidesSpace.tsx` — given `moonAngleDeg`, `moonDistMult`, renders SVG:
  Earth disc with land shapes, translucent ocean ring whose radius follows
  `oceanRingRadius` (72-point path), dashed orbit, moon with craters, fixed
  harbor marker 🍩 at the top.
- `TidesBeach.tsx` — given the harbor's current `h` (absolute, amplitude
  included), renders the side-view beach: sand + donut shop on the right,
  sea rectangle whose top level maps from `h` (clamped), wet-sand band,
  starfish revealed at low tide, small gauge.
- Page owns `moonAngleDeg` (0–360), `moonDistMult` (0.6–1.4), `playing`;
  a rAF loop advances the angle ~30°/s while playing; the position slider
  pauses auto-play; the distance slider does not. A `prevU` ref supplies
  rise/fall direction for 밀물/썰물 labels.

## State Labeling

`u = h / A(d)` (normalized to current amplitude; range [−0.5, 1]):
- `u ≥ 0.6` → 만조 ("바닷물이 가장 높이 차올랐어요!")
- `u ≤ −0.35` → 간조 ("바닷물이 가장 많이 빠졌어요! 갯벌이 보여요")
- otherwise → 밀물 (u rising vs prevU) / 썰물 (falling); on the very first
  render direction is unknown, so u in the middle band shows 밀물 text —
  in practice the page starts at θ=0 ⇒ u=1 ⇒ 만조, so this edge is cosmetic.

Initial state: moon aligned with the harbor (θ=0) at D_REF ⇒ 만조 on load.

## Beach Water Level Mapping

`waterTop = 115 − 55 · clamp(h / 1.6, −1, 1)` (y in a 300×220 viewBox):
h=+1 (full moon-distance high tide) sits well up the beach; the closest
moon (h up to ≈4.6) clamps at the top; far moon barely moves the sea —
visually teaching the 1/d³ law. Wet-sand band spans the clamp range.

## Testing

`tides.test.ts`:
- `tideAmplitude`: =1 at D_REF; ≈4.63 at 0.6·D_REF; monotonically decreasing.
- `tideHeight`: +A at φ=0 and π; −A/2 at π/2; closer moon ⇒ larger height.
- `tideState`: mapping for 만조/간조/밀물/썰물.
- `oceanRingRadius`: > base toward the moon, < base at quadrature (given
  large enough A), monotonic in h.

## gino Menu

`src/data/gino.ts` gains: `{ slug: "moon-tides", name: "달과 바다", href: "/tides", emoji: "🌊", color: "#00ccff" }`.
