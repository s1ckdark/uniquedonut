import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DICTATION_BANK,
  buildDictationQuestions,
  dictationDifficulty,
  type DictationTier,
} from "./dictation";

test("bank: three tiers with at least 8 entries each", () => {
  for (const tier of ["words", "sentences", "advanced"] as DictationTier[]) {
    assert.ok(
      DICTATION_BANK[tier].length >= 8,
      `${tier} needs ≥8 entries`,
    );
  }
});

test("bank: every entry has exactly 3 unique distractors differing from the word", () => {
  for (const tier of Object.keys(DICTATION_BANK) as DictationTier[]) {
    for (const entry of DICTATION_BANK[tier]) {
      assert.ok(entry.word.length > 0);
      assert.equal(entry.distractors.length, 3);
      assert.equal(new Set(entry.distractors).size, 3, "distractors unique");
      for (const d of entry.distractors) {
        assert.notEqual(d, entry.word, `distractor equals word: ${d}`);
      }
      // words within a tier are unique
    }
    const words = DICTATION_BANK[tier].map((e) => e.word);
    assert.equal(new Set(words).size, words.length, `${tier} words unique`);
  }
});

test("buildDictationQuestions: count respected, 4 unique options with the answer", () => {
  for (let run = 0; run < 10; run++) {
    const qs = buildDictationQuestions("sentences", 10);
    assert.equal(qs.length, 10);
    for (const q of qs) {
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4);
      assert.ok(q.options.includes(q.answer));
      assert.equal(q.answer, q.word);
    }
  }
});

test("buildDictationQuestions: repeats allowed beyond the bank", () => {
  assert.equal(buildDictationQuestions("words", 15).length, 15);
});

test("dictationDifficulty: grows with tier, capped at 100", () => {
  assert.ok(dictationDifficulty("words") < dictationDifficulty("sentences"));
  assert.ok(dictationDifficulty("sentences") < dictationDifficulty("advanced"));
  assert.ok(dictationDifficulty("advanced") <= 100);
});
