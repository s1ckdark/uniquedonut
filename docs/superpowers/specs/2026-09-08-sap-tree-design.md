# Sap Tree (`/sap`) — Design

**Date:** 2026-09-08
**Status:** Approved
**Route:** `/sap` (gino menu: "🪲 수액 나무 친구들")

## Goal

A two-section exploration page: (1) a clickable summer-night sap-tree scene
where four guests (stag beetle, rhino beetle, butterfly, hornet) each tell
their story, (2) a stag-vs-rhino comparison with difference chips that
highlight body parts — the mantis-compare pattern reused.

## Section 1 — 수액 나무 씬

SVG night scene: oak trunk with amber sap running down; four guests
positioned at the sap. Clicking a guest glows it and swaps the info card
(what they do at the tree + fun fact). Intro text explains sap (나무의 단물)
and why it becomes the insects' summer-night restaurant and meeting place.

Guests: 사슴벌레 (guards the sap with its jaws), 장수풍뎅이 (glossy drinker),
나비 (daytime first-comer that pierces the bark), 말벌 (sweet tooth,
tussles with stag beetles).

## Section 2 — 사슴벌레 vs 장수풍뎅이

Side-by-side parametric SVG beetles + four difference chips with highlight:

| part | 사슴벌레 | 장수풍뎅이 |
|---|---|---|
| weapon | antler-like jaws (턱) | one horn on the head (머리 뿔) |
| body | flat & elongated | round & chubby |
| color | matte reddish brown | glossy black |
| fight | picks up & throws with jaws | flips over with the horn |

## Learn Card (static)

공통점: both nocturnal summer sap-lovers, club-tipped antennae, and — unlike
the mantis/crab pages — **완전변태** (egg → larva → pupa → adult, like
butterflies). Cross-references the metamorphosis spectrum from previous pages.

## File Structure

```
src/lib/sap.ts             # Pure: guests + differences
src/lib/sap.test.ts        # Data-integrity tests
src/components/BeetleArt.tsx  # Parametric stag/rhino SVG (+ part highlight)
src/components/SapTree.tsx    # Night scene with clickable mini insects
src/app/sap/page.tsx       # Page: intro, scene section, compare section, learn card
src/data/gino.ts           # add entry
```

## Testing

`sap.test.ts` (mantis pattern): 4 guests with unique ids and filled fields;
4 differences with unique part ids (`weapon/body/color/fight`) and filled
stag/rhino/tip texts.
