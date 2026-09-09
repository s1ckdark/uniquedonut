# Cold Story (`/cold`) — Design

**Date:** 2026-09-08
**Status:** Approved
**Route:** `/cold` (gino menu: "🤧 감기 이야기")

## Goal

A seven-scene storybook stepper telling how a cold virus enters the body
and what happens inside — macrophages raising the alarm, white cells
fighting, the fever strategy, the antibody special force, and the victory
memory. One deliberate science twist: red blood cells don't fight; they
deliver oxygen and cheer — corrected in-story as a fun reveal.

## Scenes

1. **코로 들어온 불청객** — spiky viruses slip into the nose lining.
2. **몸속 경보** — a macrophage spots them: "적 발견!"
3. **백혈구, 출동!** — neutrophils grab, macrophages munch.
4. **그런데 적혈구는?** — red cells carry oxygen backpacks to the fighters
   (they don't fight — the cheer squad). The twist scene.
5. **몸이 뜨거워져요** — fever weakens viruses; snot and cough clear debris.
6. **항체 특별부대** — B cells' Y-shaped antibodies lock the viruses down;
   killer T cells hunt stragglers.
7. **승리와 기억** — antibodies remember; hand-washing prevents round two.

Each scene: title, narration (2–3 kid sentences), and a "사실!" fact box.

## File Structure

```
src/lib/cold.ts            # Scene content (pure)
src/lib/cold.test.ts       # Integrity tests
src/components/ColdArt.tsx    # Per-scene SVG built from reusable helpers
src/app/cold/page.tsx      # Storybook stepper page
src/data/gino.ts           # add entry
```

Reusable SVG helpers inside ColdArt: `Virus` (purple spiky ball), `RedCell`
(red disc + O₂ backpack), `WhiteCell` (pale blob with a face),
`Macrophage` (bigger, big mouth), `Antibody` (Y shape). Scenes compose them.

## Testing

`cold.test.ts`: 7 scenes in canonical order `invade…victory`; unique ids;
title/narration/fact non-empty; the twist scene (`redcell`) exists.

## gino Menu

`{ slug: "cold-story", name: "감기 이야기", href: "/cold", emoji: "🤧", color: "#9b5de5" }`.
