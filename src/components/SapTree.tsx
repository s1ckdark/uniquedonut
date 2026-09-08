"use client";

import type { SapGuestId } from "@/lib/sap";

// Summer-night sap scene: an oak trunk with amber sap running down and four
// guests gathering at it. Each guest is a clickable mini-drawing; the
// selected one gets a glow ring.

interface SapTreeProps {
  selected: SapGuestId;
  onSelect: (id: SapGuestId) => void;
}

// Guest spots (scene coordinates): along the sap flow on the trunk.
const SPOTS: Record<SapGuestId, { x: number; y: number }> = {
  stag: { x: 96, y: 128 },
  rhino: { x: 152, y: 168 },
  butterfly: { x: 210, y: 88 },
  hornet: { x: 60, y: 196 },
};

function MiniStag() {
  return (
    <g>
      <ellipse cx={0} cy={6} rx={22} ry={11} fill="#A0522D" />
      <ellipse cx={-18} cy={2} rx={8} ry={7} fill="#7B3B1E" />
      <path d="M -24 -2 q -14 -10 -12 -22 q 2 -6 6 -3 q -1 10 8 18 Z" fill="#7B3B1E" />
      <path d="M -24 4 q -16 2 -20 -10 q 1 -5 5 -3 q 3 8 15 11 Z" fill="#A0522D" />
    </g>
  );
}

function MiniRhino() {
  return (
    <g>
      <ellipse cx={0} cy={6} rx={18} ry={14} fill="#1C1C28" stroke="#3A3A4C" strokeWidth={1.5} />
      <ellipse cx={-5} cy={1} rx={6} ry={3.5} fill="#8a8aa0" opacity={0.5} />
      <ellipse cx={-13} cy={4} rx={6} ry={5} fill="#1C1C28" />
      <path d="M -14 -1 q -7 -13 -1 -20 q 6 -3 7 3 q -3 6 1 16 Z" fill="#1C1C28" stroke="#3A3A4C" strokeWidth={1.2} />
    </g>
  );
}

function MiniButterfly() {
  return (
    <g>
      <path d="M 0 0 q -18 -14 -26 -2 q -6 10 6 14 q -12 2 -4 12 q 8 6 20 -6 Z" fill="#FF6B9D" />
      <path d="M 0 0 q 18 -14 26 -2 q 6 10 -6 14 q 12 2 4 12 q -8 6 -20 -6 Z" fill="#FFD93D" />
      <ellipse cx={0} cy={4} rx={3} ry={12} fill="#1A0A2E" />
    </g>
  );
}

function MiniHornet() {
  return (
    <g>
      <ellipse cx={0} cy={0} rx={16} ry={8} fill="#FFD93D" />
      <line x1={-8} y1={-7.5} x2={-8} y2={7.5} stroke="#1A0A2E" strokeWidth={4} />
      <line x1={0} y1={-8} x2={0} y2={8} stroke="#1A0A2E" strokeWidth={4} />
      <line x1={8} y1={-7.5} x2={8} y2={7.5} stroke="#1A0A2E" strokeWidth={4} />
      <circle cx={-17} cy={-1} r={5} fill="#1A0A2E" />
      <ellipse cx={2} cy={-10} rx={9} ry={5} fill="#FEFEFE" opacity={0.5} transform="rotate(-20 2 -10)" />
      <line x1={10} y1={2} x2={20} y2={5} stroke="#1A0A2E" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

const GUESTS: { id: SapGuestId; label: string; art: React.ReactNode }[] = [
  { id: "stag", label: "사슴벌레", art: <MiniStag /> },
  { id: "rhino", label: "장수풍뎅이", art: <MiniRhino /> },
  { id: "butterfly", label: "나비", art: <MiniButterfly /> },
  { id: "hornet", label: "말벌", art: <MiniHornet /> },
];

export default function SapTree({ selected, onSelect }: SapTreeProps) {
  return (
    <svg
      viewBox="0 0 280 260"
      className="h-auto w-full"
      role="img"
      aria-label="수액 나무에 모인 곤충들"
    >
      {/* night sky */}
      <rect width={280} height={260} rx={14} fill="#0d1030" />
      <circle cx={246} cy={30} r={12} fill="#FEFEFE" opacity={0.85} />
      <circle cx={238} cy={27} r={10} fill="#0d1030" />
      <text x={30} y={30} fontSize={7} fill="#FEFEFE">✦</text>
      <text x={200} y={60} fontSize={6} fill="#FEFEFE">✦</text>

      {/* trunk */}
      <path
        d="M 110 0 q 10 130 6 260 L 168 260 q -6 -130 4 -260 Z"
        fill="#6B4226"
      />
      <path
        d="M 132 0 q 2 130 0 260 L 152 260 q -2 -130 2 -260 Z"
        fill="#59371F"
      />

      {/* sap flow — amber gradient running down the bark */}
      <defs>
        <linearGradient id="sap-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFC94D" />
          <stop offset="1" stopColor="#D98E1F" />
        </linearGradient>
      </defs>
      <path
        d="M 128 52 q -4 60 -2 120 q 2 40 -2 74 L 142 246 q -4 -34 -2 -74 q 2 -60 -2 -120 Z"
        fill="url(#sap-grad)"
        opacity={0.95}
      />
      <circle cx={133} cy={58} r={5} fill="#FFC94D" />

      {/* guests */}
      {GUESTS.map(({ id, label, art }) => {
        const { x, y } = SPOTS[id];
        const isSel = selected === id;
        return (
          <g
            key={id}
            transform={`translate(${x} ${y})`}
            onClick={() => onSelect(id)}
            className="cursor-pointer"
            role="button"
            aria-label={label}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelect(id);
            }}
          >
            {isSel && (
              <circle
                r={30}
                fill="none"
                stroke="#FFD93D"
                strokeWidth={2.5}
                strokeDasharray="5 4"
                opacity={0.9}
              />
            )}
            {art}
          </g>
        );
      })}
    </svg>
  );
}
