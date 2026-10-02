"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildDictationQuestions,
  dictationDifficulty,
  type DictationQuestion,
  type DictationTier,
} from "@/lib/dictation";
import { difficultyLabel, pointsForElapsed } from "@/lib/quiz";
import { formatTime, submitScore } from "@/lib/leaderboard";

const FEEDBACK_MS = 1400;
const TIMEOUT_MS = 10000;
const QUESTION_COUNT = 10;
const PER_QUESTION_MAX = 10; // 100 points / 10 questions

const TIERS: Record<DictationTier, { label: string; blurb: string }> = {
  words: { label: "🌱 낱말", blurb: "1~2학년 · 받침·된소리 기초" },
  sentences: { label: "🔥 문장", blurb: "3~4학년 · 안/않, 되/돼, 띄어쓰기" },
  advanced: { label: "⚡ 도전", blurb: "5~6학년 · 사이시옷, 겹받침" },
};

type Phase = "setup" | "play" | "results" | "saved";

const fmtPts = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** Speak Korean text via the built-in speech synthesis, a touch slower for
 *  dictation clarity. Returns false when speech is unavailable. */
function speak(text: string): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 0.85;
  const koVoice = window.speechSynthesis
    .getVoices()
    .find((v) => v.lang.startsWith("ko"));
  if (koVoice) u.voice = koVoice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return true;
}

export default function DictationPage() {
  const [tier, setTier] = useState<DictationTier>("words");
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<DictationQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [gained, setGained] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [remaining, setRemaining] = useState(TIMEOUT_MS);
  const [runSeconds, setRunSeconds] = useState(0);
  const [speechOk, setSpeechOk] = useState(true);

  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rank, setRank] = useState<number | null>(null);

  const startRef = useRef<number>(0);
  const gameStartRef = useRef<number>(0);

  const question = questions[qIndex];
  const locked = picked !== null || timedOut;
  const difficulty = dictationDifficulty(tier);

  useEffect(() => {
    const saved = window.localStorage.getItem("gino-quiz-school");
    if (saved) setSchool(saved);
    // Probe speech availability + voice list loading.
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    } else {
      setSpeechOk(false);
    }
  }, []);

  const start = useCallback(() => {
    const qs = buildDictationQuestions(tier, QUESTION_COUNT);
    setQuestions(qs);
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
    setSpeechOk(speak(qs[0]?.word ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  const replay = useCallback(() => {
    if (question) setSpeechOk(speak(question.word));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

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

  // Advance after the feedback flash.
  useEffect(() => {
    if (phase !== "play" || !locked) return;
    const t = setTimeout(() => {
      if (qIndex + 1 >= QUESTION_COUNT) {
        setRunSeconds((Date.now() - gameStartRef.current) / 1000);
        setPhase("results");
        return;
      }
      const next = qIndex + 1;
      setQIndex(next);
      setPicked(null);
      setTimedOut(false);
      setGained(null);
      const nextQ = questions[next];
      if (nextQ) setSpeechOk(speak(nextQ.word));
    }, FEEDBACK_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, locked, qIndex]);

  function pick(option: string) {
    if (locked || !question) return;
    const correct = option === question.answer;
    const pts = correct
      ? pointsForElapsed(Date.now() - startRef.current, {
          op: "add",
          mode: "attack",
          tables: [2],
          rangeMax: 100,
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
        topic: "dictation",
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
      ? { emoji: "🏆", msg: "완벽해요! 맞춤법 마스터!" }
      : total >= 80
        ? { emoji: "🥇", msg: "대단해요! 철자가 정확하네요!" }
        : total >= 50
          ? { emoji: "🥈", msg: "잘했어요! 헷갈리는 것만 다시!" }
          : { emoji: "🥉", msg: "괜찮아요! 들을수록 늘어요!" };

  const gaugeColor =
    remaining > TIMEOUT_MS * 0.6
      ? "#6BCB77"
      : remaining > TIMEOUT_MS * 0.3
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
              {qIndex + 1} / {QUESTION_COUNT} · {fmtPts(total)}점
            </span>
          )}
        </div>

        <header className="mb-8 text-center">
          <h1
            className="text-4xl font-black leading-none md:text-6xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#6BCB77",
              textShadow:
                "0 0 20px rgba(107,203,119,0.5), 3px 3px 0px #FFD93D",
            }}
          >
            DICTATION
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            받아쓰기 챌린지 📝
          </p>
          <p
            className="mt-2 inline-block rounded-full px-4 py-1 text-sm font-black"
            style={{ background: "#6BCB7720", color: "#6BCB77" }}
          >
            {TIERS[tier].label} · 난이도 {difficulty}{" "}
            {difficultyLabel(difficulty)}
          </p>
        </header>

        {/* ---------- setup ---------- */}
        {phase === "setup" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="mb-3 text-sm font-bold text-white/70">단계</p>
              <div className="flex gap-2">
                {(Object.keys(TIERS) as DictationTier[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    className={`flex-1 rounded-full py-2 text-sm font-bold transition cursor-pointer ${
                      tier === t
                        ? "bg-[#6BCB77] text-black"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {TIERS[t].label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-white/50">{TIERS[tier].blurb}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
              <p>🔊 단어를 듣고 4개의 철자 중 올바른 맞춤법 고르기</p>
              <p className="mt-1">⏱ 문제마다 10초 · 만점 100점 · 10문제</p>
              <p className="mt-1">
                💡 스피커를 켜주세요 — 🔊 버튼으로 몇 번이든 다시 들을 수 있어요
              </p>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={start}
                className="rounded-full bg-gradient-to-r from-[#6BCB77] to-[#FFD93D] px-10 py-4 text-xl font-black text-black transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                받아쓰기 시작! 🚀
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

            {/* speaker */}
            <div className="mt-8 flex flex-col items-center">
              <button
                type="button"
                onClick={replay}
                className="flex h-24 w-24 items-center justify-center rounded-full border-4 text-4xl transition hover:scale-105 active:scale-95 cursor-pointer"
                style={{ borderColor: "#6BCB77", background: "#6BCB7720" }}
                aria-label="다시 듣기"
              >
                🔊
              </button>
              <p className="mt-2 text-xs text-white/50">
                {speechOk
                  ? "몇 번이든 다시 들을 수 있어요"
                  : "음성이 안 들리면 아래 글자를 보고 고르세요"}
              </p>
              {!speechOk && (
                <p
                  className="mt-1 text-xl font-black"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {question.word}
                </p>
              )}
            </div>

            {/* choices */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    className={`min-h-[56px] rounded-2xl border-2 px-4 py-3 text-lg font-bold transition cursor-pointer ${
                      state === "correct"
                        ? "border-[#6BCB77] bg-[#6BCB77]/25 text-[#6BCB77]"
                        : state === "wrong"
                          ? "animate-shake border-[#FF6B9D]/50 bg-[#FF6B9D]/15 text-white/40"
                          : "border-white/15 bg-black/30 text-white hover:border-[#FFD93D]"
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
                정답은 “{question.answer}”!
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
              ⏱ 총 {formatTime(runSeconds)} · {TIERS[tier].label} · 난이도{" "}
              {difficulty}
            </p>
            <p
              className="mt-2 text-xl"
              style={{ fontFamily: "'Fredoka', cursive", color: "#6BCB77" }}
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
                className="rounded-full bg-gradient-to-r from-[#6BCB77] to-[#FFD93D] px-6 py-2 font-black text-black transition hover:scale-105 cursor-pointer"
              >
                다시 도전!
              </button>
              <button
                type="button"
                onClick={() => setPhase("setup")}
                className="rounded-full bg-white/10 px-6 py-2 font-bold text-white/70 transition hover:bg-white/20 cursor-pointer"
              >
                ⚙ 단계 바꾸기
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
