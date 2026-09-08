# Mantis Diary (`/mantis`) — Design

**Date:** 2026-09-08
**Status:** Approved
**Route:** `/mantis` (gino menu: "🦗 사마귀 관찰")

## Goal

An exploration-style learning page with two sections: (1) compare male vs
female mantises by clicking difference chips that highlight body parts,
(2) step through the five growth stages (ootheca → hatch → nymph → molt →
adult) with a stepper.

## Decisions

| Decision | Choice |
|---|---|
| Form | Exploration, two sections (no quiz) |
| Illustration | Parametric cartoon SVG mantis (one component, sex/stage props) |
| Menu | gino contents entry |

## Non-goals (YAGNI)

No quiz, no sound, no species selector, no persistence.

## Content

**Section 1 — 수컷 vs 암컷.** Side-by-side SVG mantises with four clickable
difference chips; the selected chip highlights the body part on both insects
and swaps the explanation card:

| part | 암컷 | 수컷 |
|---|---|---|
| body | bigger, round abdomen | slimmer |
| antennae | short, thin | long, feathery comb |
| wings | not reaching abdomen tip | extend past the tip; flies well |
| segments | 6 abdominal segments | 8 segments (the scientists' method) |

**Section 2 — 성장 5단계** (불완전변태, no pupa):
1. 알주머니(ootheca) — fall, hundreds of eggs in a foam sac on a branch
2. 부화 — spring hatch, babies scatter quickly
3. 약충 — wingless mini adult, already hunts
4. 탈피 — molts 5–8 times, growing each time
5. 성충 — final molt, wings unfold

Each stage: name, description, fun fact, relative scale, wings flag.
The adult stage reuses the female mantis art (the ootheca's mom).

## File Structure

```
src/lib/mantis.ts            # Pure content: differences, growth stages, constants
src/lib/mantis.test.ts       # Data-integrity tests
src/components/MantisArt.tsx   # Parametric SVG mantis (sex: female|male|nymph, highlight part)
src/components/MantisGrowth.tsx # Section 2 stepper (incl. ootheca/hatch mini-SVGs)
src/app/mantis/page.tsx      # Page: section 1 composition, section 2, learn card
src/data/gino.ts             # add entry
```

`MantisArt` props: `{ sex: "female" | "male" | "nymph"; highlight?: "body" | "antennae" | "wings" | "segments" | null }`.
Female vs male differ in abdomen size, antennae style (feathery comb for
male), wing length, and the number of drawn abdominal segment lines
(`FEMALE_SEGMENTS = 6`, `MALE_SEGMENTS = 8` — drawn via `Array.from` so the
count is structural, not hand-drawn). Highlight adds a glowing outline to
the part group. Nymph: no wings, short antennae, slimmer body.

`MantisGrowth` owns the stage index state; prev/next buttons + dots; the
visual width scales with `stage.scale`; ootheca/hatch use small dedicated
SVGs (branch + foam sac; sac with hatchlings).

## Learn Card (static)

불완전변태: butterflies go egg → larva → **pupa** → adult, but mantises skip
the pupa — the baby is a mini adult that just molts. Kid-friendly comparison.

## Testing

`mantis.test.ts` (math-quiz pattern):
- 4 differences, unique part ids, all text fields non-empty.
- 5 growth stages in order `ootheca…adult`; only `adult` has `wings`;
  `scale` strictly increases from `hatch` onward.
- Segment constants are 6 and 8.
