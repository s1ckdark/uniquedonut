import { test } from "node:test";
import assert from "node:assert/strict";
import { contentTopics } from "./quiz-content";

test("contentTopics: eight topics with unique slugs", () => {
  assert.equal(contentTopics.length, 8);
  const slugs = new Set(contentTopics.map((t) => t.slug));
  assert.equal(slugs.size, 8);
});

test("contentTopics: every topic has six complete questions", () => {
  for (const topic of contentTopics) {
    assert.equal(topic.questions.length, 6);
    assert.ok(topic.name.length > 0);
    assert.ok(topic.emoji.length > 0);
    assert.ok(
      topic.baseDifficulty >= 0 && topic.baseDifficulty <= 100,
      `${topic.slug} baseDifficulty in range`,
    );
    for (const q of topic.questions) {
      assert.ok(q.prompt.length > 10, "prompt filled");
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4, "options unique");
      assert.ok(q.options.includes(q.answer), "answer present in options");
    }
  }
});

test("contentTopics: slugs match the gino content routes", () => {
  const expected = [
    "moon-tides",
    "mantis-diary",
    "crab-life",
    "sap-tree",
    "cold-story",
    "shot-shield",
    "sleep-grow",
    "idiom-cheongoma",
  ];
  for (const slug of expected) {
    assert.ok(
      contentTopics.some((t) => t.slug === slug),
      `missing ${slug}`,
    );
  }
});
