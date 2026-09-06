"use client";

import Link from "next/link";
import { useState } from "react";
import QuizCard from "@/components/QuizCard";
import { Donut } from "@/components/DonutArt";
import { quizQuestions, TOTAL_QUESTIONS } from "@/lib/math-quiz";

type Phase = "intro" | "quiz" | "results";

export default function MathPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [firstTryDone, setFirstTryDone] = useState(false);
  const [score, setScore] = useState(0);

  const question = quizQuestions[index];

  function start() {
    setPhase("quiz");
    setIndex(0);
    setPicked(null);
    setWasCorrect(false);
    setShowExplanation(false);
    setFirstTryDone(false);
    setScore(0);
  }

  function handlePick(i: number) {
    if (showExplanation) return;
    const correct = question.options[i].correct;
    setPicked(i);
    setWasCorrect(correct);
    if (correct) {
      if (!firstTryDone) setScore((s) => s + 1);
      setShowExplanation(true);
    } else {
      setFirstTryDone(true);
    }
  }

  function next() {
    if (index + 1 >= TOTAL_QUESTIONS) {
      setPhase("results");
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
    setWasCorrect(false);
    setShowExplanation(false);
    setFirstTryDone(false);
  }

  return (
    <div className="min-h-screen bg-[#1A0A2E] text-[#FEFEFE]">
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/shop"
            className="rounded-full bg-[#FF6B9D]/15 px-4 py-2 text-sm font-bold text-[#FF6B9D] transition hover:scale-105"
          >
            ← Shop
          </Link>
          {phase === "quiz" && (
            <span className="font-mono text-sm text-white/50">
              {index + 1} / {TOTAL_QUESTIONS}
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
            DONUT MATH
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            곱하기 마법 배우기 🍩×✨
          </p>
        </header>

        {phase === "intro" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <div className="animate-glow mx-auto w-fit">
              <Donut size={140} />
            </div>
            <p
              className="mt-4 text-2xl font-bold"
              style={{ fontFamily: "'Fredoka', cursive" }}
            >
              곱하기는 <span className="text-[#FF6B9D]">몇 번 더하기</span> 마법!
            </p>
            <p className="mt-3 text-white/70">
              2 × 3 은 “2를 3번 더하기” 라는 뜻이에요.
              <br />
              도넛을 보면서 8문제를 풀어보아요!
            </p>
            <button
              type="button"
              onClick={start}
              className="mt-6 rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#FF8C42] px-10 py-4 text-xl font-black text-black transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              시작하기 🍩
            </button>
          </div>
        )}

        {phase === "quiz" && (
          <>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#FFD93D] transition-all"
                style={{
                  width: `${((index + (showExplanation ? 1 : 0)) / TOTAL_QUESTIONS) * 100}%`,
                }}
              />
            </div>
            <QuizCard
              question={question}
              picked={picked}
              wasCorrect={wasCorrect}
              showExplanation={showExplanation}
              onPick={handlePick}
            />
            {showExplanation && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={next}
                  className="rounded-full bg-[#6BCB77] px-8 py-3 text-lg font-black text-black transition hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {index + 1 >= TOTAL_QUESTIONS ? "결과 보기 🎉" : "다음 문제 →"}
                </button>
              </div>
            )}
          </>
        )}

        {phase === "results" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-6xl">{score >= 6 ? "🏆" : score >= 4 ? "🍩" : "💪"}</p>
            <p
              className="mt-4 text-3xl font-black"
              style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
            >
              {score} / {TOTAL_QUESTIONS} 문제 첫 번에 맞혔어요!
            </p>
            <p className="mt-2 text-white/70">
              {score >= 6
                ? "와! 곱하기 마법사네요!"
                : score >= 4
                  ? "잘했어요! 조금만 더 연습해요!"
                  : "괜찮아요! 도넛을 하나씩 세면서 다시 해봐요!"}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={start}
                className="rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#FF8C42] px-8 py-3 text-lg font-black text-black transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                다시 풀기 🍩
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
