# Camping Challenge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pass-and-play 8-round mixed challenge (memory/logic/math/word) for 2–4 kids with age adjustment and campfire podium ranking at `/camping`.

**Architecture:** One new pure lib (`camping.ts`) owns the logic-puzzle bank, memory-flash builder, seeded per-player game builder and ranking; the page composes existing engine pieces (`pointsForElapsed`, dictation bank via new optional `rng` param, speech pattern from `/dictation`). Leaderboard save uses the existing D1 API with topic `camping`.

**Tech Stack:** Next.js App Router, node:test + tsx, Web Speech API, Cloudflare D1 via existing `/api/quiz/leaderboard`.

## Global Constraints

- lib 파일은 DOM/React 금지 (pure functions only, 프로젝트 관행)
- `Math.random` 대신 `mulberry32(seed)` + `shuffleWith` 로 시드 결정론 유지 (게임 셔플은 Mimosa 오탐 무시)
- 점수 체계: `pointsForElapsed(ms, config{questionCount:8, timeoutMs:10000, ...})` 재사용 — 라운드당 ≤12.5, 총 ≤100
- D1 INSERT 는 `.run()` + `meta.last_row_id` (`.first()` 금지)
- 테스트: `npm test` (node --test --import tsx 'src/lib/**/*.test.ts')

---

### Task 1: `src/lib/camping.ts` — banks, builders, ranking (TDD)

**Files:**
- Create: `src/lib/camping.ts`
- Create: `src/lib/camping.test.ts`
- Modify: `src/lib/dictation.ts` (buildDictationQuestions gets optional `rng` param)

**Interfaces:**
- Consumes: `mulberry32`, `shuffleWith`, `pointsForElapsed` from `quiz.ts`; `DictationTier`, `buildDictationQuestions` from `dictation.ts`
- Produces:
  - `type CampingAge = 6 | 8`
  - `type CampingCategory = "memory" | "logic" | "math" | "word"`
  - `const CATEGORY_EMOJI: Record<CampingCategory, string>` (🧠💡🔢✏️)
  - `interface CampingPlayer { name: string; age: CampingAge }`
  - `interface CampingRound { category: CampingCategory; prompt: string; display?: string; answer: string; options: string[]; speech?: string; flash?: { items: string[]; ms: number } }`
  - `interface CampingPlayerGame { player: CampingPlayer; rounds: CampingRound[] }`
  - `buildCampingGame(seed: number, players: CampingPlayer[]): CampingPlayerGame[]` — same shuffled category order for all players, per-player seeded content (seed ^ playerIndex)
  - `campingDifficulty(age: CampingAge): number` (6→22, 8→34)
  - `interface CampingScore { score: number; totalSeconds: number }`
  - `rankCampingPlayers(players: CampingPlayer[], scores: CampingScore[]) → RankedCampingPlayer[]` ({ rank, player, score, totalSeconds }) sorted score desc then seconds asc; equal score+seconds share a rank

Test list (camping.test.ts):
1. logic bank integrity — ≥6 per level, options unique/4, answer in options
2. `buildCampingGame` determinism — same seed twice → deep equal
3. all players share the same category sequence; sequence has 2× each category
4. players get different content — fixed seed, players[0].rounds[k].answer ≠ players[1].rounds[k].answer for at least one k (deterministic with fixed seed; assert specific inequality)
5. age adjustment — 6세 math rounds: answer ≤ 10, display has + or −; 8세: at least one math round with × or answer > 10 across the game
6. memory rounds — flash present (4 items 4000ms for 6세 / 6 items 5000ms for 8세), "없었던" variant answer not in flash items; "있었던" variant answer in flash items; options never empty/dup
7. word rounds — 6세 options come from dictation words tier (answer length ≤ 5 chars); 8세 from sentences tier
8. `campingDifficulty` ordering (6 < 8)
9. ranking — score desc; tie on score → seconds asc; full tie → same rank number
10. dictation.ts rng param — same rng seed → same questions (new test in dictation.test.ts or camping.test.ts)

- [ ] Step 1: write failing tests → Step 2: run `npm test` expect camping failures → Step 3: implement camping.ts + dictation.ts rng param → Step 4: `npm test` all pass → Step 5: commit `feat(camping): add logic bank, memory flash, seeded game builder and ranking`

### Task 2: topicEmoji + gino hub entry

**Files:**
- Modify: `src/lib/quiz-content.ts` topicEmoji — add `if (slug === "camping") return "🏕️";`
- Modify: `src/lib/quiz-content.test.ts` (append case)
- Modify: `src/data/gino.ts` — add card after dictation: `{ slug: "camping", name: "캠핑 챌린지", description: "친구랑 순위 대결!", href: "/camping", emoji: "🏕️", color: "#F4A261" }`

- [ ] Steps: test case first → run → implement → pass → commit `feat(camping): topic emoji and gino hub entry`

### Task 3: `/camping` page

**Files:**
- Create: `src/app/camping/page.tsx`

**Interfaces (consumes):** everything from Task 1; `submitScore` from `leaderboard.ts`; `pointsForElapsed`; speech `speak()` copied from `/dictation` page pattern (speechSynthesis ko-KR rate 0.85, fallback flag).

Page phases: `setup → handoff → play → podium → saved/error`
- setup: 2–4 rows (name input + 6세/8세 toggle + remove; add button), roster persisted `gino-camping-players`, start button (disabled if 0 names → default 참가자N)
- handoff: `다음 주자 {name}! 🏕️ 나머지는 화면 안 봐요 ✋` + 시작 button
- play (per player, 8 rounds): header `CATEGORY_EMOJI + n/8`; memory rounds show flash grid (items big emoji) with countdown then auto-hide → question; word rounds auto `speak(round.speech)` + 🔊 다시 듣기 + no-voice text fallback; 10s gauge (colors from /dictation), 4 option buttons, pick → feedback (+points / 정답은 X) → FEEDBACK_MS 1.4s → next round; after last round → next player handoff or podium
- scoring: track per-category subtotal, per-round elapsed via `Date.now() - startRef` → `pointsForElapsed(ms, CAMPING_QUIZ_CONFIG)`
- podium: 🏕️🔥 header, ranked list with 🥇🥈🥉🎖️, score, 시간, per-category breakdown line; buttons: 리더보드에 남기기 / 🔁 다시 대결 (same roster new seed) / ✋ 끝내기
- save: loop submitScore per player `{ name, score, totalSeconds, date: new Date().toISOString(), difficulty: campingDifficulty(age), topic: "camping" }` — no school field; try/catch → offline banner "오프라인 — 순위는 화면에 있어요" then stay on podium

- [ ] Steps: build page → `npm run build` type-check → browser verify (Task 4) → commit `feat(camping): add /camping pass-and-play page with podium and offline-safe save`

### Task 4: verification

- [ ] SSR curl check: title/부제/setup UI
- [ ] Playwright one-evaluate flow: add 2 players → start → handoff → play a round (option click → feedback) → verify auto-advance; podium reachable via scripted quick play (all timeouts) → ranking order correct → save offline fallback message (or D1 if online)
- [ ] `npm test` full suite green

## Self-Review

- Spec coverage: 8 rounds/2×4 ✓(T1), same order/different content ✓(T1 tests 3-4), age table ✓(T1 tests 5-7), speed points/cap ✓(global config), podium+breakdown+tie-break ✓(T1 test 9, T3), handoff ✓(T3), localStorage roster ✓(T3), D1 offline ✓(T3), rematch new seed ✓(T3), topicEmoji/gino ✓(T2), logic bank ✓(T1 test 1)
- No placeholders; types consistent across tasks
