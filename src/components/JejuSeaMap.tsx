"use client";

import { contourBands, tempToSeaColor, type FishEntry } from "@/lib/sea";

// Jeju-centered isotherm map. The island is drawn from real coastline
// points (차귀진 → 성산일출봉 → 서귀포), and the contour bands are that
// same outline scaled up around its center — so the isotherms hug the
// island's actual shape. Band colors transition over 0.8s when the year
// changes.

const CX = 210;
const CY = 220;

// Real coastline sample points mapped to SVG coords
// (lon 126.16–126.94 → x 120–300, lat 33.23–33.53 → y 185–255).
const ISLAND_PATH = `M 120 241
  C 122 226, 132 218, 145 213
  C 155 202, 165 195, 180 192
  C 190 189, 198 190, 205 190
  C 215 189, 224 187, 233 187
  C 241 186, 249 184, 256 185
  C 270 186, 288 190, 300 201
  C 292 216, 282 222, 270 227
  C 262 234, 254 237, 245 241
  C 235 248, 224 252, 213 253
  C 202 255, 191 255, 180 253
  C 168 254, 155 256, 145 255
  C 134 252, 122 248, 120 241 Z`;

// 11 contour rings: scale factor per band (band 0 = coast, innermost).
function scaleFor(i: number, n: number): number {
  return 1.08 + (i * (2.0 - 1.08)) / (n - 1);
}

function scaledPath(scale: number): string {
  return `translate(${CX} ${CY}) scale(${scale.toFixed(3)}) translate(${-CX} ${-CY})`;
}

const FISH_SPOTS = [
  { x: 332, y: 152 },
  { x: 92, y: 292 },
  { x: 348, y: 296 },
  { x: 70, y: 138 },
];

export default function JejuSeaMap({
  yearAvg,
  fish,
}: {
  yearAvg: number;
  fish: FishEntry[];
}) {
  const bands = contourBands(yearAvg); // coast(0, warmest) → outer(last)
  const n = bands.length;

  // Fill layers: outermost (coolest) first, coast band painted last.
  const fillOrder = bands.map((temp, i) => ({ temp, i })).reverse();

  // Label every 3rd band on the left side, staggered.
  const labelIdx = [0, 3, 6, 9].filter((i) => i < n);

  return (
    <svg
      viewBox="0 0 420 420"
      className="h-auto w-full"
      role="img"
      aria-label="제주 주변 바다 수온 등고선 지도"
    >
      {/* open water: outermost band color */}
      <rect width={420} height={420} rx={14} fill={tempToSeaColor(bands[n - 1])} />

      {/* island-hugging contour bands, outermost first */}
      {fillOrder.map(({ temp, i }) => (
        <path
          key={`f${i}`}
          d={ISLAND_PATH}
          transform={scaledPath(scaleFor(i, n))}
          fill={tempToSeaColor(temp)}
          style={{ transition: "fill 0.8s" }}
        />
      ))}

      {/* dashed contour strokes on each band edge */}
      {bands.map((_, i) => (
        <path
          key={`c${i}`}
          d={ISLAND_PATH}
          transform={scaledPath(scaleFor(i, n))}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1.2}
          strokeDasharray="4 5"
        />
      ))}

      {/* band temperature labels */}
      {labelIdx.map((i) => {
        const k = scaleFor(i, n);
        return (
          <text
            key={`t${i}`}
            x={CX - 90 * k - 8}
            y={CY + 8}
            textAnchor="end"
            fontSize={10.5}
            fontWeight="bold"
            fill="#FEFEFE"
            style={{ transition: "fill 0.8s" }}
          >
            {bands[i].toFixed(1)}°
          </text>
        );
      })}

      {/* fish of the year */}
      {fish.map((f, i) => {
        const spot = FISH_SPOTS[i % FISH_SPOTS.length];
        const badge =
          f.trend === "in" ? "↗" : f.trend === "out" ? "↘" : "•";
        const badgeColor =
          f.trend === "in"
            ? "#FFD93D"
            : f.trend === "out"
              ? "#FF6B9D"
              : "#FEFEFE";
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

      {/* Jeju island on top */}
      <path
        d={ISLAND_PATH}
        fill="#4C9F70"
        stroke="#2f7a4a"
        strokeWidth={2.5}
      />
      {/* Hallasan + 성산일출봉 */}
      <path d="M 197 218 L 207 236 L 187 236 Z" fill="#2f7a4a" />
      <text x={211} y={232} fontSize={10} fill="#FEFEFE">
        한라산
      </text>
      <circle cx={297} cy={200} r={4.5} fill="#2f7a4a" />
      <text x={290} y={192} fontSize={9} fill="#FEFEFE">
        성산
      </text>
      <text x={128} y={268} fontSize={9} fill="#FEFEFE">
        차귀진
      </text>
    </svg>
  );
}
