"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildCampingGame,
  campingDifficulty,
  rankCampingPlayers,
  CATEGORY_EMOJI,
  CAMPING_SCORE_CONFIG,
  LEVEL_LABELS,
  ROUND_TIMEOUT_MS,
  TOTAL_ROUNDS,
  type CampingCategory,
  type CampingLevel,
  type CampingPlayer,
  type CampingPlayerGame,
  type RankedCampingPlayer,
} from "@/lib/camping";
import { difficultyLabel, pointsForElapsed } from "@/lib/quiz";
import { formatTime, submitScore } from "@/lib/leaderboard";

const FEEDBACK_MS = 1400;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;
const ROSTER_KEY = "gino-camping-players";

const MEDALS = ["🥇", "🥈", "🥉", "🎖️"];
const LEVELS: CampingLevel[] = ["easy", "normal", "hard"];

type Phase = "setup" | "handoff" | "play" | "results" | "podium" | "saved";
type Mode = "single" | "party";
type SaveState = "idle" | "saving" | "saved" | "offline";
type RoundStage = "flash" | "question";

interface PlayerResult {
  score: number;
  totalSeconds: number;
  byCategory: Record<CampingCategory, number>;
}

const emptyResult = (): PlayerResult => ({
  score: 0,
  totalSeconds: 0,
  byCategory: { memory: 0, logic: 0, math: 0, word: 0 },
});

const fmtPts = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** Speak Korean text via the built-in speech synthesis (same contract as
 *  /dictation). Returns false when speech is unavailable. */
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

export default function CampingPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>("single");
  const [level, setLevel] = useState<CampingLevel>("normal");
  const [roster, setRoster] = useState<CampingPlayer[]>([
    { name: "", level: "easy" },
    { name: "", level: "normal" },
    { name: "", level: "normal" },
  ]);
  const [games, setGames] = useState<CampingPlayerGame[]>([]);
  const [playerIdx, setPlayerIdx] = useState(0);
  const [roundIdx, setRoundIdx] = useState(0);
  const [stage, setStage] = useState<RoundStage>("question");
  const [picked, setPicked] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [gained, setGained] = useState<number | null>(null);
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [remaining, setRemaining] = useState(ROUND_TIMEOUT_MS);
  const [speechOk, setSpeechOk] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rank, setRank] = useState<number | null>(null);

  const startRef = useRef<number>(0);
  const playerStartRef = useRef<number>(0);

  const game = games[playerIdx];
  const round = game?.rounds[roundIdx];
  const locked = picked !== null || timedOut;

  useEffect(() => {
    const savedSchool = window.localStorage.getItem("gino-quiz-school");
    if (savedSchool) setSchool(savedSchool);
    try {
      const saved = window.localStorage.getItem(ROSTER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CampingPlayer[];
        if (
          Array.isArray(parsed) &&
          parsed.length >= MIN_PLAYERS &&
          parsed.length <= MAX_PLAYERS &&
          parsed.every(
            (p) =>
              LEVELS.includes(p.level) && typeof p.name === "string",
          )
        ) {
          setRoster(parsed);
        }
      }
    } catch {
      // ignore malformed roster
    }
    if (typeof window !== "undefined" && !window.speechSynthesis) {
      setSpeechOk(false);
    }
  }, []);

  function startSingleGame() {
    setGames(buildCampingGame(Date.now(), [{ name: "나", level }]));
    setResults([emptyResult()]);
    setPlayerIdx(0);
    setRoundIdx(0);
    setSaveState("idle");
    setRank(null);
    setError(null);
    playerStartRef.current = Date.now();
    setPhase("play");
  }

  function startPartyGame() {
    const players = roster.map((p, i) => ({
      level: p.level,
      name: p.name.trim() || `참가자${i + 1}`,
    }));
    window.localStorage.setItem(ROSTER_KEY, JSON.stringify(players));
    setGames(buildCampingGame(Date.now(), players));
    setResults(players.map(() => emptyResult()));
    setPlayerIdx(0);
    setRoundIdx(0);
    setSaveState("idle");
    setPhase("handoff");
  }

  const beginPlayerTurn = useCallback(() => {
    setRoundIdx(0);
    setPicked(null);
    setTimedOut(false);
    setGained(null);
    playerStartRef.current = Date.now();
    setPhase("play");
  }, []);

  // Entering a round: memory rounds flash first, everything else (and the
  // timer) starts immediately. Word rounds speak as the question appears.
  useEffect(() => {
    if (phase !== "play" || !round) return;
    if (round.flash) {
      setStage("flash");
      setRemaining(round.flash.ms);
      const t = setTimeout(() => setStage("question"), round.flash.ms);
      return () => clearTimeout(t);
    }
    setStage("question");
    if (round.speech) setSpeechOk(speak(round.speech));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, playerIdx, roundIdx]);

  // Countdown while a question is live (after the flash, when not locked).
  useEffect(() => {
    if (phase !== "play" || stage !== "question" || locked || !round) return;
    startRef.current = Date.now();
    setRemaining(ROUND_TIMEOUT_MS);
    const tick = setInterval(() => {
      const left = ROUND_TIMEOUT_MS - (Date.now() - startRef.current);
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
  }, [phase, stage, locked, playerIdx, roundIdx]);

  // Advance after the feedback flash.
  useEffect(() => {
    if (phase !== "play" || !locked) return;
    const t = setTimeout(() => {
      if (roundIdx + 1 < TOTAL_ROUNDS) {
        setRoundIdx(roundIdx + 1);
        setPicked(null);
        setTimedOut(false);
        setGained(null);
        return;
      }
      // this player is done — record their time, then results or next kid
      const seconds = (Date.now() - playerStartRef.current) / 1000;
      setResults((prev) =>
        prev.map((r, i) => (i === playerIdx ? { ...r, totalSeconds: seconds } : r)),
      );
      if (mode === "single") {
        setPhase("results");
        return;
      }
      if (playerIdx + 1 < games.length) {
        setPlayerIdx(playerIdx + 1);
        setPhase("handoff");
      } else {
        setPhase("podium");
      }
    }, FEEDBACK_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, locked, roundIdx]);

  function pick(option: string) {
    if (locked || !round) return;
    const correct = option === round.answer;
    const pts = correct
      ? pointsForElapsed(Date.now() - startRef.current, CAMPING_SCORE_CONFIG)
      : 0;
    setPicked(option);
    setGained(pts);
    if (pts > 0) {
      setResults((prev) =>
        prev.map((r, i) =>
          i === playerIdx
            ? {
                ...r,
                score: r.score + pts,
                byCategory: {
                  ...r.byCategory,
                  [round.category]: r.byCategory[round.category] + pts,
                },
              }
            : r,
        ),
      );
    }
  }

  const soloTotal = results[0]?.score ?? 0;
  const soloSeconds = results[0]?.totalSeconds ?? 0;
  const soloLevel = games[0]?.player.level ?? level;

  async function saveSoloScore() {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      setSaving(true);
      setError(null);
      const { id, entries } = await submitScore({
        name: trimmed,
        ...(school.trim() ? { school: school.trim() } : {}),
        score: soloTotal,
        totalSeconds: soloSeconds,
        date: new Date().toISOString(),
        difficulty: campingDifficulty(soloLevel),
        topic: "camping",
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

  async function saveAll(ranked: RankedCampingPlayer[]) {
    try {
      setSaveState("saving");
      for (const row of ranked) {
        await submitScore({
          name: row.player.name,
          score: row.score,
          totalSeconds: row.totalSeconds,
          date: new Date().toISOString(),
          difficulty: campingDifficulty(row.player.level),
          topic: "camping",
        });
      }
      setSaveState("saved");
    } catch {
      setSaveState("offline");
    }
  }

  function rematch() {
    if (mode === "single") {
      startSingleGame();
      return;
    }
    const players = games.map((g) => g.player);
    setGames(buildCampingGame(Date.now(), players));
    setResults(players.map(() => emptyResult()));
    setPlayerIdx(0);
    setRoundIdx(0);
    setSaveState("idle");
    setPhase("handoff");
  }

  const currentName = game?.player.name ?? "";
  const ranked =
    phase === "podium" && games.length === results.length
      ? rankCampingPlayers(
          games.map((g) => g.player),
          results,
        )
      : [];

  const gaugeColor =
    remaining > ROUND_TIMEOUT_MS * 0.6
      ? "#6BCB77"
      : remaining > ROUND_TIMEOUT_MS * 0.3
        ? "#FFD93D"
        : "#FF6B6B";

  const maxGauge = stage === "flash" ? (round?.flash?.ms ?? 1) : ROUND_TIMEOUT_MS;

  const soloMedal =
    soloTotal === 100
      ? { emoji: "🏆", msg: "완벽해요! 전 종목 마스터!" }
      : soloTotal >= 80
        ? { emoji: "🥇", msg: "대단해요! 머리가 총명하네요!" }
        : soloTotal >= 50
          ? { emoji: "🥈", msg: "잘했어요! 아쉬운 종목만 다시!" }
          : { emoji: "🥉", msg: "괜찮아요! 할수록 늘어요!" };

  return (
    <div className="min-h-screen bg-[#1F1410] text-[#FEFEFE]">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/gino"
            className="rounded-full bg-[#F4A261]/15 px-4 py-2 text-sm font-bold text-[#F4A261] transition hover:scale-105"
          >
            ← Gino
          </Link>
          {phase === "play" && (
            <span className="font-mono text-sm text-white/50">
              {mode === "party" ? `${currentName} · ` : ""}
              {roundIdx + 1} / {TOTAL_ROUNDS} · {fmtPts(results[playerIdx]?.score ?? 0)}점
            </span>
          )}
        </div>

        <header className="mb-8 text-center">
          <h1
            className="text-4xl font-black leading-none md:text-6xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#F4A261",
              textShadow: "0 0 20px rgba(244,162,97,0.5), 3px 3px 0px #FFD93D",
            }}
          >
            MIXED
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            종합 챌린지 🏕️
          </p>
          <p className="mt-2 text-sm text-white/50">
            기억력 · 사고력 · 산수 · 단어 — 8라운드 복합 대결
          </p>
        </header>

        {/* ---------- setup ---------- */}
        {phase === "setup" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="mb-3 text-sm font-bold text-white/70">모드</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("single")}
                  className={`flex-1 rounded-full py-2 text-sm font-bold transition cursor-pointer ${
                    mode === "single"
                      ? "bg-[#F4A261] text-black"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  👤 혼자 도전
                </button>
                <button
                  type="button"
                  onClick={() => setMode("party")}
                  className={`flex-1 rounded-full py-2 text-sm font-bold transition cursor-pointer ${
                    mode === "party"
                      ? "bg-[#F4A261] text-black"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  👥 친구랑 대결
                </button>
              </div>
            </div>

            {mode === "single" ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="mb-3 text-sm font-bold text-white/70">난이도</p>
                <div className="flex gap-2">
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      className={`flex-1 rounded-full py-2 text-sm font-bold transition cursor-pointer ${
                        level === l
                          ? "bg-[#F4A261] text-black"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      {LEVEL_LABELS[l]}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-white/50">
                  선택한 난이도 · {campingDifficulty(level)}{" "}
                  {difficultyLabel(campingDifficulty(level))} · 리더보드에 내
                  기록이 남아요
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="mb-3 text-sm font-bold text-white/70">
                  참가자 ({roster.length}명)
                </p>
                <div className="space-y-3">
                  {roster.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={p.name}
                        onChange={(e) =>
                          setRoster((prev) =>
                            prev.map((row, j) =>
                              j === i
                                ? { ...row, name: e.target.value.slice(0, 12) }
                                : row,
                            ),
                          )
                        }
                        placeholder={`참가자${i + 1} 이름`}
                        className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#F4A261]"
                        aria-label={`참가자 ${i + 1} 이름`}
                      />
                      {LEVELS.map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() =>
                            setRoster((prev) =>
                              prev.map((row, j) =>
                                j === i ? { ...row, level: l } : row,
                              ),
                            )
                          }
                          className={`rounded-full px-2.5 py-2 text-xs font-bold transition cursor-pointer ${
                            p.level === l
                              ? "bg-[#F4A261] text-black"
                              : "bg-white/10 text-white/60 hover:bg-white/20"
                          }`}
                        >
                          {l === "easy" ? "🌱" : l === "normal" ? "🔥" : "⚡"}
                        </button>
                      ))}
                      {roster.length > MIN_PLAYERS && (
                        <button
                          type="button"
                          onClick={() =>
                            setRoster((prev) => prev.filter((_, j) => j !== i))
                          }
                          className="rounded-full bg-white/10 px-2.5 py-2 text-xs text-white/50 transition hover:bg-[#FF6B6B]/30 cursor-pointer"
                          aria-label={`${i + 1}번 참가자 삭제`}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {roster.length < MAX_PLAYERS && (
                  <button
                    type="button"
                    onClick={() =>
                      setRoster((prev) => [...prev, { name: "", level: "normal" }])
                    }
                    className="mt-3 w-full rounded-xl border border-dashed border-white/20 py-2 text-sm font-bold text-white/50 transition hover:border-[#F4A261] hover:text-[#F4A261] cursor-pointer"
                  >
                    + 참가자 추가
                  </button>
                )}
                <p className="mt-2 text-xs text-white/40">
                  참가자마다 난이도(🌱🔥⚡)를 따로 고를 수 있어요 — 다 풀면
                  모닥불 시상대에서 순위 발표!
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
              <p>🧠 기억력 💡 사고력 🔢 산수 ✏️ 단어 — 순서는 매번 랜덤!</p>
              <p className="mt-1">⏱ 라운드마다 10초 · 만점 100점 · 8라운드</p>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={mode === "single" ? startSingleGame : startPartyGame}
                className="rounded-full bg-gradient-to-r from-[#F4A261] to-[#FFD93D] px-10 py-4 text-xl font-black text-black transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                {mode === "single" ? "종합 챌린지 시작! 🚀" : "캠핑 대결 시작! 🔥"}
              </button>
            </div>
          </div>
        )}

        {/* ---------- handoff (party only) ---------- */}
        {phase === "handoff" && game && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-5xl">🏕️</p>
            <p className="mt-4 text-sm font-bold tracking-widest text-white/50">
              다음 주자
            </p>
            <p
              className="mt-2 text-4xl font-black"
              style={{ fontFamily: "'Fredoka', cursive", color: "#F4A261" }}
            >
              {game.player.name}
            </p>
            <p className="mt-2 inline-block rounded-full bg-white/10 px-4 py-1 text-sm font-bold text-white/70">
              {LEVEL_LABELS[game.player.level]} · 난이도{" "}
              {campingDifficulty(game.player.level)}{" "}
              {difficultyLabel(campingDifficulty(game.player.level))}
            </p>
            <p className="mt-5 text-lg text-[#FFD93D]">
              나머지는 화면 안 봐요! ✋
            </p>
            <button
              type="button"
              onClick={beginPlayerTurn}
              className="mt-6 rounded-full bg-gradient-to-r from-[#F4A261] to-[#FFD93D] px-10 py-4 text-lg font-black text-black transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              준비됐어요, 시작! 🚀
            </button>
          </div>
        )}

        {/* ---------- play ---------- */}
        {phase === "play" && round && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-2 flex items-center justify-between text-xs font-bold">
              <span className="text-[#F4A261]">
                {CATEGORY_EMOJI[round.category]} {roundIdx + 1} / {TOTAL_ROUNDS}
              </span>
              {stage === "question" && (
                <span style={{ color: gaugeColor }}>
                  ⏱ {(remaining / 1000).toFixed(1)}초
                </span>
              )}
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
                className="h-full rounded-full transition-[width] duration-100"
                style={{
                  width: `${Math.max(0, (remaining / maxGauge) * 100)}%`,
                  background: stage === "flash" ? "#F4A261" : gaugeColor,
                }}
              />
            </div>

            {/* flash phase */}
            {stage === "flash" && round.flash && (
              <div className="mt-8 text-center">
                <p
                  className="text-xl font-black"
                  style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
                >
                  잘 기억하세요! 👀
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {round.flash.items.map((item, i) => (
                    <span
                      key={i}
                      className="text-5xl md:text-6xl"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* question */}
            {stage === "question" && (
              <>
                {round.flash && (
                  <p
                    className="mt-8 text-center text-2xl font-black text-white"
                    style={{ fontFamily: "'Fredoka', cursive" }}
                  >
                    {round.prompt}
                  </p>
                )}
                {!round.flash && round.display && (
                  <p
                    className="mt-8 whitespace-pre text-center text-4xl font-black md:text-5xl"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {round.display}
                  </p>
                )}
                {!round.flash && !round.display && (
                  <>
                    <p
                      className="mt-8 text-center text-xl font-black"
                      style={{ fontFamily: "'Fredoka', cursive" }}
                    >
                      {round.prompt}
                    </p>
                    <div className="mt-4 flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() =>
                          round.speech && setSpeechOk(speak(round.speech))
                        }
                        className="flex h-20 w-20 items-center justify-center rounded-full border-4 text-3xl transition hover:scale-105 active:scale-95 cursor-pointer"
                        style={{
                          borderColor: "#F4A261",
                          background: "#F4A26120",
                        }}
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
                          className="mt-1 text-lg font-black"
                          style={{ fontFamily: "var(--font-space-grotesk)" }}
                        >
                          {round.speech}
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {round.options.map((opt) => {
                    const isPicked = picked === opt;
                    const revealCorrect = locked && opt === round.answer;
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
                        className={`min-h-[56px] rounded-2xl border-2 px-4 py-3 text-2xl font-bold transition cursor-pointer ${
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

                {locked && !timedOut && picked !== round.answer && (
                  <p className="mt-4 text-center text-lg text-[#FFD93D]">
                    정답은 “{round.answer}”!
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* ---------- results (single) ---------- */}
        {phase === "results" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-6xl">{soloMedal.emoji}</p>
            <p
              className="mt-4 text-5xl font-black"
              style={{
                fontFamily: "var(--font-space-grotesk)",
                color: "#FFD93D",
              }}
            >
              {fmtPts(soloTotal)} / 100점
            </p>
            <p className="mt-1 font-mono text-sm text-white/50">
              ⏱ 총 {formatTime(soloSeconds)} · {LEVEL_LABELS[soloLevel]} · 난이도{" "}
              {campingDifficulty(soloLevel)}
            </p>
            <p
              className="mt-2 text-xl"
              style={{ fontFamily: "'Fredoka', cursive", color: "#6BCB77" }}
            >
              {soloMedal.msg}
            </p>
            <p className="mt-1 font-mono text-xs text-white/40">
              {(Object.keys(CATEGORY_EMOJI) as CampingCategory[])
                .map((c) => `${CATEGORY_EMOJI[c]} ${fmtPts(results[0]?.byCategory[c] ?? 0)}`)
                .join(" · ")}
            </p>

            <div className="mx-auto mt-6 max-w-xs rounded-2xl border border-[#F4A261]/30 bg-[#F4A261]/10 p-4">
              <p className="text-sm font-bold text-white/80">
                🏆 리더보드에 남길까요?
              </p>
              <div className="mt-3 space-y-2">
                <input
                  value={school}
                  onChange={(e) => setSchool(e.target.value.slice(0, 16))}
                  placeholder="초등학교 (예: 위니초)"
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#F4A261]"
                  aria-label="초등학교 이름"
                />
                <div className="flex gap-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 12))}
                    placeholder="이름"
                    className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#F4A261]"
                    aria-label="리더보드 이름"
                  />
                  <button
                    type="button"
                    onClick={saveSoloScore}
                    disabled={!name.trim() || saving}
                    className="rounded-xl bg-[#F4A261] px-4 py-2 text-sm font-black text-black transition hover:opacity-90 disabled:opacity-30 cursor-pointer"
                  >
                    {saving ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
              {error && <p className="mt-2 text-xs text-[#FF6B9D]">{error}</p>}
              <button
                type="button"
                onClick={rematch}
                className="mt-3 text-xs text-white/50 underline transition hover:text-white/80 cursor-pointer"
              >
                저장 안 하고 다시 도전
              </button>
            </div>
          </div>
        )}

        {/* ---------- saved (single) ---------- */}
        {phase === "saved" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-4xl">🏅</p>
            <p className="mt-2 text-lg font-bold text-[#FFD93D]">
              {rank
                ? `리더보드 ${rank}위에 등록했어요!`
                : "리더보드에 등록했어요!"}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={rematch}
                className="rounded-full bg-gradient-to-r from-[#F4A261] to-[#FFD93D] px-6 py-2 font-black text-black transition hover:scale-105 cursor-pointer"
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

        {/* ---------- podium (party) ---------- */}
        {phase === "podium" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-6xl">🏕️🔥</p>
            <p
              className="mt-3 text-3xl font-black"
              style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
            >
              모닥불 시상대!
            </p>

            <div className="mt-6 space-y-3">
              {ranked.map((row) => (
                <div
                  key={row.player.name + String(row.rank)}
                  className={`rounded-2xl border p-4 text-left ${
                    row.rank === 1
                      ? "border-[#FFD93D]/50 bg-[#FFD93D]/10"
                      : "border-white/10 bg-black/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-black text-white">
                      {MEDALS[row.rank - 1] ?? "🎖️"} {row.player.name}
                      <span className="ml-2 text-xs font-bold text-white/40">
                        {LEVEL_LABELS[row.player.level]}
                      </span>
                    </p>
                    <p
                      className="text-2xl font-black"
                      style={{
                        fontFamily: "var(--font-space-grotesk)",
                        color: row.rank === 1 ? "#FFD93D" : "#FEFEFE",
                      }}
                    >
                      {fmtPts(row.score)}점
                    </p>
                  </div>
                  <p className="mt-1 font-mono text-xs text-white/50">
                    ⏱ {formatTime(row.totalSeconds)}
                    {(() => {
                      const cat = row.byCategory;
                      if (!cat) return null;
                      return ` · ${(Object.keys(CATEGORY_EMOJI) as CampingCategory[])
                        .map((c) => `${CATEGORY_EMOJI[c]} ${fmtPts(cat[c])}`)
                        .join(" · ")}`;
                    })()}
                  </p>
                </div>
              ))}
            </div>

            {saveState === "idle" && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => saveAll(ranked)}
                  className="rounded-full bg-[#F4A261] px-6 py-3 font-black text-black transition hover:scale-105 cursor-pointer"
                >
                  🏆 리더보드에 남기기
                </button>
              </div>
            )}
            {saveState === "saving" && (
              <p className="mt-6 text-sm text-white/50">저장 중…</p>
            )}
            {saveState === "saved" && (
              <p className="mt-6 text-sm font-bold text-[#6BCB77]">
                🏅 리더보드에 모두 등록했어요!
              </p>
            )}
            {saveState === "offline" && (
              <p className="mt-6 text-sm text-[#FF6B9D]">
                오프라인이라 저장이 안 됐어요 — 순위는 화면에 있으니 괜찮아요!
              </p>
            )}

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={rematch}
                className="rounded-full bg-gradient-to-r from-[#F4A261] to-[#FFD93D] px-6 py-2 font-black text-black transition hover:scale-105 cursor-pointer"
              >
                🔁 다시 대결!
              </button>
              <button
                type="button"
                onClick={() => setPhase("setup")}
                className="rounded-full bg-white/10 px-6 py-2 font-bold text-white/70 transition hover:bg-white/20 cursor-pointer"
              >
                ✋ 끝내기
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
