# Sleep & Grow (`/growth`) — Design

**Date:** 2026-09-10
**Status:** Approved
**Route:** `/growth` (gino menu: "😴 키 크는 잠")

## Goal

An exploration page teaching how growth hormone works and why sleep drives
it — with a bedtime slider that redraws a 24-hour growth-hormone curve in
real time, plus learn sections and habit cards. Audience: 8-year-old Gino.

## Science (kept accurate, kid-worded)

- Growth hormone comes from the pituitary (뇌하수체) and acts on growth
  plates (성장판) at the ends of arm/leg bones.
- GH secretion peaks during **deep sleep in the first ~3 hours after
  falling asleep** — tied to sleep onset, NOT the clock ("밤 10시 골든타임"
  is a myth we explicitly correct: the wave follows whenever you fall
  asleep; sleeping early just guarantees enough of it).
- Recommended sleep for ages 6–13: **9–11 hours**.

## Core Interaction — bedtime slider

Slider: bedtime 21:00–01:00 (30-min steps), wake fixed at 07:00.
- A 24h SVG timeline (18:00→18:00) shades the sleep window and draws the GH
  curve: low awake baseline, big wave over the first 3h of sleep, decaying
  after; the deep-sleep wave zone is highlighted.
- Verdict card: total sleep vs 9–11h → 💤 딱 좋아요 / 😪 조금 부족 / 🥱 부족.

## Pure Functions (`src/lib/growth.ts`)

- `sleepDurationHours(bedHour)` — bed 21→10h … bed 25(=01:00)→6h.
- `ghLevelFromOnset(t)` — piecewise: awake 0.08; rise to 1.0 by 1h; hold
  ~1.0 through 3h (0.85 at 3h); decay to 0.2 by 6h; 0.15 later.
- `ghAt(clockHour, bedHour)` — t since onset; awake (t > duration) → 0.08.
- `sleepVerdict(hours)` — <8 부족 / 8–9 조금 부족 / 9–11 딱 좋아요 / >11 넉넉.
- `formatBedtime(bedHour)` — "밤 9:30" / "자정" / "새벽 1:00".

## File Structure

```
src/lib/growth.ts            # Pure math + verdicts (unit-tested)
src/lib/growth.test.ts
src/components/GrowthDay.tsx # 24h SVG curve reacting to bedtime
src/app/growth/page.tsx      # Slider + verdict + learn sections + habit cards
src/data/gino.ts             # add entry
```

## Page Sections

1. Slider + verdict + curve (the interactive hero).
2. 성장호르몬이 뭐예요? — body silhouette SVG: brain dot → arrows → glowing
   growth plates in arms/legs ("뼈 끝의 성장판").
3. 왜 잠에서 많이 나올까? — the deep-sleep wave story + the clock-time myth
   correction ("시계가 아니라 잠든 지 얼마나 됐는지가 중요해요!").
4. 키 크는 습관 4카드 — 잠 9~11시간 / 뛰어노기 / 우유·달걀·치즈 / 즐거운 마음.

## Testing

`growth.test.ts`: durations (21→10h, 22.5→8.5h, 25→6h); curve values
(awake 0.08, peak near t≈1–2h, t=2 > t=5, t≥6 = 0.15); `ghAt` asleep vs
noon-awake; verdict mapping.

## gino Menu

`{ slug: "sleep-grow", name: "키 크는 잠", href: "/growth", emoji: "😴", color: "#f4a261" }`.
