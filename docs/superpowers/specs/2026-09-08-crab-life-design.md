# Crab Life (`/crab`) — Design

**Date:** 2026-09-08
**Status:** Approved
**Route:** `/crab` (gino menu: "🦀 꽃게의 일생")

## Goal

An exploration page walking through the swimming crab's (꽃게) life cycle in
five stages with a stepper — egg → zoea → megalopa → juvenile → adult —
each with its own cartoon SVG form, description, and fun fact. The learn
card contrasts the crab's larval metamorphosis with the mantis's incomplete
metamorphosis (cross-linking the previous gino page).

## Content — 5 Stages

1. **알 (egg)** — mom carries hundreds of thousands of orange eggs on her
   abdomen until they hatch.
2. **조에아 (zoea)** — planktonic larva that looks nothing like a crab:
   spined carapace, stalked eyes; microscope-scale.
3. **메가로파 (megalopa)** — starts looking crab-like but keeps a long
   shrimp-like abdomen. (Name means "big eye".)
4. **새끼게 (juvenile)** — finally crab-shaped; folds the abdomen under,
   settles to the sea floor, hides in sand.
5. **어미게 (adult)** — grows by molting; the rearmost legs flatten into
   swimming paddles.

Stage data carries `scale` (visual size, strictly increasing after egg) and
`paddles` (true only for the adult — structurally drawn swimming legs).

## File Structure

```
src/lib/crab.ts             # Pure stage content + constants
src/lib/crab.test.ts        # Data-integrity tests
src/components/CrabArt.tsx    # Stage-parametric SVG (four distinct body plans + egg mass)
src/components/CrabGrowth.tsx # Stepper (prev/next + dots)
src/app/crab/page.tsx       # Page shell + learn card
src/data/gino.ts            # add entry
```

## Learn Card (static)

사마귀 아기 = 어른 미니판 (불완전변태); 꽃게 아기 = 완전히 다른 조에아 →
메가로파를 거쳐 변신 (유생 변태). 나비의 번데기(완전변태)와도 한 줄 비교.
Kid-friendly, three-way contrast.

## Testing

`crab.test.ts` (mantis pattern):
- 5 stages in order `egg → zoea → megalopa → juvenile → adult`.
- Only `adult` has `paddles`; `scale` strictly increases after egg.
- Every stage has non-empty name/description/funFact.
