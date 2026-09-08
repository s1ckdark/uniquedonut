# Phone Size Lab (`/phones`) — Design

**Date:** 2026-09-08
**Status:** Approved
**Route:** `/phones` (shop listing: "Phone Size Lab")

## Goal

A 3D size-comparison tool: curated real-spec phones (and user-entered custom
devices) rendered at true millimeter scale in a shared three.js scene you
can drag-rotate and zoom, with a stats table highlighting extremes.

## Decisions

| Decision | Choice |
|---|---|
| Device list | Curated 12 + custom input form (state-only, not persisted) |
| 3D | three.js + @react-three/fiber + @react-three/drei (project's first 3D stack) |
| Scene units | Real millimeters — honest size comparison |
| Lighting | Plain lights only (no drei Environment presets — they fetch HDRIs over the network) |

## File Structure

```
src/lib/devices.ts            # Device type, curated specs, validateDevices()
src/lib/devices.test.ts       # Data-integrity tests
src/components/DeviceModel.tsx   # One phone: RoundedBox body + emissive screen + camera island
src/components/DeviceScene.tsx   # R3F Canvas: layout, lights, ContactShadows, OrbitControls
src/app/phones/page.tsx       # Chips, custom form, scene, stats table
src/data/donuts.ts            # shop card; home flavor count 23 → 24
```

## Curated Data (12, real published specs)

iPhone 16 Pro Max / 16 Pro / 16 Plus / 16 / 16e / SE(3), Galaxy S25 Ultra /
S25 / S25 Edge / Z Fold 6 (folded), Pixel 9 Pro XL / 9. Each: slug, name,
brand, width/height/depth mm, screen inches, body color hex.

`validateDevices()` — math-quiz validator pattern: unique non-empty slug,
positive dims, positive screen, valid hex. Tests assert the shipped data
passes and bad data (negative dim, duplicate slug) is rejected.

## 3D Scene

- Devices stand side by side (22 mm gaps), bottom on y=0, at true mm scale.
- Camera auto-frames the selection: distance derived from total width and
  max height; OrbitControls (damping, zoom) with target at mid-height.
- Auto-rotate toggle; "뷰 초기화" remounts the scene to reset the camera.
- ContactShadows under the devices; ambient + key + fill lights; slight
  metalness on bodies, emissive screens, camera island + lenses on the back.

## Custom Input

Form: name, width/height/depth (mm), screen (in), color picker. Adds a
`custom-*` device to the chip list and auto-selects it. Selection: 1–8
devices via chips.

## Stats Table

Per selected device: size (W×H×D) and screen; the max and min in each
column are highlighted so differences read at a glance.

## Testing

`devices.test.ts`: shipped list validates; validator rejects negative
dimensions, duplicate slugs, bad hex; `DEFAULT_SELECTION` slugs all exist.
