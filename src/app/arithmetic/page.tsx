"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  buildDailyMathQuiz,
  dailyDifficulty,
  difficultyLabel,
  pointsForElapsed,
  GRADE_PRESETS,
  type Grade,
  type QuizQuestion,
} from "@/lib/quiz";
import { formatTime, submitScore } from "@/lib/leaderboard";

const FEEDBACK_MS = 1100;
const TIMEOUT_MS = 10000;
const QUESTION_COUNT = 10;
const GRADES: Grade[] = [1, 2, 3, 4, 5, 6];

const STREAK_KEY = "gino-daily-math";

type Phase = "setup" | "play" | "results" | "saved";

const fmtPts = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadStreakDates(): string[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(STREAK_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((d) => typeof d === "string") : [];
  } catch {
    return [];
  }
}

/** Consecutive completed days, anchored on today (or yesterday before play). */
function computeStreak(dates: string[]): number {
  const set = new Set(dates);
  const d = new Date();
  const iso = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  if (!set.has(iso(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (set.has(iso(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default function ArithmeticPage() {
  const [grade, setGrade] = useState<Grade>(2);
  const [multiTermPct, setMultiTermPct] = useState(0);
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [gained, setGained] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [remaining, setRemaining] = useState(TIMEOUT_MS);
  const [runSeconds, setRunSeconds] = useState(0);

  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rank, setRank] = useState<number | null>(null);

  const [streakDates, setStreakDates] = useState<string[]>([]);
  const [doneToday, setDoneToday] = useState(false);

  const startRef = useRef<number>(0);
  const gameStartRef = useRef<number>(0);

  useEffect(() => {
    const dates = loadStreakDates();
    setStreakDates(dates);
    setDoneToday(dates.includes(todayStr()));
    const saved = window.localStorage.getItem("gino-quiz-school");
    if (saved) setSchool(saved);
  }, []);

  const question = questions[qIndex];
  const locked = picked !== null || timedOut;
  const streak = computeStreak(streakDates);

  const difficulty = dailyDifficulty(grade, multiTermPct);

  function start() {
    setQuestions(
      buildDailyMathQuiz(todayStr(), grade, QUESTION_COUNT, 4, multiTermPct),
    );
    setQIndex(0);
    setPicked(null);
    setTimedOut(false);
    setGained(null);
    setTotal(0);
    setRemaining(TIMEOUT_MS);
    setRank(null);
    setError(null);
    gameStartRef.current = Date.now();
    setPhase("play");
  }

  // Countdown while a question is live.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, locked, qIndex]);

  // Advance after the feedback flash; finishing marks the streak day.
  useEffect(() => {
    if (phase !== "play" || !locked) return;
    const t = setTimeout(() => {
      if (qIndex + 1 >= QUESTION_COUNT) {
        setRunSeconds((Date.now() - gameStartRef.current) / 1000);
        const today = todayStr();
        setStreakDates((cur) => {
          if (cur.includes(today)) return cur;
          const next = [...cur, today].slice(-90);
          window.localStorage.setItem(STREAK_KEY, JSON.stringify(next));
          return next;
        });
        setDoneToday(true);
        setPhase("results");
        return;
      }
      setQIndex((i) => i + 1);
      setPicked(null);
      setTimedOut(false);
      setGained(null);
    }, FEEDBACK_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, locked, qIndex]);

  function pick(option: number) {
    if (locked || !question) return;
    const correct = option === question.answer;
    const pts = correct
      ? pointsForElapsed(Date.now() - startRef.current, {
          op: "add",
          mode: "attack",
          tables: [2],
          rangeMax: GRADE_PRESETS[grade].opsRange,
          optionCount: 4,
          timeoutMs: TIMEOUT_MS,
          questionCount: QUESTION_COUNT,
        })
      : 0;
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
        difficulty,
        topic: "daily-math",
      });
      window.localStorage.setItem("gino-quiz-school", school.trim());
      const idx = entries.findIndex((e) => e.id === id);
      setRank(idx >= 0 ? idx + 1 : null);
      setPhase("saved");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const medal =
    total === 100
      ? { emoji: "🏆", msg: "완벽해요! 오늘의 산수 정복!" }
      : total >= 80
        ? { emoji: "🥇", msg: "대단해요! 거의 완벽!" }
        : total >= 50
          ? { emoji: "🥈", msg: "잘했어요! 내일 또 도전!" }
          : { emoji: "🥉", msg: "괜찮아요! 연습하면 늘어요!" };

  const gaugeColor =
    remaining > TIMEOUT_MS * 0.6
      ? "#6BCB77"
      : remaining > TIMEOUT_MS * 0.3
        ? "#FFD93D"
        : "#FF6B6B";

  const today = todayStr();

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
              {qIndex + 1} / {QUESTION_COUNT} · {fmtPts(total)}점
            </span>
          )}
        </div>

        <header className="mb-8 text-center">
          <h1
            className="text-4xl font-black leading-none md:text-6xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#FF8C42",
              textShadow:
                "0 0 20px rgba(255,140,66,0.5), 3px 3px 0px #FFD93D",
            }}
          >
            MATH DAILY
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            매일매일 산수 놀이터 🧮
          </p>
        </header>

        {/* ---------- setup ---------- */}
        {phase === "setup" && (
          <div className="space-y-5">
            {/* streak */}
            <div
              className="rounded-2xl border p-5 text-center"
              style={{ borderColor: "#FF8C4250", background: "#FF8C4210" }}
            >
              <p className="text-4xl">{streak > 0 ? "🔥" : "🧮"}</p>
              <p className="mt-1 text-2xl font-black text-[#FF8C42]">
                {streak > 0 ? `${streak}일 연속 도전 중!` : "오늘부터 시작!"}
              </p>
              <p className="mt-1 text-xs text-white/50">
                {doneToday
                  ? "오늘의 문제는 완료! 내일 새 문제가 나와요 ✅"
                  : "오늘의 10문제를 풀고 불을 지펴요"}
              </p>
            </div>

            {/* grade */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="mb-3 text-sm font-bold text-white/70">학년 (교과 과정)</p>
              <div className="flex gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`flex-1 rounded-full py-2 text-sm font-bold transition cursor-pointer ${
                      grade === g
                        ? "bg-[#FF8C42] text-black"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {g}학년
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-white/50">
                {GRADE_PRESETS[grade].blurb}
              </p>
            </div>

            {/* multi-term ratio */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="mb-3 text-sm font-bold text-white/70">
                다항 연산 비율 · {multiTermPct}%{" "}
                <span className="font-normal text-white/50">
                  ({Math.round((QUESTION_COUNT * multiTermPct) / 100)}/10문제가
                  “a ± b ± c” 3항)
                </span>
              </p>
              <input
                type="range"
                min={0}
                max={100}
                step={10}
                value={multiTermPct}
                onChange={(e) => setMultiTermPct(Number(e.target.value))}
                className="w-full accent-[#FF8C42] cursor-pointer"
                aria-label="다항 연산 비율"
              />
              <p className="mt-1 text-xs text-white/50">
                0%면 모두 두 항(a ± b), 50%면 절반이 세 항(a ± b ± c)으로 나와요
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
              <p>
                📅 <b className="text-white">{today}</b> 오늘의 문제 —{" "}
                {grade}학년 과정의 10문제
              </p>
              <p className="mt-1">
                ⏱ 문제마다 10초 · 만점 100점 · 같은 날엔 모두 같은 문제!
              </p>
              <p className="mt-1">난이도 {difficulty} · {difficultyLabel(difficulty)}</p>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={start}
                className="rounded-full bg-gradient-to-r from-[#FF8C42] to-[#FFD93D] px-10 py-4 text-xl font-black text-black transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                {doneToday ? "오늘의 문제 다시 풀기 🔄" : "오늘의 문제 시작! 🚀"}
              </button>
            </div>
          </div>
        )}

        {/* ---------- play ---------- */}
        {phase === "play" && question && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
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
                      ? `+${fmtPts(gained)}점!`
                      : "아쉬워요 0점"}
                </span>
              )}
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(remaining / TIMEOUT_MS) * 100}%`,
                  background: gaugeColor,
                }}
              />
            </div>

            <p
              className={`mt-8 text-center font-black ${
                question.label ? "text-4xl md:text-5xl" : "text-6xl"
              }`}
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {question.label ? (
                question.label.replace("= ?", "=") + (
                  <span className="text-[#FFD93D]">?</span>
                )
              ) : (
                <>
                  {question.a}{" "}
                  <span className="text-[#FFD93D]">
                    {question.answer === question.a + question.b
                      ? "+"
                      : question.answer === question.a - question.b
                        ? "−"
                        : question.a % question.b === 0 &&
                            question.answer === question.a / question.b
                          ? "÷"
                          : "×"}
                  </span>{" "}
                  {question.b} = ?
                </>
              )}
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {question.options.map((opt) => {
                const isPicked = picked === opt;
                const revealCorrect = locked && opt === question.answer;
                const state = revealCorrect
                  ? "correct"
                  : isPicked
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

        {/* ---------- results ---------- */}
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
              {fmtPts(total)} / 100점
            </p>
            <p className="mt-1 font-mono text-sm text-white/50">
              ⏱ 총 {formatTime(runSeconds)} · {grade}학년 · 난이도{" "}
              {difficulty}
            </p>
            <p
              className="mt-2 text-xl"
              style={{ fontFamily: "'Fredoka', cursive", color: "#FF8C42" }}
            >
              {medal.msg}
            </p>
            <p className="mt-2 text-sm font-bold text-[#FF8C42]">
              🔥 {computeStreak(loadStreakDates())}일 연속 도전!
            </p>

            <div className="mx-auto mt-6 max-w-xs rounded-2xl border border-[#6BCB77]/30 bg-[#6BCB77]/10 p-4">
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
                onClick={() => setPhase("setup")}
                className="mt-2 text-xs text-white/50 underline transition hover:text-white/80 cursor-pointer"
              >
                저장 안 할래요
              </button>
            </div>
          </div>
        )}

        {/* ---------- saved ---------- */}
        {phase === "saved" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-4xl">🏅</p>
            <p className="mt-2 text-lg font-bold text-[#FFD93D]">
              {rank
                ? `리더보드 ${rank}위에 등록했어요!`
                : "리더보드에 등록했어요!"}
            </p>
            <p className="mt-3 text-sm text-white/60">
              오늘의 문제 완주 완료! 🔥 내일 또 만나요!
            </p>
            <button
              type="button"
              onClick={() => setPhase("setup")}
              className="mt-5 rounded-full bg-gradient-to-r from-[#FF8C42] to-[#FFD93D] px-8 py-3 font-black text-black transition hover:scale-105 cursor-pointer"
            >
              처음으로
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
