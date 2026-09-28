"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_CONFIG,
  buildPlayQuestions,
  pointsForCorrect,
  difficultyScore,
  difficultyLabel,
  type PlayQuestion,
  type QuizConfig,
} from "@/lib/quiz";
import { findTopic } from "@/lib/quiz-content";
import { formatTime, submitScore } from "@/lib/leaderboard";

const FEEDBACK_MS = 1100;

const fmtPts = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

type Phase = "idle" | "play" | "results" | "saved";

/** Inline story quiz for a gino content page: reads the topic's bank,
 *  plays a no-timer comprehension round, and saves to the shared D1
 *  leaderboard under the page's topic. */
export default function ContentQuiz({ topicSlug }: { topicSlug: string }) {
  const topic = findTopic(topicSlug);
  const [phase, setPhase] = useState<Phase>("idle");
  const [questions, setQuestions] = useState<PlayQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [gained, setGained] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [runSeconds, setRunSeconds] = useState(0);

  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rank, setRank] = useState<number | null>(null);

  const gameStartRef = useRef<number>(0);

  useEffect(() => {
    const saved = window.localStorage.getItem("gino-quiz-school");
    if (saved) setSchool(saved);
  }, []);

  if (!topic) return null;

  const questionCount = topic.questions.length;
  const config: QuizConfig = {
    ...DEFAULT_CONFIG,
    op: "mul",
    mode: "free",
    topic: topicSlug,
    optionCount: 4,
    questionCount,
  };
  const question = questions[qIndex];
  const locked = picked !== null;

  function start() {
    setQuestions(buildPlayQuestions(config));
    setQIndex(0);
    setPicked(null);
    setGained(null);
    setTotal(0);
    setRank(null);
    setError(null);
    gameStartRef.current = Date.now();
    setPhase("play");
  }

  useEffect(() => {
    if (phase !== "play" || !locked) return;
    const t = setTimeout(() => {
      if (qIndex + 1 >= questionCount) {
        setRunSeconds((Date.now() - gameStartRef.current) / 1000);
        setPhase("results");
        return;
      }
      setQIndex((i) => i + 1);
      setPicked(null);
      setGained(null);
    }, FEEDBACK_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, locked, qIndex]);

  function pick(option: string) {
    if (locked || !question) return;
    const correct = option === question.answer;
    const pts = correct ? pointsForCorrect(config) : 0;
    setPicked(option);
    setGained(pts);
    if (pts > 0) setTotal((t) => t + pts);
  }

  async function saveScore() {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      setSaving(true);
      setError(null);
      const { id, entries } = await submitScore({
        name: trimmed,
        ...(school.trim() ? { school: school.trim() } : {}),
        score: total,
        totalSeconds: runSeconds,
        date: new Date().toISOString(),
        difficulty: difficultyScore(config),
        topic: topicSlug,
      });
      window.localStorage.setItem("gino-quiz-school", school.trim());
      setRank(
        entries.findIndex((e) => e.id === id) >= 0
          ? entries.findIndex((e) => e.id === id) + 1
          : null,
      );
      setPhase("saved");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const medal =
    total === 100
      ? { emoji: "🏆", msg: "완벽해요! 이야기 완전 정복!" }
      : total >= 67
        ? { emoji: "🥇", msg: "대단해요! 내용을 잘 알고 있네요!" }
        : total >= 34
          ? { emoji: "🥈", msg: "잘했어요! 한 번 더 읽어볼까요?" }
          : { emoji: "🥉", msg: "괜찮아요! 이야기를 다시 읽고 도전!" };

  return (
    <section
      className="mt-8 rounded-2xl border p-6"
      style={{ borderColor: `${topic.color}50`, background: `${topic.color}10` }}
    >
      <h2
        className="text-center text-2xl font-black"
        style={{ fontFamily: "'Fredoka', cursive", color: topic.color }}
      >
        🎬 {topic.name} 퀴즈
      </h2>

      {phase === "idle" && (
        <div className="mt-4 text-center">
          <p className="text-sm text-white/60">
            방금 읽은 이야기 {questionCount}문제! 시간 제한 없어요.
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-4 rounded-full px-8 py-3 text-lg font-black text-black transition hover:scale-105 active:scale-95 cursor-pointer"
            style={{ background: topic.color }}
          >
            이야기 퀴즈 풀기 ({questionCount}문제)
          </button>
        </div>
      )}

      {phase === "play" && question && (
        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-bold">
            <span className="text-[#6BCB77]">✅ 천천히 생각해도 돼요</span>
            <span className="text-white/50">
              {qIndex + 1} / {questionCount} · {fmtPts(total)}점
            </span>
          </div>
          <p className="mt-4 text-center text-xl font-bold leading-relaxed text-white">
            {question.display}
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {question.options.map((opt) => {
              const isPicked = picked === opt;
              const revealCorrect = locked && opt === question.answer;
              const state = revealCorrect ? "correct" : isPicked ? "wrong" : "idle";
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => pick(opt)}
                  disabled={locked}
                  className={`min-h-[52px] rounded-2xl border-2 px-4 py-3 text-sm font-bold leading-snug transition cursor-pointer ${
                    state === "correct"
                      ? "border-[#6BCB77] bg-[#6BCB77]/25 text-[#6BCB77]"
                      : state === "wrong"
                        ? "animate-shake border-[#FF6B9D]/50 bg-[#FF6B9D]/15 text-white/40"
                        : "border-white/15 bg-black/30 text-white hover:border-[#FFD93D]"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {gained !== null && (
            <p
              className="mt-3 text-center text-lg font-black"
              style={{ color: gained > 0 ? "#6BCB77" : "#FF6B9D" }}
            >
              {gained > 0 ? `+${fmtPts(gained)}점!` : "아쉬워요 0점"}
            </p>
          )}
          {locked && picked !== question.answer && (
            <p className="mt-1 text-center text-sm text-[#FFD93D]">
              정답은 “{question.answer}”!
            </p>
          )}
        </div>
      )}

      {phase === "results" && (
        <div className="mt-4 text-center">
          <p className="text-5xl">{medal.emoji}</p>
          <p
            className="mt-2 text-4xl font-black"
            style={{ fontFamily: "var(--font-space-grotesk)", color: topic.color }}
          >
            {fmtPts(total)} / 100점
          </p>
          <p className="mt-1 font-mono text-xs text-white/50">
            ⏱ {formatTime(runSeconds)} · 난이도 {difficultyScore(config)}{" "}
            {difficultyLabel(difficultyScore(config))}
          </p>
          <p
            className="mt-1 text-lg"
            style={{ fontFamily: "'Fredoka', cursive", color: topic.color }}
          >
            {medal.msg}
          </p>

          <div className="mx-auto mt-4 max-w-xs rounded-2xl border border-[#6BCB77]/30 bg-[#6BCB77]/10 p-4">
            <p className="text-sm font-bold text-white/80">
              🏆 리더보드에 남길까요?
            </p>
            <div className="mt-3 space-y-2">
              <input
                value={school}
                onChange={(e) => setSchool(e.target.value.slice(0, 16))}
                placeholder="초등학교 (예: 위니초)"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#6BCB77]"
                aria-label="초등학교 이름"
              />
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 12))}
                  placeholder="이름"
                  className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#6BCB77]"
                  aria-label="리더보드 이름"
                />
                <button
                  type="button"
                  onClick={saveScore}
                  disabled={!name.trim() || saving}
                  className="rounded-xl bg-[#6BCB77] px-4 py-2 text-sm font-black text-black transition hover:opacity-90 disabled:opacity-30 cursor-pointer"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
            {error && <p className="mt-2 text-xs text-[#FF6B9D]">{error}</p>}
            <button
              type="button"
              onClick={() => setPhase("idle")}
              className="mt-2 text-xs text-white/50 underline transition hover:text-white/80 cursor-pointer"
            >
              저장 안 할래요
            </button>
          </div>
        </div>
      )}

      {phase === "saved" && (
        <div className="mt-4 text-center">
          <p className="text-4xl">🏅</p>
          <p className="mt-2 text-lg font-bold text-[#FFD93D]">
            {rank
              ? `리더보드 ${rank}위에 등록했어요!`
              : "리더보드에 등록했어요!"}
          </p>
          <p className="mt-1 text-xs text-white/50">
            전체 리더보드는 구구단 챌린지(⚡)에서 볼 수 있어요
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={start}
              className="rounded-full px-6 py-2 text-sm font-black text-black transition hover:scale-105 cursor-pointer"
              style={{ background: topic.color }}
            >
              다시 풀기
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
