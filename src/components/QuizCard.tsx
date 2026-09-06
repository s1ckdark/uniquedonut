"use client";

import type { QuizQuestion } from "@/lib/math-quiz";
import { DonutPlate } from "./DonutArt";

interface QuizCardProps {
  question: QuizQuestion;
  picked: number | null;
  wasCorrect: boolean;
  showExplanation: boolean;
  onPick: (index: number) => void;
}

function DonutPlates({ plates, perPlate }: { plates: number; perPlate: number }) {
  return (
    <div className="my-4 flex flex-col items-start gap-2">
      {Array.from({ length: plates }).map((_, i) => (
        <DonutPlate key={i} count={perPlate} label={`접시 ${i + 1}`} />
      ))}
    </div>
  );
}

export default function QuizCard({
  question,
  picked,
  wasCorrect,
  showExplanation,
  onPick,
}: QuizCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <p
        className="text-center text-2xl font-bold"
        style={{ fontFamily: "'Fredoka', cursive", color: "#FEFEFE" }}
      >
        {question.prompt}
      </p>

      {question.kind === "picture" &&
        question.explanation.plates &&
        question.explanation.perPlate && (
          <DonutPlates
            plates={question.explanation.plates}
            perPlate={question.explanation.perPlate}
          />
        )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((opt, i) => {
          const isPicked = picked === i;
          const state = showExplanation && opt.correct
            ? "correct"
            : isPicked && !wasCorrect
              ? "wrong"
              : "idle";
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onPick(i)}
              disabled={showExplanation}
              className={`min-h-[56px] rounded-2xl border-2 px-6 py-3 text-2xl font-bold transition cursor-pointer ${
                state === "correct"
                  ? "border-[#6BCB77] bg-[#6BCB77]/20 text-[#6BCB77]"
                  : state === "wrong"
                    ? "animate-shake border-[#FF6B9D]/40 bg-[#FF6B9D]/10 text-white/40"
                    : "border-white/15 bg-black/30 text-white hover:border-[#FFD93D] hover:scale-[1.02]"
              }`}
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {picked !== null && !wasCorrect && !showExplanation && (
        <p className="mt-4 text-center text-lg text-[#FF6B9D]">
          앗! 다시 골라볼까요? 🤔
        </p>
      )}

      {showExplanation && (
        <div className="mt-6 rounded-2xl border border-[#6BCB77]/30 bg-[#6BCB77]/10 p-4">
          <p className="text-center text-xl font-bold text-[#6BCB77]">
            딩동댕! 🎉
          </p>
          {question.explanation.plates && question.explanation.perPlate && (
            <DonutPlates
              plates={question.explanation.plates}
              perPlate={question.explanation.perPlate}
            />
          )}
          {question.explanation.equation && (
            <p
              className="text-center text-2xl font-black text-[#FFD93D]"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {question.explanation.equation}
            </p>
          )}
          <p className="mt-2 text-center text-base leading-relaxed text-white/80">
            {question.explanation.text}
          </p>
        </div>
      )}
    </div>
  );
}
