import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCampingGame,
  campingDifficulty,
  rankCampingPlayers,
  LOGIC_BANK,
  MEMORY_FLASH_POOL,
  CATEGORY_EMOJI,
  TOTAL_ROUNDS,
  type CampingAge,
  type CampingCategory,
  type CampingPlayer,
} from "./camping";
import { buildDictationQuestions, type DictationTier } from "./dictation";
import { mulberry32 } from "./quiz";

const KIDS: CampingPlayer[] = [
  { name: "막내", age: 6 },
  { name: "지노", age: 8 },
  { name: "친구", age: 8 },
];

test("logic bank: at least 6 items per age level", () => {
  for (const level of [6, 8] as CampingAge[]) {
    assert.ok(
      LOGIC_BANK.filter((p) => p.level === level).length >= 6,
      `level ${level} needs ≥6 puzzles`,
    );
  }
});

test("logic bank: 4 unique options containing the answer, distractors differ", () => {
  for (const puzzle of LOGIC_BANK) {
    const options = [puzzle.answer, ...puzzle.distractors];
    assert.equal(new Set(options).size, 4, `duplicated options: ${options}`);
    assert.ok(options.includes(puzzle.answer));
    for (const d of puzzle.distractors) {
      assert.notEqual(d, puzzle.answer);
    }
  }
});

test("memory flash pool has at least 15 distinct emoji", () => {
  assert.ok(MEMORY_FLASH_POOL.length >= 15);
  assert.equal(new Set(MEMORY_FLASH_POOL).size, MEMORY_FLASH_POOL.length);
});

test("game: 8 rounds, 2 per category, same order for every player", () => {
  const games = buildCampingGame(42, KIDS);
  assert.equal(games.length, 3);
  for (const game of games) {
    assert.equal(game.rounds.length, TOTAL_ROUNDS);
    const counts = { memory: 0, logic: 0, math: 0, word: 0 } as Record<
      CampingCategory,
      number
    >;
    for (const round of game.rounds) counts[round.category] += 1;
    assert.deepEqual(counts, { memory: 2, logic: 2, math: 2, word: 2 });
  }
  const orders = games.map((g) => g.rounds.map((r) => r.category).join(","));
  assert.equal(new Set(orders).size, 1, "all players share one round order");
});

test("game: same seed → identical game (determinism)", () => {
  assert.deepEqual(buildCampingGame(42, KIDS), buildCampingGame(42, KIDS));
  assert.notDeepEqual(
    buildCampingGame(42, KIDS),
    buildCampingGame(43, KIDS),
  );
});

test("game: players get different content for the same round slots", () => {
  const [a, b] = buildCampingGame(42, KIDS);
  const differ = a.rounds.some((round, i) => round.answer !== b.rounds[i].answer);
  assert.ok(differ, "independent streams should diverge on some round");
});

test("game: every round has 4 unique options including the answer", () => {
  for (const game of buildCampingGame(7, KIDS)) {
    for (const round of game.rounds) {
      assert.equal(new Set(round.options).size, 4);
      assert.ok(round.options.includes(round.answer));
      assert.ok(round.prompt.length > 0);
    }
  }
});

test("game: 6세 math answers stay ≤ 10 and display uses + or −", () => {
  const [young] = buildCampingGame(99, [KIDS[0]]);
  for (const round of young.rounds.filter((r) => r.category === "math")) {
    assert.ok(Number(round.answer) <= 10);
    assert.ok(/[+−]/.test(round.display ?? ""));
  }
});

test("game: 8세 second math round is always multiplication (×)", () => {
  const [old] = buildCampingGame(99, [KIDS[1]]);
  const mathRounds = old.rounds.filter((r) => r.category === "math");
  assert.equal(mathRounds.length, 2);
  assert.ok(mathRounds.some((r) => (r.display ?? "").includes("×")));
});

test("game: memory rounds flash 4 items/4s for 6세, 6 items/5s for 8세", () => {
  const games = buildCampingGame(5, KIDS);
  for (const game of games) {
    const flashRounds = game.rounds.filter((r) => r.category === "memory");
    for (const round of flashRounds) {
      assert.ok(round.flash);
      if (game.player.age === 6) {
        assert.equal(round.flash!.items.length, 4);
        assert.equal(round.flash!.ms, 4000);
      } else {
        assert.equal(round.flash!.items.length, 6);
        assert.equal(round.flash!.ms, 5000);
      }
    }
  }
});

test("game: memory '없었던' answer is not flashed, '있었던' answer is flashed", () => {
  const games = buildCampingGame(11, KIDS);
  for (const game of games) {
    const flashRounds = game.rounds.filter((r) => r.category === "memory");
    const absent = flashRounds.find((r) => r.prompt.includes("없었던"));
    const present = flashRounds.find((r) => r.prompt.includes("있었던"));
    assert.ok(absent, "variant A missing");
    assert.ok(present, "variant B missing");
    assert.ok(!absent!.flash!.items.includes(absent!.answer));
    assert.ok(present!.flash!.items.includes(present!.answer));
  }
});

test("game: word rounds draw from the age-matched dictation tier", () => {
  const tierOf = (age: CampingAge): DictationTier => (age === 6 ? "words" : "sentences");
  const games = buildCampingGame(23, KIDS);
  for (const game of games) {
    const tier = tierOf(game.player.age);
    const bankWords = new Set(
      buildDictationQuestions(tier, 10).map((q) => q.answer),
    );
    for (const round of game.rounds.filter((r) => r.category === "word")) {
      assert.ok(round.speech, "word round carries speech text");
      assert.ok(bankWords.has(round.answer), `${round.answer} not in ${tier}`);
    }
  }
});

test("game: logic rounds match the player's age level", () => {
  const games = buildCampingGame(31, KIDS);
  for (const game of games) {
    const levelWords = new Set(
      LOGIC_BANK.filter((p) => p.level === game.player.age).flatMap((p) => [
        p.answer,
        ...p.distractors,
      ]),
    );
    for (const round of game.rounds.filter((r) => r.category === "logic")) {
      assert.ok(round.options.every((o) => levelWords.has(o)));
    }
  }
});

test("difficulty: 6세 scores below 8세", () => {
  assert.ok(campingDifficulty(6) < campingDifficulty(8));
});

test("ranking: score desc, then totalSeconds asc, full ties share a rank", () => {
  const players: CampingPlayer[] = [
    { name: "A", age: 8 },
    { name: "B", age: 8 },
    { name: "C", age: 6 },
    { name: "D", age: 6 },
  ];
  const ranked = rankCampingPlayers(players, [
    { score: 80, totalSeconds: 60 },
    { score: 90, totalSeconds: 70 },
    { score: 80, totalSeconds: 50 },
    { score: 80, totalSeconds: 60 },
  ]);
  assert.deepEqual(
    ranked.map((r) => r.player.name),
    ["B", "C", "A", "D"],
  );
  assert.deepEqual(
    ranked.map((r) => r.rank),
    [1, 2, 3, 3],
  );
});

test("dictation: buildDictationQuestions accepts a seeded rng", () => {
  const a = buildDictationQuestions("words", 3, mulberry32(1));
  const b = buildDictationQuestions("words", 3, mulberry32(1));
  assert.deepEqual(a, b);
  const c = buildDictationQuestions("words", 3, mulberry32(2));
  assert.notDeepEqual(a, c);
});

test("category emoji map covers all four categories", () => {
  assert.deepEqual(Object.keys(CATEGORY_EMOJI).sort(), [
    "logic",
    "math",
    "memory",
    "word",
  ]);
});
