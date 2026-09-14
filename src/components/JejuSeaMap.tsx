"use client";

import { contourBands, tempToSeaColor, type FishEntry } from "@/lib/sea";

// Jeju-centered isotherm map: concentric contour bands radiate from the
// island (coast warmest → open water coolest). Band colors transition over
// 0.8s so stepping years visibly warms the sea.

const CX = 210;
const CY = 210;
const BAND_ELLIPSES: { rx: number; ry: number }[] = [
  { rx: 60, ry: 44 },
  { rx: 88, ry: 64 },
  { rx: 118, ry: 86 },
  { rx: 150, ry: 110 },
  { rx: 185, ry: 138 },
];
const FISH_SPOTS = [
  { x: 300, y: 130 },
  { x: 118, y: 300 },
  { x: 322, y: 282 },
  { x: 84, y: 118 },
];

export default function JejuSeaMap({
  yearAvg,
  fish,
}: {
  yearAvg: number;
  fish: FishEntry[];
}) {
  const bands = contourBands(yearAvg); // coast(0) → outer(4)

  return (
    <svg
      viewBox="0 0 420 420"
      className="h-auto w-full"
      role="img"
      aria-label="제주 주변 바다 수온 등고선 지도"
    >
      {/* sea: outermost (coolest) fills everything, then warmer bands inward */}
      <rect width={420} height={420} rx={14} fill={tempToSeaColor(bands[4])} />
      {[3, 2, 1, 0].map((i) => (
        <ellipse
          key={i}
          cx={CX}
          cy={CY}
          rx={BAND_ELLIPSES[i].rx}
          ry={BAND_ELLIPSES[i].ry}
          fill={tempToSeaColor(bands[i])}
          style={{ transition: "fill 0.8s" }}
        />
      ))}

      {/* contour lines at each band edge */}
      {BAND_ELLIPSES.map((e, i) => (
        <ellipse
          key={`c${i}`}
          cx={CX}
          cy={CY}
          rx={e.rx}
          ry={e.ry}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1.4}
          strokeDasharray="5 5"
        />
      ))}

      {/* band temperature labels along the right vertex of each ellipse */}
      {BAND_ELLIPSES.map((e, i) => (
        <text
          key={`t${i}`}
          x={CX + e.rx * 0.72}
          y={CY - e.ry * 0.72}
          fontSize={11}
          fontWeight="bold"
          fill="#FEFEFE"
          style={{ transition: "fill 0.8s" }}
        >
          {bands[i].toFixed(1)}°
        </text>
      ))}

      {/* fish of the year */}
      {fish.map((f, i) => {
        const spot = FISH_SPOTS[i % FISH_SPOTS.length];
        const badge =
          f.trend === "in" ? "↗" : f.trend === "out" ? "↘" : "•";
        const badgeColor =
          f.trend === "in" ? "#FFD93D" : f.trend === "out" ? "#FF6B9D" : "#FEFEFE";
        return (
          <g key={f.name} transform={`translate(${spot.x} ${spot.y})`}>
            <circle r={19} fill="rgba(20,15,40,0.72)" />
            <text y={6} textAnchor="middle" fontSize={18}>
              {f.emoji}
            </text>
            <text x={14} y={-10} fontSize={11} fontWeight="bold" fill={badgeColor}>
              {badge}
            </text>
            <text y={32} textAnchor="middle" fontSize={10.5} fill="#FEFEFE">
              {f.name}
            </text>
          </g>
        );
      })}

      {/* Jeju island */}
      <path
        d="M 160 196
           C 158 176 174 162 200 158
           C 232 153 262 166 264 192
           C 266 216 246 240 208 244
           C 176 247 162 220 160 196 Z"
        fill="#4C9F70"
        stroke="#2f7a4a"
        strokeWidth={2.5}
      />
      {/* Hallasan */}
      <path d="M 200 176 L 212 200 L 188 200 Z" fill="#2f7a4a" />
      <text x={212} y={198} fontSize={10} fill="#FEFEFE">한라산</text>
      {/* beach ring highlight */}
      <path
        d="M 160 196
           C 158 176 174 162 200 158
           C 232 153 262 166 264 192
           C 266 216 246 240 208 244
           C 176 247 162 220 160 196 Z"
        fill="none"
        stroke="#FFD93D"
        strokeWidth={1.6}
        opacity={0.6}
      />
    </svg>
  );
}
