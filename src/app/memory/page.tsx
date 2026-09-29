"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildMemoryDeck,
  computeMemoryScore,
  memoryDifficulty,
  cardFace,
  THEME_LABELS,
  type MemoryCard,
  type MemoryTheme,
} from "@/lib/memory";
import { difficultyLabel } from "@/lib/quiz";
import { formatTime, submitScore } from "@/lib/leaderboard";

const SIZE_CHOICES = [2, 3, 4, 5, 6];
const FLIP_BACK_MS = 900;

type Phase = "setup" | "play" | "results" | "saved";

const fmtPts = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

interface CardState extends MemoryCard {
  matched: boolean;
}

export default function MemoryPage() {
  // settings
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(3);
  const [theme, setTheme] = useState<MemoryTheme>("animals");
  const [limitSec, setLimitSec] = useState(60);

  // game
  const [phase, setPhase] = useState<Phase>("setup");
  const [deck, setDeck] = useState<CardState[]>([]);
  const [flippedIdx, setFlippedIdx] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(60000);
  const [finalScore, setFinalScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  // leaderboard save
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rank, setRank] = useState<number | null>(null);

  const flipBackTimer = useRef<number>(0);
  const limitMs = limitSec * 1000;

  const totalUnits = deck.length / 2; // pairs + bonus = total to clear
  const foundUnits = deck.filter((c) => c.matched).length / 2;

  useEffect(() => {
    const saved = window.localStorage.getItem("gino-quiz-school");
    if (saved) setSchool(saved);
  }, []);

  const difficulty = memoryDifficulty(rows, cols, limitSec);
  const total = rows * cols;

  function start() {
    setDeck(
      buildMemoryDeck(rows, cols).map((c) => ({ ...c, matched: false })),
    );
    setFlippedIdx([]);
    setMoves(0);
    setTimeLeftMs(limitMs);
    setFinalScore(0);
    setCompleted(false);
    setRank(null);
    setError(null);
    setPhase("play");
  }

  /** End the round (all found or timeout) with the 100-point score. */
  const finish = useCallback(
    (didComplete: boolean) => {
      const found = deck.filter((c) => c.matched).length / 2;
      const total = deck.length / 2;
      setCompleted(didComplete);
      setFinalScore(
        computeMemoryScore({
          found,
          total,
          timeLeftMs: didComplete ? timeLeftMs : 0,
          limitMs,
          completed: didComplete,
        }),
      );
      setPhase("results");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deck, timeLeftMs, limitMs],
  );

  // Countdown.
  useEffect(() => {
    if (phase !== "play") return;
    const tick = setInterval(() => {
      setTimeLeftMs((left) => {
        if (left <= 100) {
          clearInterval(tick);
          return 0;
        }
        return left - 100;
      });
    }, 100);
    return () => clearInterval(tick);
  }, [phase]);

  // Timeout end.
  useEffect(() => {
    if (phase === "play" && timeLeftMs <= 0) {
      finish(false);
    }
  }, [phase, timeLeftMs, finish]);

  // Mismatch flip-back.
  useEffect(() => {
    if (flippedIdx.length !== 2) return;
    const [a, b] = flippedIdx;
    const cardA = deck[a];
    const cardB = deck[b];
    if (cardA.value === cardB.value && !cardA.isBonus) {
      // matched
      setDeck((cur) =>
        cur.map((c, i) =>
          i === a || i === b ? { ...c, matched: true } : c,
        ),
      );
      setFlippedIdx([]);
    } else {
      flipBackTimer.current = window.setTimeout(() => {
        setFlippedIdx([]);
      }, FLIP_BACK_MS);
    }
    return () => clearTimeout(flipBackTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flippedIdx]);

  // Completion check.
  useEffect(() => {
    if (phase !== "play" || deck.length === 0) return;
    if (deck.every((c) => c.matched)) {
      finish(true);
    }
  }, [deck, phase, finish]);

  function flipCard(i: number) {
    if (phase !== "play") return;
    if (flippedIdx.length >= 2) return;
    const card = deck[i];
    if (card.matched || flippedIdx.includes(i)) return;

    if (card.isBonus) {
      // 🍩 matches itself instantly.
      setDeck((cur) => cur.map((c, idx) => (idx === i ? { ...c, matched: true } : c)));
      setFlippedIdx([]);
      return;
    }

    const next = [...flippedIdx, i];
    setFlippedIdx(next);
    if (next.length === 2) setMoves((m) => m + 1);
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
        score: finalScore,
        totalSeconds: (limitMs - timeLeftMs) / 1000,
        date: new Date().toISOString(),
        difficulty,
        topic: "memory",
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
    finalScore === 100
      ? { emoji: "🏆", msg: "완벽해요! 초고속 기억력!" }
      : finalScore >= 80
        ? { emoji: "🥇", msg: "대단해요! 기억력이 좋네요!" }
        : finalScore >= 50
          ? { emoji: "🥈", msg: "잘했어요! 완주 성공!" }
          : { emoji: "🥉", msg: "괜찮아요! 다음엔 더 찾을 수 있어요!" };

  const gaugeColor =
    timeLeftMs > limitMs * 0.5
      ? "#6BCB77"
      : timeLeftMs > limitMs * 0.25
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
          {phase === "play" && (
            <span className="font-mono text-sm text-white/50">
              {foundUnits}/{totalUnits} · {moves}번 ·{" "}
              {Math.ceil(timeLeftMs / 1000)}초
            </span>
          )}
        </div>

        <header className="mb-8 text-center">
          <h1
            className="text-4xl font-black leading-none md:text-6xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#c77dff",
              textShadow:
                "0 0 20px rgba(199,125,255,0.5), 3px 3px 0px #FFD93D",
            }}
          >
            MEMORY
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            기억력 챌린지 🧠
          </p>
        </header>

        {/* ---------- setup ---------- */}
        {phase === "setup" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="mb-3 text-sm font-bold text-white/70">카드 그림</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(THEME_LABELS) as MemoryTheme[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`flex-1 whitespace-nowrap rounded-full px-3 py-2 text-sm font-bold transition cursor-pointer ${
                      theme === t
                        ? "bg-[#c77dff] text-black"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {THEME_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="mb-3 text-sm font-bold text-white/70">
                가로 칸 수
              </p>
              <div className="flex gap-2">
                {SIZE_CHOICES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCols(n)}
                    className={`flex-1 rounded-full py-2 text-sm font-bold transition cursor-pointer ${
                      cols === n
                        ? "bg-[#c77dff] text-black"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="mb-3 mt-4 text-sm font-bold text-white/70">
                세로 줄 수
              </p>
              <div className="flex gap-2">
                {SIZE_CHOICES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRows(n)}
                    className={`flex-1 rounded-full py-2 text-sm font-bold transition cursor-pointer ${
                      rows === n
                        ? "bg-[#c77dff] text-black"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-white/50">
                {rows}×{cols} = {total}장 ·{" "}
                {total % 2 === 1
                  ? `${(total - 1) / 2}쌍 + 🍩 보너스 1장`
                  : `${total / 2}쌍`}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="mb-3 text-sm font-bold text-white/70">
                시간 제한 · {limitSec}초
              </p>
              <input
                type="range"
                min={30}
                max={300}
                step={15}
                value={limitSec}
                onChange={(e) => setLimitSec(Number(e.target.value))}
                className="w-full accent-[#c77dff] cursor-pointer"
                aria-label="시간 제한 초"
              />
            </div>

            <div className="text-center">
              <p
                className="inline-block rounded-full px-4 py-1 text-sm font-black"
                style={{ background: "#c77dff20", color: "#c77dff" }}
              >
                이 설정의 난이도: {difficulty} · {difficultyLabel(difficulty)}
              </p>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={start}
                  className="rounded-full bg-gradient-to-r from-[#c77dff] to-[#FFD93D] px-10 py-4 text-xl font-black text-black transition hover:scale-105 active:scale-95 cursor-pointer"
                >
                  시작! 🚀
                </button>
              </div>
              <p className="mt-2 text-xs text-white/40">
                카드를 뒤집어 같은 숫자의 짝을 찾아요! 다 찾으면 최대 100점
              </p>
            </div>
          </div>
        )}

        {/* ---------- play ---------- */}
        {phase === "play" && (
          <div>
            <div className="mb-4">
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(timeLeftMs / limitMs) * 100}%`,
                    background: gaugeColor,
                  }}
                />
              </div>
            </div>

            <div
              className="memory-scene mx-auto grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                maxWidth: `${cols * 88}px`,
              }}
            >
              {deck.map((card, i) => {
                const isFlipped = card.matched || flippedIdx.includes(i);
                return (
                  <div key={card.id} className="aspect-square">
                    <div
                      className={`memory-card ${isFlipped ? "flipped" : ""} ${card.matched ? "matched" : ""}`}
                      onClick={() => flipCard(i)}
                      role="button"
                      aria-label={card.matched ? "찾은 카드" : "카드"}
                    >
                      {/* face-down side */}
                      <div
                        className="memory-face border-2 text-2xl"
                        style={{
                          background:
                            "linear-gradient(135deg, #3d2c63, #241a3f)",
                          borderColor: card.matched
                            ? "#6BCB77"
                            : "rgba(199,125,255,0.4)",
                          boxShadow: card.matched
                            ? "0 0 12px rgba(107,203,119,0.5)"
                            : undefined,
                        }}
                      >
                        🍩
                      </div>
                      {/* face side — themed; matched cards stay up with a check */}
                      <div
                        className="memory-face back border-2"
                        style={{
                          background: card.matched
                            ? "rgba(107,203,119,0.3)"
                            : "#f5efff",
                          borderColor: card.matched ? "#6BCB77" : "#c77dff",
                          color: "#1A0A2E",
                          fontFamily:
                            theme === "numbers"
                              ? "var(--font-space-grotesk)"
                              : undefined,
                          fontSize:
                            theme === "numbers"
                              ? cols >= 6 || rows >= 6
                                ? "1.05rem"
                                : "1.4rem"
                              : cols >= 6 || rows >= 6
                                ? "1.3rem"
                                : "1.7rem",
                          opacity: card.matched ? 0.92 : 1,
                        }}
                      >
                        {card.isBonus ? "🍩!" : cardFace(theme, card.value)}
                        {card.matched && (
                          <span className="memory-check" aria-hidden>
                            ✅
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
              {fmtPts(finalScore)} / 100점
            </p>
            <p className="mt-1 font-mono text-sm text-white/50">
              {completed
                ? `완주! 🎉 ${formatTime((limitMs - timeLeftMs) / 1000)} · ${moves}번`
                : `시간 초과 ⏰ ${foundUnits}/${totalUnits} 쌍 · ${moves}번`}{" "}
              · 난이도 {difficulty} {difficultyLabel(difficulty)}
            </p>
            <p
              className="mt-2 text-xl"
              style={{ fontFamily: "'Fredoka', cursive", color: "#c77dff" }}
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
            <p className="mt-1 text-xs text-white/50">
              전체 리더보드는 구구단 챌린지(⚡)에서 볼 수 있어요
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={start}
                className="rounded-full bg-gradient-to-r from-[#c77dff] to-[#FFD93D] px-6 py-2 font-black text-black transition hover:scale-105 cursor-pointer"
              >
                다시 도전!
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
