"use client";

import { contourBands, tempToSeaColor, type FishEntry } from "@/lib/sea";

// Jeju-centered isotherm map. The island is drawn from real coastline
// points, and contour bands are that outline scaled up around its center —
// expanded more vertically (×1.7) so the flat island gets rounder,
// evenly-spaced rings. Contour lines are solid and connected; each band is
// wide enough for its temperature color to read clearly.

const CX = 210;
const CY = 228;
const BASE = 0.62; // island display scale (leaves room for wide bands)
const Y_STRETCH = 1.7; // vertical expansion for rounder contours

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

function bandScaleX(i: number, n: number): number {
  return BASE * (1.06 + (i * (2.45 - 1.06)) / (n - 1));
}

function transformFor(sx: number): string {
  const sy = sx * Y_STRETCH;
  return `translate(${CX} ${CY}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-CX} ${-CY})`;
}

const FISH_SPOTS = [
  { x: 332, y: 132 },
  { x: 88, y: 306 },
  { x: 346, y: 292 },
  { x: 66, y: 146 },
];

const WARM_CURRENT = "#FF8C42";
const COLD_CURRENT = "#7cc7ff";

export default function JejuSeaMap({
  yearAvg,
  fish,
}: {
  yearAvg: number;
  fish: FishEntry[];
}) {
  const bands = contourBands(yearAvg); // coast(0, warmest) → outer(last)
  const n = bands.length;

  // Paint outermost (coolest) first; inner bands cover the middle, leaving
  // a wide visible annulus per temperature.
  const fillOrder = bands.map((temp, i) => ({ temp, i })).reverse();

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
          transform={transformFor(bandScaleX(i, n))}
          fill={tempToSeaColor(temp)}
          style={{ transition: "fill 0.8s" }}
        />
      ))}

      {/* solid connected contour lines on each band edge */}
      {bands.map((_, i) => (
        <path
          key={`c${i}`}
          d={ISLAND_PATH}
          transform={transformFor(bandScaleX(i, n))}
          fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth={1.5 / (bandScaleX(i, n) * 1.3)}
        />
      ))}

      {/* every band labeled along the left vertex */}
      {bands.map((temp, i) => {
        const sx = bandScaleX(i, n);
        return (
          <text
            key={`t${i}`}
            x={CX - 92 * sx - 8}
            y={CY + 4}
            textAnchor="end"
            fontSize={10}
            fontWeight="bold"
            fill="#FEFEFE"
            style={{ transition: "fill 0.8s" }}
          >
            {temp.toFixed(1)}°
          </text>
        );
      })}

      {/* ocean currents — animated flowing dashes with arrowheads */}
      <defs>
        <marker
          id="cur-warm"
          markerWidth="7"
          markerHeight="7"
          refX="5"
          refY="3.5"
          orient="auto"
        >
          <path d="M0,0 L7,3.5 L0,7 Z" fill={WARM_CURRENT} />
        </marker>
        <marker
          id="cur-cold"
          markerWidth="7"
          markerHeight="7"
          refX="5"
          refY="3.5"
          orient="auto"
        >
          <path d="M0,0 L7,3.5 L0,7 Z" fill={COLD_CURRENT} />
        </marker>
      </defs>
      <g fill="none" strokeLinecap="round">
        {/* 대마난류: south → northeast past Jeju's east side */}
        <path
          className="animate-flow"
          d="M 138 408 C 205 385 262 345 286 282 C 306 228 300 152 288 80"
          stroke={WARM_CURRENT}
          strokeWidth={7}
          strokeDasharray="14 10"
          markerEnd="url(#cur-warm)"
          opacity={0.92}
        />
        {/* 황해난류: splits northwest into the Yellow Sea */}
        <path
          className="animate-flow"
          d="M 152 374 C 112 352 78 318 64 266 C 57 236 59 208 68 180"
          stroke={WARM_CURRENT}
          strokeWidth={6}
          strokeDasharray="14 10"
          markerEnd="url(#cur-warm)"
          opacity={0.92}
        />
        {/* 중국연안류: cold water along the southwest */}
        <path
          className="animate-flow"
          d="M 20 282 C 82 306 132 338 186 394"
          stroke={COLD_CURRENT}
          strokeWidth={6}
          strokeDasharray="14 10"
          markerEnd="url(#cur-cold)"
          opacity={0.92}
        />
      </g>
      <text x={296} y={168} fontSize={12} fontWeight="bold" fill={WARM_CURRENT}>
        대마난류
      </text>
      <text x={28} y={228} fontSize={11} fontWeight="bold" fill={WARM_CURRENT}>
        황해난류
      </text>
      <text x={62} y={352} fontSize={11} fontWeight="bold" fill={COLD_CURRENT}>
        중국연안류
      </text>

      {/* fish of the year */}
      {fish.map((f, i) => {
        const spot = FISH_SPOTS[i % FISH_SPOTS.length];
        const badge = f.trend === "in" ? "↗" : f.trend === "out" ? "↘" : "•";
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

      {/* Jeju island on top — uniform scale, no vertical stretch */}
      <g transform={`translate(${CX} ${CY}) scale(${BASE}) translate(${-CX} ${-CY})`}>
        <path d={ISLAND_PATH} fill="#4C9F70" stroke="#2f7a4a" strokeWidth={4.5} />
        {/* Hallasan */}
        <path d="M 197 218 L 207 236 L 187 236 Z" fill="#2f7a4a" />
        <text x={200} y={233} fontSize={9} fill="#FEFEFE">
          한라산
        </text>
        {/* 성산일출봉 (east tip) */}
        <circle cx={292} cy={203} r={5} fill="#2f7a4a" />
        <text x={270} y={195} fontSize={9} fill="#FEFEFE">
          성산
        </text>
        {/* 차귀진 (west tip) */}
        <circle cx={124} cy={239} r={4} fill="#2f7a4a" />
        <text x={112} y={254} fontSize={9} fill="#FEFEFE">
          차귀진
        </text>
      </g>
    </svg>
  );
}
