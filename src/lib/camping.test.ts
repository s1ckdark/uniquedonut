import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCampingGame,
  campingDifficulty,
  rankCampingPlayers,
  LOGIC_BANK,
  MEMORY_FLASH_POOL,
  CATEGORY_EMOJI,
  LEVEL_LABELS,
  TOTAL_ROUNDS,
  type CampingCategory,
  type CampingLevel,
  type CampingPlayer,
} from "./camping";
import { buildDictationQuestions, type DictationTier } from "./dictation";
import { mulberry32 } from "./quiz";

const CROWD: CampingPlayer[] = [
  { name: "쉬움", level: "easy" },
  { name: "보통", level: "normal" },
  { name: "어려움", level: "hard" },
];

test("logic bank: at least 6 items per level", () => {
  for (const level of ["easy", "normal", "hard"] as CampingLevel[]) {
    assert.ok(
      LOGIC_BANK.filter((p) => p.level === level).length >= 6,
      `${level} needs ≥6 puzzles`,
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
  const games = buildCampingGame(42, CROWD);
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
  assert.deepEqual(buildCampingGame(42, CROWD), buildCampingGame(42, CROWD));
  assert.notDeepEqual(
    buildCampingGame(42, CROWD),
    buildCampingGame(43, CROWD),
  );
});

test("game: players get different content for the same round slots", () => {
  const [a, b] = buildCampingGame(42, CROWD);
  const differ = a.rounds.some((round, i) => round.answer !== b.rounds[i].answer);
  assert.ok(differ, "independent streams should diverge on some round");
});

test("game: every round has 4 unique options including the answer", () => {
  for (const game of buildCampingGame(7, CROWD)) {
    for (const round of game.rounds) {
      assert.equal(new Set(round.options).size, 4);
      assert.ok(round.options.includes(round.answer));
      assert.ok(round.prompt.length > 0);
    }
  }
});

test("game: easy math answers stay ≤ 10 and display uses + or −", () => {
  const [game] = buildCampingGame(99, [CROWD[0]]);
  for (const round of game.rounds.filter((r) => r.category === "math")) {
    assert.ok(Number(round.answer) <= 10);
    assert.ok(/[+−]/.test(round.display ?? ""));
  }
});

test("game: normal and hard second math round is always multiplication", () => {
  for (const level of ["normal", "hard"] as CampingLevel[]) {
    const [game] = buildCampingGame(99, [{ name: "p", level }]);
    const mathRounds = game.rounds.filter((r) => r.category === "math");
    assert.equal(mathRounds.length, 2);
    assert.ok(mathRounds.some((r) => (r.display ?? "").includes("×")));
  }
});

test("game: hard math reaches beyond the normal range (answer > 50 somewhere)", () => {
  const [game] = buildCampingGame(99, [CROWD[2]]);
  const answers = game.rounds
    .filter((r) => r.category === "math")
    .map((r) => Number(r.answer));
  assert.ok(answers.some((a) => a > 50), `hard answers were ${answers}`);
});

test("game: memory flash scales with level (4/6/8 items)", () => {
  const games = buildCampingGame(5, CROWD);
  const expect = { easy: [4, 4000], normal: [6, 5000], hard: [8, 6000] } as const;
  for (const game of games) {
    const flashRounds = game.rounds.filter((r) => r.category === "memory");
    for (const round of flashRounds) {
      assert.ok(round.flash);
      const [n, ms] = expect[game.player.level];
      assert.equal(round.flash!.items.length, n);
      assert.equal(round.flash!.ms, ms);
    }
  }
});

test("game: memory '없었던' answer is not flashed, '있었던' answer is flashed", () => {
  const games = buildCampingGame(11, CROWD);
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

test("game: word rounds draw from the level-matched dictation tier", () => {
  const tierOf: Record<CampingLevel, DictationTier> = {
    easy: "words",
    normal: "sentences",
    hard: "advanced",
  };
  const games = buildCampingGame(23, CROWD);
  for (const game of games) {
    const tier = tierOf[game.player.level];
    const bankWords = new Set(
      buildDictationQuestions(tier, 10).map((q) => q.answer),
    );
    for (const round of game.rounds.filter((r) => r.category === "word")) {
      assert.ok(round.speech, "word round carries speech text");
      assert.ok(bankWords.has(round.answer), `${round.answer} not in ${tier}`);
    }
  }
});

test("game: logic rounds match the player's level", () => {
  const games = buildCampingGame(31, CROWD);
  for (const game of games) {
    const levelWords = new Set(
      LOGIC_BANK.filter((p) => p.level === game.player.level).flatMap((p) => [
        p.answer,
        ...p.distractors,
      ]),
    );
    for (const round of game.rounds.filter((r) => r.category === "logic")) {
      assert.ok(round.options.every((o) => levelWords.has(o)));
    }
  }
});

test("difficulty: easy < normal < hard", () => {
  assert.ok(campingDifficulty("easy") < campingDifficulty("normal"));
  assert.ok(campingDifficulty("normal") < campingDifficulty("hard"));
});

test("level labels cover all three levels", () => {
  assert.deepEqual(Object.keys(LEVEL_LABELS).sort(), ["easy", "hard", "normal"]);
});

test("ranking: score desc, then totalSeconds asc, full ties share a rank", () => {
  const players: CampingPlayer[] = [
    { name: "A", level: "normal" },
    { name: "B", level: "hard" },
    { name: "C", level: "easy" },
    { name: "D", level: "easy" },
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
