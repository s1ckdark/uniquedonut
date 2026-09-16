# Idiom Story: 천고마비 (`/idiom`) — Design

**Date:** 2026-09-14
**Status:** Approved
**Route:** `/idiom` (gino menu: "🐎 천고마비")

## Goal

A five-scene storybook teaching the meaning and origin of 천고마비 (天高馬肥)
— from the Xiongnu grasslands and Sima Qian's warning to today's "season of
high skies", plus a science bonus on why autumn skies look high.

## Scenes (8-year-old wording)

1. **하늘은 높고, 말은 살찐다** — hanja card: 天(하늘) 高(높을) 馬(말)
   肥(살찔); four letters that paint autumn.
2. **초원의 유목민, 흉노** — horses eat all summer and grow fat each autumn.
3. **사기에 적힌 경고** — Sima Qian's 흉노열전 recorded autumn raids; the
   phrase originated from that story (the exact four-character form came
   later — stated honestly in the fact box).
4. **오늘날의 뜻** — the warning faded; now it praises clear, abundant
   autumn. 추고마비 variant noted.
5. **왜 가을 하늘은 높을까?** — science bonus: dry, clean autumn air makes
   the sky look high and mountains crisp.

## File Structure

```
src/lib/idiom.ts            # Scene content (pure)
src/lib/idiom.test.ts       # Integrity tests
src/components/IdiomArt.tsx    # Per-scene SVG (reusable cartoon horse helper)
src/app/idiom/page.tsx      # Storybook stepper
src/data/gino.ts            # add entry
```

## Testing

`idiom.test.ts`: 5 scenes in canonical order `meaning → steppe → warning →
today → science`; unique ids; complete fields; the meaning scene shows the
hanja; the science scene mentions dry air.

## gino Menu

`{ slug: "idiom-cheongoma", name: "천고마비", href: "/idiom", emoji: "🐎", color: "#e76f51" }`.
