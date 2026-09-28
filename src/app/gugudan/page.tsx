"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_CONFIG,
  buildPlayQuestions,
  pointsForElapsed,
  pointsForCorrect,
  difficultyScore,
  difficultyLabel,
  type QuizConfig,
  type QuizMode,
  type PlayQuestion,
} from "@/lib/quiz";
import { topicEmoji } from "@/lib/quiz-content";
import {
  fetchLeaderboard,
  formatTime,
  submitScore,
  type LeaderboardEntry,
} from "@/lib/leaderboard";

const FEEDBACK_MS = 1100;
const OPTION_CHOICES = [2, 3, 4, 5];
const TABLE_CHOICES = [2, 3, 4, 5, 6, 7, 8, 9, 10];

type Phase = "setup" | "play" | "results" | "board";

const fmtPts = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export default function GugudanPage() {
  // settings
  const [mode, setMode] = useState<QuizMode>(DEFAULT_CONFIG.mode);
  const [optionCount, setOptionCount] = useState(DEFAULT_CONFIG.optionCount);
  const [tables, setTables] = useState<number[]>(DEFAULT_CONFIG.tables);
  const [customTable, setCustomTable] = useState("");
  const [timeoutSec, setTimeoutSec] = useState(DEFAULT_CONFIG.timeoutMs / 1000);
  const [questionCount, setQuestionCount] = useState(
    DEFAULT_CONFIG.questionCount,
  );

  // game
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<PlayQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [gained, setGained] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [remaining, setRemaining] = useState(DEFAULT_CONFIG.timeoutMs);

  // results + leaderboard
  const [runSeconds, setRunSeconds] = useState(0);
  const [runDifficulty, setRunDifficulty] = useState(31);
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  const startRef = useRef<number>(0);
  const gameStartRef = useRef<number>(0);

  // Remember the school between games (per-device convenience only).
  useEffect(() => {
    const saved = window.localStorage.getItem("gino-quiz-school");
    if (saved) setSchool(saved);
  }, []);

  const config: QuizConfig = {
    op: "mul",
    mode,
    tables,
    rangeMax: DEFAULT_CONFIG.rangeMax,
    optionCount,
    timeoutMs: timeoutSec * 1000,
    questionCount,
  };
  const question = questions[qIndex];
  const locked = picked !== null || timedOut;

  const start = useCallback(() => {
    setQuestions(buildPlayQuestions(config));
    setQIndex(0);
    setPicked(null);
    setTimedOut(false);
    setGained(null);
    setTotal(0);
    setRemaining(config.timeoutMs);
    setSavedId(null);
    setBoardError(null);
    setRunDifficulty(difficultyScore(config));
    gameStartRef.current = Date.now();
    setPhase("play");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, optionCount, tables, timeoutSec, questionCount]);

  // Countdown while a question is live (attack mode only).
  useEffect(() => {
    if (phase !== "play" || locked || mode === "free") return;
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

  function pick(option: string) {
    if (locked || !question) return;
    const correct = option === question.answer;
    const pts = correct
      ? mode === "free"
        ? pointsForCorrect(config)
        : pointsForElapsed(Date.now() - startRef.current, config)
      : 0;
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

  async function saveScore() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const schoolTrimmed = school.trim();
    try {
      setBoardLoading(true);
      setBoardError(null);
      const { id, entries } = await submitScore({
        name: trimmed,
        ...(schoolTrimmed ? { school: schoolTrimmed } : {}),
        score: total,
        totalSeconds: runSeconds,
        date: new Date().toISOString(),
        difficulty: runDifficulty,
        op: "mul",
      });
      window.localStorage.setItem("gino-quiz-school", schoolTrimmed);
      setBoard(entries);
      setSavedId(id);
      setPhase("board");
    } catch (err) {
      setBoardError((err as Error).message);
    } finally {
      setBoardLoading(false);
    }
  }

  async function openBoard() {
    setPhase("board");
    setBoardLoading(true);
    setBoardError(null);
    try {
      setBoard(await fetchLeaderboard());
    } catch (err) {
      setBoardError((err as Error).message);
    } finally {
      setBoardLoading(false);
    }
  }

  const medal =
    total === 100
      ? { emoji: "🏆", msg: "완벽해요! 번개 속도!" }
      : total >= 80
        ? { emoji: "🥇", msg: "대단해요! 거의 완벽!" }
        : total >= 50
          ? { emoji: "🥈", msg: "잘했어요! 조금만 더 빠르게!" }
          : { emoji: "🥉", msg: "괜찮아요! 연습하면 빨라져요!" };

  const gaugeColor =
    remaining > config.timeoutMs * 0.6
      ? "#6BCB77"
      : remaining > config.timeoutMs * 0.3
        ? "#FFD93D"
        : "#FF6B6B";

  const canStart = tables.length > 0;

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
            GUGUDAN
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            구구단 챌린지 ⚡
          </p>
        </header>

        {/* ---------- setup ---------- */}
        {phase === "setup" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="mb-3 text-sm font-bold text-white/70">게임 모드</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("attack")}
                  className={`flex-1 rounded-full py-2 text-sm font-bold transition cursor-pointer ${
                    mode === "attack"
                      ? "bg-[#FF6B9D] text-black"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  ⚡ 타임어택
                </button>
                <button
                  type="button"
                  onClick={() => setMode("free")}
                  className={`flex-1 rounded-full py-2 text-sm font-bold transition cursor-pointer ${
                    mode === "free"
                      ? "bg-[#6BCB77] text-black"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  ✅ 맞추기
                </button>
              </div>
              <p className="mt-2 text-xs text-white/50">
                {mode === "attack"
                  ? "빠르게 맞힐수록 점수가 커요! 시간이 지나면 0점"
                  : "시간 제한 없이 맞히기만 하면 문항당 고정 점수!"}
              </p>
            </div>

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
                  onChange={(e) =>
                    setCustomTable(e.target.value.replace(/\D/g, ""))
                  }
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
              {mode === "attack" && (
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
              )}
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
              <p
                className="inline-block rounded-full px-4 py-1 text-sm font-black"
                style={{ background: "#FF6B9D20", color: "#FF6B9D" }}
              >
                이 설정의 난이도: {difficultyScore(config)} ·{" "}
                {difficultyLabel(difficultyScore(config))}
              </p>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={start}
                  disabled={!canStart}
                  className="rounded-full bg-gradient-to-r from-[#FFD93D] to-[#FF8C42] px-10 py-4 text-xl font-black text-black transition hover:scale-105 active:scale-95 disabled:opacity-30 cursor-pointer"
                >
                  {!canStart ? "단을 골라주세요!" : "시작! 🚀"}
                </button>
              </div>
              <p className="mt-2 text-xs text-white/40">
                만점은 언제나 100점! 빠르게 맞힐수록 점수가 커요
              </p>
            </div>
          </div>
        )}

        {/* ---------- play ---------- */}
        {phase === "play" && question && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            {mode === "attack" ? (
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
            ) : (
              <div className="mb-2 flex items-center justify-between text-xs font-bold">
                <span className="text-[#6BCB77]">✅ 천천히 생각해도 돼요</span>
                {gained !== null && (
                  <span
                    className="text-lg"
                    style={{ color: gained > 0 ? "#6BCB77" : "#FF6B9D" }}
                  >
                    {gained > 0 ? `+${fmtPts(gained)}점!` : "아쉬워요 0점"}
                  </span>
                )}
              </div>
            )}
            {mode === "attack" && (
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(remaining / config.timeoutMs) * 100}%`,
                    background: gaugeColor,
                  }}
                />
              </div>
            )}

            <p
              className="mt-8 text-center text-6xl font-black"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {question.display}
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
              ⏱ 총 {formatTime(runSeconds)}
            </p>
            <p className="mt-1 text-sm font-bold text-[#FF6B9D]">
              난이도 {runDifficulty} · {difficultyLabel(runDifficulty)}
            </p>
            <p
              className="mt-2 text-xl"
              style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
            >
              {medal.msg}
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
                    disabled={!name.trim() || boardLoading}
                    className="rounded-xl bg-[#6BCB77] px-4 py-2 text-sm font-black text-black transition hover:opacity-90 disabled:opacity-30 cursor-pointer"
                  >
                    {boardLoading ? "저장 중..." : "저장"}
                  </button>
                </div>
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
            {boardError && (
              <div className="py-6 text-center">
                <p className="text-sm text-[#FF6B9D]">{boardError}</p>
                <button
                  type="button"
                  onClick={openBoard}
                  className="mt-3 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white/70 hover:bg-white/20 cursor-pointer"
                >
                  다시 시도
                </button>
              </div>
            )}
            {!boardError && boardLoading && (
              <p className="py-8 text-center text-white/50">
                리더보드를 불러오는 중...
              </p>
            )}
            {!boardError && !boardLoading && board.length === 0 && (
              <p className="py-8 text-center text-white/50">
                아직 기록이 없어요. 첫 주인이 되어보세요!
              </p>
            )}
            {!boardError && !boardLoading && board.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[460px] text-sm">
                  <thead>
                    <tr className="text-left text-white/40">
                      <th className="pb-2">#</th>
                      <th className="pb-2">이름</th>
                      <th className="pb-2">점수</th>
                      <th className="pb-2">총시간</th>
                      <th className="pb-2">난이도</th>
                      <th className="pb-2">날짜</th>
                    </tr>
                  </thead>
                  <tbody>
                    {board.map((e, i) => {
                      const mine = e.id !== undefined && e.id === savedId;
                      const prefix = e.topic ? topicEmoji(e.topic) : "✖️";
                      return (
                        <tr
                          key={e.id ?? `${e.date}-${i}`}
                          className={`border-t border-white/10 ${mine ? "bg-[#FFD93D]/10 font-black text-[#FFD93D]" : ""}`}
                        >
                          <td className="py-2">{i + 1}</td>
                          <td className="py-2">
                            {prefix} {e.name}
                            {e.school && (
                              <span className="ml-1.5 text-xs font-bold text-white/45">
                                {e.school}
                              </span>
                            )}
                          </td>
                          <td className="py-2">{fmtPts(e.score)}</td>
                          <td className="py-2 font-mono">
                            {formatTime(e.totalSeconds)}
                          </td>
                          <td className="py-2 whitespace-nowrap text-xs">
                            {e.difficulty === undefined ? (
                              <span className="text-white/30">—</span>
                            ) : (
                              `${e.difficulty} ${difficultyLabel(e.difficulty)}`
                            )}
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
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={start}
                className="rounded-full bg-gradient-to-r from-[#FFD93D] to-[#FF8C42] px-6 py-2 font-black text-black transition hover:scale-105 cursor-pointer"
              >
                🔁 한 게임 더!
              </button>
              <button
                type="button"
                onClick={() => setPhase("setup")}
                className="rounded-full bg-white/10 px-6 py-2 font-bold text-white/70 transition hover:bg-white/20 cursor-pointer"
              >
                ⚙ 설정 바꾸기
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
