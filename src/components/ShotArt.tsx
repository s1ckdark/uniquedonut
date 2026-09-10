"use client";

import type { ShotSceneId } from "@/lib/shot";
import {
  Virus,
  WhiteCell,
  Antibody,
} from "./ColdArt";

// Shot & Shield storybook illustrations. Reuses the ColdArt cast and adds
// a bacteria rod, a syringe, a vaccine vial, and a shield. Virus (spiky
// purple ball) vs bacteria (green rod) look different on purpose — that
// difference is scene 3's lesson.

const BG = "#10142e";

/** Green bacteria rod with cilia — visibly NOT a virus. */
function Bacteria({ rot = 0 }: { rot?: number }) {
  return (
    <g transform={`rotate(${rot})`}>
      <rect x={-18} y={-9} width={36} height={18} rx={9} fill="#6adc7e" />
      <line x1={-14} y1={-9} x2={-14} y2={9} stroke="#3fa052" strokeWidth={2} />
      <line x1={-4} y1={-9} x2={-4} y2={9} stroke="#3fa052" strokeWidth={2} />
      <line x1={6} y1={-9} x2={6} y2={9} stroke="#3fa052" strokeWidth={2} />
      {[-10, 0, 10].map((x) => (
        <line key={x} x1={x} y1={9} x2={x - 3} y2={15} stroke="#3fa052" strokeWidth={2} strokeLinecap="round" />
      ))}
      <circle cx={8} cy={-2} r={2} fill="#1A0A2E" />
      <circle cx={14} cy={-2} r={2} fill="#1A0A2E" />
    </g>
  );
}

/** A syringe tilted at rot degrees. */
function Syringe({ rot = -30 }: { rot?: number }) {
  return (
    <g transform={`rotate(${rot})`}>
      <rect x={-30} y={-9} width={44} height={18} rx={3} fill="#dfe8ff" stroke="#9db4d8" strokeWidth={2} />
      <rect x={-28} y={-7} width={26} height={14} rx={2} fill="#4895ef" opacity={0.8} />
      <line x1={14} y1={-9} x2={14} y2={9} stroke="#9db4d8" strokeWidth={2} />
      <line x1={16} y1={0} x2={44} y2={0} stroke="#c9d4ea" strokeWidth={3} />
      <rect x={-44} y={-4} width={14} height={8} fill="#9db4d8" />
      <line x1={-37} y1={-4} x2={-37} y2={-16} stroke="#9db4d8" strokeWidth={4} strokeLinecap="round" />
    </g>
  );
}

/** Small vaccine vial with a purple cap. */
function Vial() {
  return (
    <g>
      <rect x={-10} y={-6} width={20} height={8} rx={2} fill="#9b5de5" />
      <rect x={-12} y={0} width={24} height={34} rx={5} fill="#dfe8ff" stroke="#9db4d8" strokeWidth={2} />
      <rect x={-9} y={10} width={18} height={21} rx={3} fill="#4895ef" opacity={0.75} />
      <text x={0} y={30} textAnchor="middle" fontSize={9} fill="#FEFEFE" fontWeight="bold">flu</text>
    </g>
  );
}

/** A rounded shield shape. */
function Shield() {
  return (
    <path
      d="M 0 -26 L 22 -16 L 22 4 Q 22 22 0 30 Q -22 22 -22 4 L -22 -16 Z"
      fill="#2f3f78"
      stroke="#4895ef"
      strokeWidth={3}
    />
  );
}

function SceneHospital() {
  return (
    <g>
      {/* doctor */}
      <circle cx={95} cy={85} r={26} fill="#f5d7a3" />
      <path d="M 69 72 A 26 26 0 0 1 121 72 L 69 72 Z" fill="#FEFEFE" />
      <circle cx={121} cy={62} r={7} fill="#dfe8ff" stroke="#9db4d8" strokeWidth={2} />
      <circle cx={87} cy={85} r={2.6} fill="#1A0A2E" />
      <circle cx={104} cy={85} r={2.6} fill="#1A0A2E" />
      <path d="M 88 96 q 8 6 16 0" fill="none" stroke="#1A0A2E" strokeWidth={2.4} strokeLinecap="round" />
      <rect x={75} y={112} width={40} height={52} rx={8} fill="#FEFEFE" />
      <text x={140} y={140} fontSize={34}>🩺</text>
      {/* kid */}
      <circle cx={195} cy={105} r={18} fill="#f5d7a3" />
      <circle cx={189} cy={103} r={2.2} fill="#1A0A2E" />
      <circle cx={201} cy={103} r={2.2} fill="#1A0A2E" />
      <path d="M 188 112 q 7 5 14 0" fill="none" stroke="#1A0A2E" strokeWidth={2} strokeLinecap="round" />
      <rect x={182} y={124} width={26} height={40} rx={6} fill="#FF6B9D" />
      <text x={196} y={80} fontSize={20}>🤒</text>
    </g>
  );
}

function SceneInjection() {
  return (
    <g>
      <g transform="translate(120 90) scale(1.2)">
        <Syringe />
      </g>
      <circle cx={190} cy={135} r={5} fill="#4895ef" opacity={0.7} />
      <circle cx={205} cy={120} r={4} fill="#4895ef" opacity={0.5} />
      {/* fever going down */}
      <path d="M 50 150 L 80 150 L 80 120" fill="none" stroke="#FF6B6B" strokeWidth={3} strokeLinecap="round" />
      <path d="M 80 120 Q 120 60 230 55" fill="none" stroke="#4895ef" strokeWidth={3.5} strokeDasharray="7 5" />
      <polygon points="230,55 216,49 218,63" fill="#4895ef" />
      <text x={195} y={170} fontSize={22}>😊</text>
    </g>
  );
}

function SceneAntibiotic() {
  return (
    <g>
      {/* antibiotic capsule missile heading for the bacteria */}
      <g transform="translate(90 100)">
        <Bacteria />
      </g>
      <g transform="translate(150 70) rotate(30)">
        <rect x={-14} y={-7} width={14} height={14} rx={7} fill="#FFD93D" />
        <rect x={0} y={-7} width={14} height={14} rx={7} fill="#FEFEFE" />
      </g>
      <path d="M 130 60 L 100 82" stroke="#FFD93D" strokeWidth={2.5} strokeDasharray="4 4" />
      <text x={80} y={150} fontSize={18}>❌</text>
      {/* virus unharmed, shrugging */}
      <g transform="translate(205 105)">
        <Virus />
      </g>
      <text x={185} y={60} fontSize={20}>😌</text>
      <text x={160} y={170} fontSize={14} fill="#FEFEFE">바이러스: 상관없어~</text>
    </g>
  );
}

function SceneQuestion() {
  return (
    <g>
      {/* crowd of 200+ cold viruses */}
      {[
        [50, 60], [80, 45], [110, 65], [65, 95], [95, 100], [45, 130],
        [80, 135], [120, 120], [140, 80], [70, 165], [110, 160],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${0.4 + (i % 3) * 0.08})`}>
          <Virus />
        </g>
      ))}
      <text x={52} y={35} fontSize={13} fill="#FEFEFE">감기 바이러스 200종…</text>
      {/* the one flu vial */}
      <g transform="translate(220 105)">
        <Vial />
      </g>
      <text x={192} y={165} fontSize={14} fill="#4895ef">독감 백신!</text>
      <text x={160} y={95} fontSize={26}>❓</text>
    </g>
  );
}

function SceneTraining() {
  return (
    <g>
      {/* training ring */}
      <circle cx={140} cy={100} r={62} fill="none" stroke="#FFD93D" strokeWidth={2} strokeDasharray="6 6" opacity={0.7} />
      {/* weakened virus, dizzy */}
      <g transform="translate(140 100) scale(0.9)" opacity={0.45}>
        <Virus />
      </g>
      <text x={122} y={68} fontSize={18}>💫</text>
      {/* drilling white cells around the ring */}
      <g transform="translate(85 100) scale(0.7)"><WhiteCell angry /></g>
      <g transform="translate(195 100) scale(0.7)"><WhiteCell angry /></g>
      <g transform="translate(140 165) scale(0.55)"><Antibody /></g>
      <text x={60} y={45} fontSize={16} fill="#FFD93D">연습장</text>
      <text x={205} y={50} fontSize={22}>🎯</text>
    </g>
  );
}

function SceneMemory() {
  return (
    <g>
      <g transform="translate(110 105)">
        <Shield />
        <g transform="translate(-8 -6) scale(0.8)"><Antibody /></g>
        <g transform="translate(8 6) scale(0.8)"><Antibody rot={20} /></g>
      </g>
      <text x={85} y={160} fontSize={15} fill="#4895ef">항체 저장 완료!</text>
      <g transform="translate(215 85) scale(0.8)">
        <WhiteCell />
      </g>
      <text x={195} y={140} fontSize={22}>🧠</text>
      <text x={190} y={60} fontSize={20}>✅</text>
    </g>
  );
}

function SceneVictory() {
  return (
    <g>
      {/* real virus arriving from the right */}
      <g transform="translate(225 95)">
        <Virus />
      </g>
      {/* antibody swarm + lightning */}
      <g transform="translate(170 60)"><Antibody rot={-20} /></g>
      <g transform="translate(150 110)"><Antibody rot={15} /></g>
      <g transform="translate(180 135) scale(0.85)"><Antibody /></g>
      <text x={120} y={70} fontSize={30}>⚡</text>
      <text x={95} y={160} fontSize={22}>⚡</text>
      <text x={75} y={100} fontSize={26}>🏆</text>
    </g>
  );
}

function SceneTips() {
  const cards = [
    { x: 55, emoji: "💉", label: "예방주사" },
    { x: 140, emoji: "🧼", label: "손 씻기" },
    { x: 225, emoji: "😴", label: "푹 자기" },
  ];
  return (
    <g>
      {cards.map((c) => (
        <g key={c.label}>
          <rect x={c.x - 32} y={55} width={64} height={90} rx={10} fill="#1c2450" stroke="#4895ef" strokeWidth={2} />
          <text x={c.x} y={100} fontSize={30} textAnchor="middle">{c.emoji}</text>
          <text x={c.x} y={130} fontSize={12} fill="#FEFEFE" textAnchor="middle" fontWeight="bold">{c.label}</text>
        </g>
      ))}
      <text x={140} y={175} fontSize={16} fill="#FFD93D">최고의 방패 3가지!</text>
    </g>
  );
}

export default function ShotArt({ scene }: { scene: ShotSceneId }) {
  return (
    <svg
      viewBox="0 0 280 200"
      className="h-auto w-full"
      role="img"
      aria-label="주사와 방패 이야기 장면"
    >
      <rect width={280} height={200} rx={14} fill={BG} />
      {scene === "hospital" && <SceneHospital />}
      {scene === "injection" && <SceneInjection />}
      {scene === "antibiotic" && <SceneAntibiotic />}
      {scene === "question" && <SceneQuestion />}
      {scene === "training" && <SceneTraining />}
      {scene === "memory" && <SceneMemory />}
      {scene === "victory" && <SceneVictory />}
      {scene === "tips" && <SceneTips />}
    </svg>
  );
}
