"use client";

import type { ColdSceneId } from "@/lib/cold";

// Storybook illustrations built from reusable cell/virus helpers.

const VIRUS = "#9b5de5";
const VIRUS_DARK = "#7b3fc0";
const RED = "#FF6B6B";
const RED_DARK = "#d94848";
const WHITE_CELL = "#f1f1f5";
const CELL_STROKE = "#c3c3d1";
const MACRO = "#e6e6f0";

/** Spiky virus ball centered at (0,0), radius r. */
export function Virus({ r = 14 }: { r?: number }) {
  return (
    <g>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const x1 = Math.cos(a) * (r - 2);
        const y1 = Math.sin(a) * (r - 2);
        const x2 = Math.cos(a) * (r + 7);
        const y2 = Math.sin(a) * (r + 7);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={VIRUS_DARK} strokeWidth={4} strokeLinecap="round" />
        );
      })}
      <circle r={r} fill={VIRUS} />
      <circle cx={-r * 0.3} cy={-r * 0.25} r={3} fill="#1A0A2E" />
      <circle cx={r * 0.3} cy={-r * 0.25} r={3} fill="#1A0A2E" />
      <path d={`M ${-r * 0.4} ${r * 0.35} q ${r * 0.4} ${-5} ${r * 0.8} 0`} fill="none" stroke="#1A0A2E" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

/** Pale white cell with a determined face. */
export function WhiteCell({ angry = false }: { angry?: boolean }) {
  return (
    <g>
      <circle r={20} fill={WHITE_CELL} stroke={CELL_STROKE} strokeWidth={2.5} />
      <circle r={20} fill="none" stroke={CELL_STROKE} strokeWidth={2} strokeDasharray="3 6" opacity={0.6} />
      {angry ? (
        <>
          <line x1={-9} y1={-8} x2={-3} y2={-5} stroke="#1A0A2E" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={9} y1={-8} x2={3} y2={-5} stroke="#1A0A2E" strokeWidth={2.5} strokeLinecap="round" />
        </>
      ) : null}
      <circle cx={-6} cy={-4} r={2.6} fill="#1A0A2E" />
      <circle cx={6} cy={-4} r={2.6} fill="#1A0A2E" />
      <path d="M -7 7 q 7 6 14 0" fill="none" stroke="#1A0A2E" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

/** Big macrophage with an open mouth. */
export function Macrophage() {
  return (
    <g>
      <circle r={34} fill={MACRO} stroke={CELL_STROKE} strokeWidth={3} />
      <circle r={34} fill="none" stroke={CELL_STROKE} strokeWidth={2} strokeDasharray="4 7" opacity={0.6} />
      <circle cx={-10} cy={-8} r={3.4} fill="#1A0A2E" />
      <circle cx={10} cy={-8} r={3.4} fill="#1A0A2E" />
      <ellipse cx={0} cy={12} rx={14} ry={8} fill="#1A0A2E" opacity={0.85} />
      <path d="M -14 12 q 14 6 28 0" fill="none" stroke="#FEFEFE" strokeWidth={2} />
    </g>
  );
}

/** Red blood cell: red disc with an O2 backpack. */
export function RedCell({ scale = 1 }: { scale?: number }) {
  return (
    <g transform={`scale(${scale})`}>
      <rect x={-30} y={-26} width={13} height={17} rx={3} fill="#FFD93D" />
      <text x={-23.5} y={-14} textAnchor="middle" fontSize={8} fill="#1A0A2E" fontWeight="bold">O₂</text>
      <line x1={-17} y1={-18} x2={-11} y2={-12} stroke={RED_DARK} strokeWidth={2} />
      <circle r={16} fill={RED} />
      <ellipse cx={0} cy={0} rx={8} ry={6} fill={RED_DARK} opacity={0.55} />
      <circle cx={-5} cy={-6} r={2.4} fill="#1A0A2E" />
      <circle cx={5} cy={-6} r={2.4} fill="#1A0A2E" />
      <path d="M -5 5 q 5 4 10 0" fill="none" stroke="#1A0A2E" strokeWidth={2.2} strokeLinecap="round" />
    </g>
  );
}

/** Y-shaped antibody. */
export function Antibody({ rot = 0 }: { rot?: number }) {
  return (
    <g transform={`rotate(${rot})`}>
      <line x1={0} y1={6} x2={0} y2={-4} stroke="#00ccff" strokeWidth={5} strokeLinecap="round" />
      <line x1={0} y1={-4} x2={-8} y2={-13} stroke="#00ccff" strokeWidth={5} strokeLinecap="round" />
      <line x1={0} y1={-4} x2={8} y2={-13} stroke="#00ccff" strokeWidth={5} strokeLinecap="round" />
    </g>
  );
}

const BG = "#140f28";

function SceneInvade() {
  return (
    <g>
      <path d="M 0 0 L 90 0 Q 120 100 90 200 L 0 200 Z" fill="#3d2c63" />
      <path d="M 30 40 Q 110 100 30 160" fill="none" stroke="#7de0e6" strokeWidth={6} opacity={0.5} strokeLinecap="round" />
      <text x={200} y={100} fontSize={40}>👃</text>
      <g transform="translate(105 70)"><Virus /></g>
      <g transform="translate(120 120) scale(0.8)"><Virus /></g>
      <g transform="translate(95 160) scale(0.6)"><Virus /></g>
      <text x={190} y={175} fontSize={26}>💨</text>
    </g>
  );
}

function SceneAlarm() {
  return (
    <g>
      <g transform="translate(100 105)"><Macrophage /></g>
      <g transform="translate(175 75) scale(0.7)"><Virus /></g>
      <text x={160} y={40} fontSize={30} fill="#FFD93D">❗</text>
      <text x={60} y={40} fontSize={22} fill="#FFD93D">⚠️</text>
      <path d="M 30 150 q 20 10 10 28" fill="none" stroke="#FFD93D" strokeWidth={3} opacity={0.6} />
      <text x={170} y={160} fontSize={20}>📢</text>
    </g>
  );
}

function SceneBattle() {
  return (
    <g>
      <g transform="translate(70 70)"><WhiteCell angry /></g>
      <g transform="translate(85 145) scale(1.1)"><WhiteCell angry /></g>
      <g transform="translate(185 70)"><Virus /></g>
      <g transform="translate(205 140) scale(0.8)"><Virus /></g>
      <text x={150} y={105} fontSize={24} fill="#FFD93D">💥</text>
      <text x={120} y={60} fontSize={22} fill="#FFD93D">✨</text>
    </g>
  );
}

function SceneRedcell() {
  return (
    <g>
      <g transform="translate(70 60)"><RedCell /></g>
      <g transform="translate(85 140) scale(0.85)"><RedCell /></g>
      <g transform="translate(215 100)"><WhiteCell angry /></g>
      <path d="M 105 60 q 60 -20 95 0" fill="none" stroke={RED} strokeWidth={2.5} strokeDasharray="5 5" opacity={0.7} />
      <path d="M 120 140 q 55 20 80 -15" fill="none" stroke={RED} strokeWidth={2.5} strokeDasharray="5 5" opacity={0.7} />
      <text x={175} y={55} fontSize={20}>💨</text>
      <text x={240} y={60} fontSize={22}>❤️</text>
    </g>
  );
}

function SceneFever() {
  return (
    <g>
      <rect x={110} y={55} width={14} height={110} rx={7} fill="#FEFEFE" />
      <rect x={113} y={100} width={8} height={62} rx={4} fill="#FF6B6B" />
      <circle cx={117} cy={48} r={12} fill="#FF6B6B" />
      <text x={160} y={90} fontSize={30}>🥵</text>
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${55 + i * 12} 60 q 8 15 0 30 q -8 15 0 30`} fill="none" stroke="#FF8C42" strokeWidth={3} strokeLinecap="round" opacity={0.7 - i * 0.15} />
      ))}
      <g transform="translate(215 130) scale(0.65)"><Virus /></g>
      <text x={195} y={110} fontSize={18}>😵</text>
    </g>
  );
}

function SceneAntibody() {
  return (
    <g>
      <g transform="translate(90 80)"><Virus /></g>
      <g transform="translate(190 130) scale(0.85)"><Virus /></g>
      <g transform="translate(60 60)"><Antibody rot={-30} /></g>
      <g transform="translate(120 55)"><Antibody rot={20} /></g>
      <g transform="translate(90 110)"><Antibody /></g>
      <g transform="translate(165 95)"><Antibody rot={45} /></g>
      <g transform="translate(215 80)"><Antibody rot={-15} /></g>
      <g transform="translate(235 55) scale(0.9)"><WhiteCell angry /></g>
    </g>
  );
}

function SceneVictory() {
  return (
    <g>
      <g transform="translate(70 100)"><RedCell /></g>
      <g transform="translate(145 90)"><WhiteCell /></g>
      <g transform="translate(220 100) scale(0.9)"><Macrophage /></g>
      <text x={55} y={45} fontSize={26}>🎉</text>
      <text x={130} y={35} fontSize={26}>⭐</text>
      <text x={215} y={45} fontSize={26}>🏆</text>
      <text x={105} y={165} fontSize={22}>🛡️</text>
      <path d="M 95 60 q 60 -25 115 0" fill="none" stroke="#FFD93D" strokeWidth={2.5} strokeDasharray="4 6" opacity={0.7} />
    </g>
  );
}

export default function ColdArt({ scene }: { scene: ColdSceneId }) {
  return (
    <svg
      viewBox="0 0 280 200"
      className="h-auto w-full"
      role="img"
      aria-label="감기 이야기 장면"
    >
      <rect width={280} height={200} rx={14} fill={BG} />
      {scene === "invade" && <SceneInvade />}
      {scene === "alarm" && <SceneAlarm />}
      {scene === "battle" && <SceneBattle />}
      {scene === "redcell" && <SceneRedcell />}
      {scene === "fever" && <SceneFever />}
      {scene === "antibody" && <SceneAntibody />}
      {scene === "victory" && <SceneVictory />}
    </svg>
  );
}
