"use client";

import type { BeetlePart } from "@/lib/sap";

// Parametric male beetle, side view: stag (antler jaws, flat elongated
// matte body) vs rhino (head horn, round glossy body). Highlight glows the
// part group the selected difference chip points at.

export type BeetleSpecies = "stag" | "rhino";

const STAG_BROWN = "#A0522D";
const STAG_DARK = "#7B3B1E";
const RHINO_BLACK = "#1C1C28";
const RHINO_EDGE = "#3A3A4C";

export default function BeetleArt({
  species,
  highlight = null,
}: {
  species: BeetleSpecies;
  highlight?: BeetlePart | null;
}) {
  const isStag = species === "stag";

  // Body: stag = flat & elongated elytra; rhino = round & chubby.
  const body = isStag
    ? { cx: 132, cy: 128, rx: 62, ry: 34 }
    : { cx: 128, cy: 122, rx: 52, ry: 44 };
  const bodyFill = isStag ? STAG_BROWN : RHINO_BLACK;
  const bodyStroke = isStag ? STAG_DARK : RHINO_EDGE;

  // Weapon: stag = branching jaws at the face; rhino = one head horn.
  const weapon = isStag ? (
    <g>
      <path
        d="M 74 96 q -26 -22 -22 -48 q 4 -12 12 -6 q -2 22 14 40 Z"
        fill={STAG_DARK}
      />
      <path
        d="M 74 108 q -32 -4 -40 -28 q 2 -10 10 -6 q 6 18 32 24 Z"
        fill={STAG_BROWN}
      />
      <line x1={58} y1={92} x2={66} y2={86} stroke={STAG_DARK} strokeWidth={4} strokeLinecap="round" />
      <line x1={44} y1={76} x2={54} y2={76} stroke={STAG_DARK} strokeWidth={4} strokeLinecap="round" />
    </g>
  ) : (
    <g>
      <path
        d="M 92 74 q -18 -34 -2 -52 q 14 -8 18 6 q -8 16 2 44 Z"
        fill={RHINO_BLACK}
        stroke={RHINO_EDGE}
        strokeWidth={2}
      />
      <path d="M 90 24 l -10 -8 M 92 22 l 10 -8" stroke={RHINO_EDGE} strokeWidth={3} strokeLinecap="round" />
    </g>
  );

  const glow = (part: BeetlePart) =>
    highlight === part
      ? {
          stroke: "#FFD93D",
          strokeWidth: 3.5,
          filter: "drop-shadow(0 0 6px #FFD93D)",
        }
      : {};

  // "fight" highlights the weapon too — that's where the action is.
  const weaponGlow = glow("weapon");
  const fightGlow = glow("fight");
  const weaponProps =
    highlight === "fight" ? { ...fightGlow } : weaponGlow;

  return (
    <svg
      viewBox="0 0 260 200"
      className="h-auto w-full"
      role="img"
      aria-label={isStag ? "사슴벌레 수컷" : "장수풍뎅이 수컷"}
    >
      {/* legs */}
      <g stroke={isStag ? STAG_DARK : RHINO_EDGE} strokeWidth={5} fill="none" strokeLinecap="round">
        <path d="M 104 150 q -8 18 -22 26" />
        <path d="M 132 156 q 0 18 -10 28" />
        <path d="M 160 150 q 10 18 24 24" />
      </g>

      {/* head */}
      <ellipse
        cx={86}
        cy={isStag ? 104 : 100}
        rx={22}
        ry={19}
        fill={isStag ? STAG_DARK : RHINO_BLACK}
        stroke={isStag ? STAG_DARK : RHINO_EDGE}
        strokeWidth={2}
      />
      {/* club-tipped antennae (shared feature) */}
      <path
        d="M 80 88 q -4 -18 -16 -26"
        fill="none"
        stroke={isStag ? STAG_DARK : RHINO_EDGE}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <ellipse cx={62} cy={60} rx={7} ry={4} fill={isStag ? STAG_DARK : RHINO_EDGE} />

      {/* weapon */}
      <g {...weaponProps}>{weapon}</g>

      {/* body (elytra) — color chip highlights the shine itself */}
      <g {...glow("body")}>
        <ellipse
          cx={body.cx}
          cy={body.cy}
          rx={body.rx}
          ry={body.ry}
          fill={bodyFill}
          stroke={bodyStroke}
          strokeWidth={2.5}
        />
      </g>
      {/* midline where the wing covers meet */}
      <line
        x1={body.cx - body.rx + 8}
        y1={body.cy}
        x2={body.cx + body.rx - 8}
        y2={body.cy}
        stroke={bodyStroke}
        strokeWidth={1.6}
        opacity={0.7}
      />
      {/* gloss for the rhino (color difference is part of the lesson) */}
      <g {...glow("color")}>
        {isStag ? (
          <ellipse
            cx={body.cx}
            cy={body.cy}
            rx={body.rx}
            ry={body.ry}
            fill="none"
            stroke={STAG_DARK}
            strokeWidth={1.2}
            opacity={0.35}
            strokeDasharray="3 5"
          />
        ) : (
          <ellipse
            cx={body.cx - 14}
            cy={body.cy - 16}
            rx={20}
            ry={12}
            fill="#8a8aa0"
            opacity={0.5}
            transform={`rotate(-25 ${body.cx - 14} ${body.cy - 16})`}
          />
        )}
      </g>
    </svg>
  );
}
