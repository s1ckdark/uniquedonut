"use client";

import type { CrabStageId } from "@/lib/crab";

// Cartoon crab illustrations, one per life stage — the body plan changes
// completely between stages (unlike the mantis, which just scales up).

const ORANGE = "#FF8C42";
const ORANGE_DARK = "#D96B23";
const SHELL = "#E8823C";

const LABELS: Record<CrabStageId, string> = {
  egg: "알 무리",
  zoea: "조에아 유생",
  megalopa: "메가로파",
  juvenile: "새끼게",
  adult: "어미게",
};

function EggArt() {
  // A mass of orange eggs, plus a hint of mom's abdomen edge at the top.
  const eggs = [
    [130, 96], [106, 88], [152, 88], [88, 108], [130, 74],
    [170, 106], [112, 118], [148, 116], [94, 132], [130, 132],
    [166, 130], [112, 146], [146, 146], [130, 158],
  ];
  return (
    <g>
      <path
        d="M 60 40 q 70 -26 140 0 q -20 18 -70 18 q -50 0 -70 -18 Z"
        fill={ORANGE_DARK}
        opacity={0.85}
      />
      {eggs.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={11}
          fill={ORANGE}
          stroke={ORANGE_DARK}
          strokeWidth={1.5}
        />
      ))}
    </g>
  );
}

function ZoeaArt() {
  // Spined planktonic larva: carapace with dorsal + lateral spines,
  // stalked eyes, forked tail.
  return (
    <g>
      <line x1={130} y1={116} x2={130} y2={44} stroke={SHELL} strokeWidth={5} strokeLinecap="round" />
      <line x1={126} y1={116} x2={76} y2={86} stroke={SHELL} strokeWidth={4} strokeLinecap="round" />
      <line x1={134} y1={116} x2={184} y2={86} stroke={SHELL} strokeWidth={4} strokeLinecap="round" />
      <ellipse cx={130} cy={118} rx={34} ry={26} fill={SHELL} />
      <path d="M 116 140 l 14 26 l 14 -26" fill="none" stroke={ORANGE_DARK} strokeWidth={4} strokeLinecap="round" />
      <circle cx={104} cy={104} r={8} fill="#1A0A2E" />
      <circle cx={156} cy={104} r={8} fill="#1A0A2E" />
      <line x1={104} y1={110} x2={100} y2={118} stroke="#1A0A2E" strokeWidth={3} strokeLinecap="round" />
      <line x1={156} y1={110} x2={160} y2={118} stroke="#1A0A2E" strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

function MegalopaArt() {
  // Crab-ish carapace with claws + a long shrimp-like abdomen trailing.
  return (
    <g>
      <ellipse cx={150} cy={100} rx={42} ry={32} fill={SHELL} />
      {/* shrimp tail trailing right */}
      {[0, 1, 2, 3].map((i) => (
        <ellipse
          key={i}
          cx={196 + i * 18}
          cy={104 + i * 4}
          rx={12}
          ry={9 - i}
          fill={ORANGE_DARK}
          opacity={0.9 - i * 0.12}
        />
      ))}
      <path d="M 258 118 q 10 -12 4 -20 q -6 10 -10 16 Z" fill={ORANGE_DARK} />
      {/* eye stalks */}
      <line x1={138} y1={72} x2={132} y2={54} stroke={SHELL} strokeWidth={4} strokeLinecap="round" />
      <line x1={162} y1={72} x2={168} y2={54} stroke={SHELL} strokeWidth={4} strokeLinecap="round" />
      <circle cx={132} cy={50} r={6} fill="#1A0A2E" />
      <circle cx={168} cy={50} r={6} fill="#1A0A2E" />
      {/* tiny claws */}
      <path d="M 112 108 q -22 -4 -24 -20" fill="none" stroke={ORANGE_DARK} strokeWidth={5} strokeLinecap="round" />
      <path d="M 188 108 q 22 -4 24 -20" fill="none" stroke={ORANGE_DARK} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
}

function CrabBody({ paddles }: { paddles: boolean }) {
  // Proper crab: wide carapace with the swimming crab's three bumps,
  // eye stalks, two claws, and walking legs (paddles for the adult).
  const legs = (side: -1 | 1) => (
    <g stroke={ORANGE_DARK} strokeWidth={6} fill="none" strokeLinecap="round">
      <path d={`M ${130 + side * 58} 108 q ${side * 22} -4 ${side * 34} 22`} />
      <path d={`M ${130 + side * 62} 118 q ${side * 26} 6 ${side * 32} 32`} />
      <path
        d={
          paddles
            ? `M ${130 + side * 62} 126 q ${side * 30} 16 ${side * 40} 20`
            : `M ${130 + side * 62} 126 q ${side * 28} 20 ${side * 36} 44`
        }
        stroke={paddles ? "#00ccff" : ORANGE_DARK}
        strokeWidth={paddles ? 10 : 6}
      />
    </g>
  );
  return (
    <g>
      {legs(-1)}
      {legs(1)}
      {/* claws */}
      <path d="M 76 96 q -26 -8 -32 -30 l 14 4 l 2 -14 l 14 10 q 6 16 8 26 Z" fill={ORANGE} stroke={ORANGE_DARK} strokeWidth={2} />
      <path d="M 184 96 q 26 -8 32 -30 l -14 4 l -2 -14 l -14 10 q -6 16 -8 26 Z" fill={ORANGE} stroke={ORANGE_DARK} strokeWidth={2} />
      {/* carapace with three bumps (꽃게의 꽃점) */}
      <path
        d="M 130 62 q -54 -6 -60 28 q -4 30 28 38 q 32 10 64 0 q 32 -8 28 -38 q -6 -34 -60 -28 Z"
        fill={SHELL}
      />
      <circle cx={112} cy={76} r={5} fill={ORANGE_DARK} />
      <circle cx={130} cy={72} r={5} fill={ORANGE_DARK} />
      <circle cx={148} cy={76} r={5} fill={ORANGE_DARK} />
      {/* eye stalks */}
      <line x1={114} y1={66} x2={110} y2={48} stroke={SHELL} strokeWidth={5} strokeLinecap="round" />
      <line x1={146} y1={66} x2={150} y2={48} stroke={SHELL} strokeWidth={5} strokeLinecap="round" />
      <circle cx={110} cy={44} r={7} fill="#1A0A2E" />
      <circle cx={150} cy={44} r={7} fill="#1A0A2E" />
      <circle cx={112} cy={42} r={2} fill="#FEFEFE" />
      <circle cx={152} cy={42} r={2} fill="#FEFEFE" />
      {/* smile */}
      <path d="M 120 92 q 10 8 20 0" fill="none" stroke={ORANGE_DARK} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

export default function CrabArt({ stage }: { stage: CrabStageId }) {
  return (
    <svg
      viewBox="0 0 280 200"
      className="h-auto w-full"
      role="img"
      aria-label={LABELS[stage]}
    >
      {stage === "egg" && <EggArt />}
      {stage === "zoea" && <ZoeaArt />}
      {stage === "megalopa" && <MegalopaArt />}
      {stage === "juvenile" && <CrabBody paddles={false} />}
      {stage === "adult" && <CrabBody paddles />}
    </svg>
  );
}
