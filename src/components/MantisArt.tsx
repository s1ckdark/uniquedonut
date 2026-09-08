"use client";

import {
  FEMALE_SEGMENTS,
  MALE_SEGMENTS,
  type MantisPart,
} from "@/lib/mantis";

export type MantisSex = "female" | "male" | "nymph";

// Cartoon side-view mantis, head up. Sex drives abdomen size, antennae
// style, wing length, and the number of drawn abdominal segment lines.

const GREEN = "#6BCB77";
const GREEN_DARK = "#4a9960";

export default function MantisArt({
  sex,
  highlight = null,
}: {
  sex: MantisSex;
  highlight?: MantisPart | null;
}) {
  const isFemale = sex === "female";
  const isNymph = sex === "nymph";
  const segmentCount = isNymph ? 5 : isFemale ? FEMALE_SEGMENTS : MALE_SEGMENTS;

  // Abdomen geometry per sex.
  const abRx = isNymph ? 20 : isFemale ? 34 : 24;
  const abRy = isNymph ? 40 : isFemale ? 56 : 50;
  const abCx = 100;
  const abCy = 168;

  // Antennae: long + feathery comb for males, short + thin otherwise.
  const antennae = (
    <g>
      {[-1, 1].map((side) => (
        <g key={side}>
          <path
            d={`M ${100 + side * 10} 44 q ${side * 14} -22 ${side * 26} -30`}
            fill="none"
            stroke={GREEN_DARK}
            strokeWidth={sex === "male" ? 3 : 2}
            strokeLinecap="round"
          />
          {sex === "male" &&
            [0.25, 0.45, 0.65, 0.85].map((t, i) => (
              <line
                key={i}
                x1={100 + side * (10 + 14 * t * 0.9)}
                y1={44 - 22 * t + 2}
                x2={100 + side * (10 + 14 * t)}
                y2={44 - 22 * t - 10}
                stroke={GREEN_DARK}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
            ))}
        </g>
      ))}
    </g>
  );

  // Wings: adults only. Male wings extend past the abdomen tip.
  const wings = !isNymph ? (
    <g>
      <path
        d={`M ${abCx - 12} 130 q -18 ${abRy * 0.9} 2 ${abRy + (isFemale ? -4 : 14)} l 10 -4 q -14 -${abRy * 0.7} -4 -${abRy * 0.86} Z`}
        fill="#8FD98F"
        opacity={0.95}
      />
      <path
        d={`M ${abCx + 6} 132 q 12 ${abRy * 0.85} -2 ${abRy + (isFemale ? -6 : 18)} l -9 -3 q 11 -${abRy * 0.65} 3 -${abRy * 0.82} Z`}
        fill="#B8E6B8"
      />
    </g>
  ) : null;

  // Abdominal segment lines (structural count).
  const segments = (
    <g>
      {Array.from({ length: segmentCount }).map((_, i) => {
        const y = abCy - abRy + 16 + (i * (abRy * 2 - 30)) / segmentCount;
        return (
          <line
            key={i}
            x1={abCx - abRx * 0.85}
            y1={y}
            x2={abCx + abRx * 0.85}
            y2={y}
            stroke={GREEN_DARK}
            strokeWidth={1.6}
            opacity={0.7}
          />
        );
      })}
    </g>
  );

  const glow = (part: MantisPart) =>
    highlight === part
      ? { stroke: "#FFD93D", strokeWidth: 3.5, filter: "drop-shadow(0 0 6px #FFD93D)" }
      : {};

  return (
    <svg
      viewBox="0 0 200 260"
      className="h-auto w-full"
      role="img"
      aria-label={`${sex === "female" ? "암컷" : sex === "male" ? "수컷" : "약충"} 사마귀`}
    >
      {/* middle & hind legs */}
      <g stroke={GREEN_DARK} strokeWidth={3} fill="none" strokeLinecap="round">
        <path d="M 92 110 q -26 14 -34 44" />
        <path d="M 108 112 q 26 16 34 46" />
        <path d="M 94 128 q -20 22 -22 56" />
        <path d="M 106 130 q 20 24 22 58" />
      </g>

      {/* raptorial front legs (praying arms) */}
      <g stroke={GREEN_DARK} strokeWidth={4} fill="none" strokeLinecap="round">
        <path d="M 88 84 q -18 -8 -22 6 q 10 10 24 4" />
        <path d="M 112 84 q 18 -8 22 6 q -10 10 -24 4" />
      </g>

      {/* antennae */}
      <g {...glow("antennae")}>{antennae}</g>

      {/* head */}
      <polygon points="100,26 84,58 116,58" fill={GREEN} />
      <circle cx={92} cy={46} r={6} fill="#1A0A2E" />
      <circle cx={108} cy={46} r={6} fill="#1A0A2E" />
      <circle cx={94} cy={44} r={2} fill="#FEFEFE" />
      <circle cx={110} cy={44} r={2} fill="#FEFEFE" />

      {/* thorax */}
      <ellipse cx={100} cy={96} rx={13} ry={38} fill={GREEN} />

      {/* wings */}
      <g {...glow("wings")}>{wings}</g>

      {/* abdomen */}
      <g {...glow("body")}>
        <ellipse cx={abCx} cy={abCy} rx={abRx} ry={abRy} fill={GREEN} />
      </g>
      <g {...glow("segments")}>{segments}</g>
    </svg>
  );
}
