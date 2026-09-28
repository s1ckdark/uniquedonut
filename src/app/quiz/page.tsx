"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildTimesTableQuiz,
  pointsForElapsed,
  TIMEOUT_MS,
  type QuizQuestion,
} from "@/lib/quiz";

// The times table Gino is currently learning.
const TABLE = 2;
const QUESTION_COUNT = 10;
const FEEDBACK_MS = 1100;

type Phase = "intro" | "play" | "results";

export default function QuizPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [gained, setGained] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [remaining, setRemaining] = useState(TIMEOUT_MS);

  const startRef = useRef<number>(0);

  const question = questions[qIndex];
  const locked = picked !== null || timedOut;

  const start = useCallback(() => {
    setQuestions(buildTimesTableQuiz(TABLE));
    setQIndex(0);
    setPicked(null);
    setTimedOut(false);
    setGained(null);
    setTotal(0);
    setRemaining(TIMEOUT_MS);
    setPhase("play");
  }, []);

  // Countdown: runs while a question is live, trips the timeout at 0.
  useEffect(() => {
    if (phase !== "play" || locked) return;
    startRef.current = Date.now();
    setRemaining(TIMEOUT_MS);
    const tick = setInterval(() => {
      const left = TIMEOUT_MS - (Date.now() - startRef.current);
      if (left <= 0) {
        setRemaining(0);
        setTimedOut(true);
        setGained(0);
        clearInterval(tick);
      } else {
        setRemaining(left);
      }
    }, 100);
    return () => clearInterval(tick);
  }, [phase, locked, qIndex]);

  // Advance to the next question (or results) after the feedback flash.
  useEffect(() => {
    if (phase !== "play" || !locked) return;
    const t = setTimeout(() => {
      if (qIndex + 1 >= QUESTION_COUNT) {
        setPhase("results");
        return;
      }
      setQIndex((i) => i + 1);
      setPicked(null);
      setTimedOut(false);
      setGained(null);
    }, FEEDBACK_MS);
    return () => clearTimeout(t);
  }, [phase, locked, qIndex]);

  function pick(option: number) {
    if (locked || !question) return;
    const elapsed = Date.now() - startRef.current;
    const correct = option === question.answer;
    const pts = correct ? pointsForElapsed(elapsed) : 0;
    setPicked(option);
    setGained(pts);
    if (pts > 0) setTotal((t) => t + pts);
  }

  const medal =
    total === 50
      ? { emoji: "🏆", msg: "완벽해요! 번개 속도!" }
      : total >= 40
        ? { emoji: "🥇", msg: "대단해요! 거의 완벽!" }
        : total >= 25
          ? { emoji: "🥈", msg: "잘했어요! 조금만 더 빠르게!" }
          : { emoji: "🥉", msg: "괜찮아요! 연습하면 빨라져요!" };

  const gaugeColor =
    remaining > 3000 ? "#6BCB77" : remaining > 1500 ? "#FFD93D" : "#FF6B6B";

  return (
    <div className="min-h-screen bg-[#1A0A2E] text-[#FEFEFE]">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/gino"
            className="rounded-full bg-[#FF6B9D]/15 px-4 py-2 text-sm font-bold text-[#FF6B9D] transition hover:scale-105"
          >
            ← Gino
          </Link>
          {phase === "play" && (
            <span className="font-mono text-sm text-white/50">
              {qIndex + 1} / {QUESTION_COUNT} · {total}점
            </span>
          )}
        </div>

        <header className="mb-8 text-center">
          <h1
            className="text-4xl font-black leading-none md:text-6xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#FFD93D",
              textShadow:
                "0 0 20px rgba(255,217,61,0.5), 3px 3px 0px #FF6B9D",
            }}
          >
            QUIZ ARENA
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            구구단 {TABLE}단 챌린지 ⚡
          </p>
        </header>

        {phase === "intro" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-5xl">⚡</p>
            <p
              className="mt-4 text-2xl font-black"
              style={{ fontFamily: "'Fredoka', cursive" }}
            >
              {TABLE}단 문제 <span className="text-[#FF6B9D]">10개</span>를
              빠르게 맞혀요!
            </p>
            <div className="mx-auto mt-4 max-w-sm space-y-1 text-left text-sm text-white/70">
              <p>⏱ 문제마다 5초! 시간이 지나면 0점</p>
              <p>⚡ 1초 안에 맞히면 5점, 느려질수록 1점씩 깎여요</p>
              <p>🏆 만점은 50점!</p>
            </div>
            <button
              type="button"
              onClick={start}
              className="mt-6 rounded-full bg-gradient-to-r from-[#FFD93D] to-[#FF8C42] px-10 py-4 text-xl font-black text-black transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              시작! 🚀
            </button>
          </div>
        )}

        {phase === "play" && question && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            {/* timer gauge */}
            <div className="mb-2 flex items-center justify-between text-xs font-bold">
              <span style={{ color: gaugeColor }}>
                ⏱ {(remaining / 1000).toFixed(1)}초
              </span>
              {gained !== null && (
                <span
                  className="text-lg"
                  style={{ color: gained > 0 ? "#6BCB77" : "#FF6B9D" }}
                >
                  {timedOut
                    ? "시간 초과… 0점"
                    : gained > 0
                      ? `+${gained}점!`
                      : "아쉬워요 0점"}
                </span>
              )}
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-none"
                style={{
                  width: `${(remaining / TIMEOUT_MS) * 100}%`,
                  background: gaugeColor,
                }}
              />
            </div>

            {/* question */}
            <p
              className="mt-8 text-center text-6xl font-black"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {question.a} × {question.b} = ?
            </p>

            {/* options */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              {question.options.map((opt) => {
                const isPicked = picked === opt;
                const revealCorrect = locked && opt === question.answer;
                const state = revealCorrect
                  ? "correct"
                  : isPicked && !revealCorrect
                    ? "wrong"
                    : "idle";
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => pick(opt)}
                    disabled={locked}
                    className={`min-h-[64px] rounded-2xl border-2 text-3xl font-black transition cursor-pointer ${
                      state === "correct"
                        ? "border-[#6BCB77] bg-[#6BCB77]/25 text-[#6BCB77]"
                        : state === "wrong"
                          ? "animate-shake border-[#FF6B9D]/50 bg-[#FF6B9D]/15 text-white/40"
                          : "border-white/15 bg-black/30 text-white hover:border-[#FFD93D] hover:scale-[1.03]"
                    }`}
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {locked && !timedOut && picked !== question.answer && (
              <p className="mt-4 text-center text-lg text-[#FFD93D]">
                정답은 {question.answer}!
              </p>
            )}
          </div>
        )}

        {phase === "results" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-6xl">{medal.emoji}</p>
            <p
              className="mt-4 text-5xl font-black"
              style={{
                fontFamily: "var(--font-space-grotesk)",
                color: "#FFD93D",
              }}
            >
              {total} / 50점
            </p>
            <p
              className="mt-2 text-xl"
              style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
            >
              {medal.msg}
            </p>
            <button
              type="button"
              onClick={start}
              className="mt-6 rounded-full bg-gradient-to-r from-[#FFD93D] to-[#FF8C42] px-8 py-3 text-lg font-black text-black transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              다시 도전! ⚡
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
