"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_CONFIG,
  buildQuiz,
  pointsForElapsed,
  type QuizConfig,
  type QuizQuestion,
} from "@/lib/quiz";
import {
  addEntry,
  formatTime,
  loadLeaderboard,
  type LeaderboardEntry,
} from "@/lib/leaderboard";

const FEEDBACK_MS = 1100;
const OPTION_CHOICES = [2, 3, 4, 5];
const TABLE_CHOICES = [2, 3, 4, 5, 6, 7, 8, 9, 10];

type Phase = "setup" | "play" | "results" | "board";

const fmtPts = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export default function QuizPage() {
  // settings
  const [optionCount, setOptionCount] = useState(DEFAULT_CONFIG.optionCount);
  const [tables, setTables] = useState<number[]>(DEFAULT_CONFIG.tables);
  const [customTable, setCustomTable] = useState("");
  const [timeoutSec, setTimeoutSec] = useState(DEFAULT_CONFIG.timeoutMs / 1000);
  const [questionCount, setQuestionCount] = useState(
    DEFAULT_CONFIG.questionCount,
  );

  // game
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [gained, setGained] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [remaining, setRemaining] = useState(DEFAULT_CONFIG.timeoutMs);

  // results + leaderboard
  const [runSeconds, setRunSeconds] = useState(0);
  const [name, setName] = useState("");
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [savedDate, setSavedDate] = useState<string | null>(null);

  const startRef = useRef<number>(0);
  const gameStartRef = useRef<number>(0);

  const config: QuizConfig = {
    tables,
    optionCount,
    timeoutMs: timeoutSec * 1000,
    questionCount,
  };
  const question = questions[qIndex];
  const locked = picked !== null || timedOut;

  const start = useCallback(() => {
    setQuestions(buildQuiz(config));
    setQIndex(0);
    setPicked(null);
    setTimedOut(false);
    setGained(null);
    setTotal(0);
    setRemaining(config.timeoutMs);
    setSavedDate(null);
    gameStartRef.current = Date.now();
    setPhase("play");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionCount, tables, timeoutSec, questionCount]);

  // Countdown while a question is live.
  useEffect(() => {
    if (phase !== "play" || locked) return;
    startRef.current = Date.now();
    setRemaining(config.timeoutMs);
    const tick = setInterval(() => {
      const left = config.timeoutMs - (Date.now() - startRef.current);
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

  // Advance after the feedback flash.
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
      setTimedOut(false);
      setGained(null);
    }, FEEDBACK_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, locked, qIndex]);

  function pick(option: number) {
    if (locked || !question) return;
    const elapsed = Date.now() - startRef.current;
    const correct = option === question.answer;
    const pts = correct ? pointsForElapsed(elapsed, config) : 0;
    setPicked(option);
    setGained(pts);
    if (pts > 0) setTotal((t) => t + pts);
  }

  function toggleTable(t: number) {
    setTables((cur) =>
      cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t],
    );
  }

  function addCustomTable() {
    const n = Number(customTable);
    if (Number.isInteger(n) && n >= 11 && n <= 99 && !tables.includes(n)) {
      setTables((cur) => [...cur, n]);
    }
    setCustomTable("");
  }

  function saveScore() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const date = new Date().toISOString();
    setBoard(addEntry({ name: trimmed, score: total, totalSeconds: runSeconds, date }));
    setSavedDate(date);
    setPhase("board");
  }

  function openBoard() {
    setBoard(loadLeaderboard());
    setPhase("board");
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
    remaining > config.timeoutMs * 0.6
      ? "#6BCB77"
      : remaining > config.timeoutMs * 0.3
        ? "#FFD93D"
        : "#FF6B6B";

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
          <div className="flex items-center gap-3">
            {phase === "play" && (
              <span className="font-mono text-sm text-white/50">
                {qIndex + 1} / {questionCount} · {fmtPts(total)}점
              </span>
            )}
            {phase === "setup" && (
              <button
                type="button"
                onClick={openBoard}
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/20 cursor-pointer"
              >
                🏆 리더보드
              </button>
            )}
          </div>
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
            구구단 포인트 챌린지 ⚡
          </p>
        </header>

        {/* ---------- setup ---------- */}
        {phase === "setup" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="mb-3 text-sm font-bold text-white/70">선택지 수</p>
              <div className="flex gap-2">
                {OPTION_CHOICES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setOptionCount(n)}
                    className={`flex-1 rounded-full py-2 text-sm font-bold transition cursor-pointer ${
                      optionCount === n
                        ? "bg-[#FFD93D] text-black"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {n}지선다
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="mb-3 text-sm font-bold text-white/70">
                구구단 단 (여러 개 선택 가능)
              </p>
              <div className="flex flex-wrap gap-2">
                {TABLE_CHOICES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTable(t)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition cursor-pointer ${
                      tables.includes(t)
                        ? "bg-[#FF6B9D] text-black"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {t}단
                  </button>
                ))}
                {tables
                  .filter((t) => t > 10)
                  .map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTable(t)}
                      className="rounded-full bg-[#FF6B9D] px-4 py-2 text-sm font-bold text-black transition cursor-pointer"
                    >
                      {t}단 ✕
                    </button>
                  ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  value={customTable}
                  onChange={(e) => setCustomTable(e.target.value.replace(/\D/g, ""))}
                  placeholder="11단 이상 직접 입력"
                  className="w-36 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#FFD93D]"
                  aria-label="직접 단 입력"
                />
                <button
                  type="button"
                  onClick={addCustomTable}
                  className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white/80 transition hover:bg-white/20 cursor-pointer"
                >
                  추가
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="mb-3 text-sm font-bold text-white/70">
                  타임아웃 · {timeoutSec}초
                </p>
                <input
                  type="range"
                  min={3}
                  max={15}
                  step={1}
                  value={timeoutSec}
                  onChange={(e) => setTimeoutSec(Number(e.target.value))}
                  className="w-full accent-[#FF6B9D] cursor-pointer"
                  aria-label="타임아웃 초"
                />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="mb-3 text-sm font-bold text-white/70">
                  문항수 · {questionCount}문제
                </p>
                <input
                  type="range"
                  min={5}
                  max={20}
                  step={1}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full accent-[#FFD93D] cursor-pointer"
                  aria-label="문항수"
                />
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={start}
                disabled={tables.length === 0}
                className="rounded-full bg-gradient-to-r from-[#FFD93D] to-[#FF8C42] px-10 py-4 text-xl font-black text-black transition hover:scale-105 active:scale-95 disabled:opacity-30 cursor-pointer"
              >
                {tables.length === 0 ? "단을 골라주세요!" : "시작! 🚀"}
              </button>
              <p className="mt-2 text-xs text-white/40">
                만점은 언제나 50점! 빠르게 맞힐수록 점수가 커요
              </p>
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
                  width: `${(remaining / config.timeoutMs) * 100}%`,
                  background: gaugeColor,
                }}
              />
            </div>

            <p
              className="mt-8 text-center text-6xl font-black"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {question.a} × {question.b} = ?
            </p>

            <div
              className={`mt-8 grid gap-4 ${optionCount >= 4 ? "grid-cols-2" : "grid-cols-" + Math.min(optionCount, 3)}`}
              style={{ gridTemplateColumns: `repeat(${Math.min(optionCount, 3)}, minmax(0, 1fr))` }}
            >
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
              {fmtPts(total)} / 50점
            </p>
            <p className="mt-1 font-mono text-sm text-white/50">
              ⏱ 총 {formatTime(runSeconds)}
            </p>
            <p
              className="mt-2 text-xl"
              style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
            >
              {medal.msg}
            </p>

            {/* save prompt */}
            <div className="mx-auto mt-6 max-w-xs rounded-2xl border border-[#6BCB77]/30 bg-[#6BCB77]/10 p-4">
              <p className="text-sm font-bold text-white/80">
                🏆 리더보드에 남길까요?
              </p>
              <div className="mt-3 flex gap-2">
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
                  disabled={!name.trim()}
                  className="rounded-xl bg-[#6BCB77] px-4 py-2 text-sm font-black text-black transition hover:opacity-90 disabled:opacity-30 cursor-pointer"
                >
                  저장
                </button>
              </div>
              <button
                type="button"
                onClick={() => setPhase("board")}
                className="mt-2 text-xs text-white/50 underline transition hover:text-white/80 cursor-pointer"
              >
                저장 안 하고 리더보드만 볼래요
              </button>
            </div>

            <button
              type="button"
              onClick={() => setPhase("setup")}
              className="mt-5 rounded-full bg-white/10 px-6 py-2 text-sm font-bold text-white/70 transition hover:bg-white/20 cursor-pointer"
            >
              ⚙ 설정으로
            </button>
          </div>
        )}

        {/* ---------- leaderboard ---------- */}
        {phase === "board" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2
              className="mb-4 text-center text-2xl font-black"
              style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
            >
              🏆 리더보드
            </h2>
            {board.length === 0 ? (
              <p className="py-8 text-center text-white/50">
                아직 기록이 없어요. 첫 주인이 되어보세요!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[380px] text-sm">
                  <thead>
                    <tr className="text-left text-white/40">
                      <th className="pb-2">#</th>
                      <th className="pb-2">이름</th>
                      <th className="pb-2">점수</th>
                      <th className="pb-2">총시간</th>
                      <th className="pb-2">날짜</th>
                    </tr>
                  </thead>
                  <tbody>
                    {board.map((e, i) => {
                      const mine = e.date === savedDate;
                      return (
                        <tr
                          key={e.date + e.name + i}
                          className={`border-t border-white/10 ${mine ? "bg-[#FFD93D]/10 font-black text-[#FFD93D]" : ""}`}
                        >
                          <td className="py-2">{i + 1}</td>
                          <td className="py-2">{e.name}</td>
                          <td className="py-2">{fmtPts(e.score)}</td>
                          <td className="py-2 font-mono">
                            {formatTime(e.totalSeconds)}
                          </td>
                          <td className="py-2 text-white/50">
                            {e.date.slice(5, 10).replace("-", "/")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setPhase("setup")}
                className="rounded-full bg-gradient-to-r from-[#FFD93D] to-[#FF8C42] px-6 py-2 font-black text-black transition hover:scale-105 cursor-pointer"
              >
                ⚙ 다시 설정하고 도전!
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
