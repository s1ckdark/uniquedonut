# Shot & Shield (`/shot`) — Design

**Date:** 2026-09-10
**Status:** Approved
**Route:** `/shot` (gino menu: "💉 주사와 방패")

## Goal

An eight-scene storybook sequel to Cold Story: what a shot/medicine really
does during a cold (symptom relief — the body itself is the healer;
antibiotics work on bacteria, not viruses) and how vaccines work
(a practice drill with a weakened virus that builds antibody memory).

## Scenes (8-year-old wording)

1. **병원에 갔어요** — the doctor checks; "your body is fighting!"
2. **주사는 무슨 일을 할까?** — shots don't kill the virus; they ease fever
   and runny nose. The real healer is our own body.
3. **항생제의 비밀** — antibiotics catch bacteria (different creatures);
   they do nothing to cold viruses.
4. **미리 이기는 방법은?** — 200+ cold viruses → no cold vaccine; but the
   flu (a meaner cousin) has one.
5. **백신은 모의 훈련** — a weakened virus inside; the body's soldiers drill.
6. **항체 기억 만들기** — antibodies made and remembered (links to Cold
   Story's final scene).
7. **진짜가 와도 번개승!** — a trained body beats the real virus instantly.
8. **건강 지키기 3가지** — vaccine · hand-washing · sleep.

## File Structure

```
src/lib/shot.ts            # Scene content (pure)
src/lib/shot.test.ts       # Integrity + key-phrase tests
src/components/ShotArt.tsx    # Scene SVGs, reusing exported ColdArt helpers
src/app/shot/page.tsx      # Storybook stepper (+ link back to /cold)
src/data/gino.ts           # add entry
```

ColdArt's reusable helpers (`Virus`, `WhiteCell`, `Macrophage`, `RedCell`,
`Antibody`) become exported and are re-imported by ShotArt, which adds a
`Bacteria` rod (visually distinct from the spiky virus — itself a lesson),
a syringe, a shield, and a vaccine vial.

## Testing

`shot.test.ts`: 8 scenes in canonical order; unique ids; non-empty fields;
the injection scene says shots don't kill viruses; the vaccine scene
mentions the drill.

## gino Menu

`{ slug: "shot-shield", name: "주사와 방패", href: "/shot", emoji: "💉", color: "#4895ef" }`.
