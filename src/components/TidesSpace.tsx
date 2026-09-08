"use client";

import { combinedTideHeight, polar } from "@/lib/tides";

const CX = 200;
const CY = 200;
const EARTH_R = 70;
const OCEAN_BASE = 84;
const EXAGGERATION = 12;
const ORBIT_VISUAL = 120; // px at D_REF (max 1.4×120+16 fits the viewBox)
const SUN_VISUAL = 178;

export default function TidesSpace({
  moonAngleDeg,
  sunAngleDeg,
  moonDistMult,
}: {
  moonAngleDeg: number;
  sunAngleDeg: number;
  moonDistMult: number;
}) {
  const moonAngle = (moonAngleDeg * Math.PI) / 180;
  const sunAngle = (sunAngleDeg * Math.PI) / 180;

  // Ocean ring path (drawn behind Earth): 72 samples around. The solar
  // contribution is included so the ring shows combined spring/neap bulges.
  const points: string[] = [];
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const h = combinedTideHeight(a, moonAngle, sunAngle, moonDistMult);
    const p = polar(CX, CY, OCEAN_BASE + h * EXAGGERATION, a);
    points.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }

  const moon = polar(CX, CY, moonDistMult * ORBIT_VISUAL, moonAngle);
  const sun = polar(CX, CY, SUN_VISUAL, sunAngle);

  return (
    <svg viewBox="0 0 400 400" className="w-full" role="img" aria-label="지구와 달과 태양">
      {/* sun */}
      <g transform={`translate(${sun.x.toFixed(1)} ${sun.y.toFixed(1)})`}>
        <g stroke="#FFD93D" strokeWidth={3} strokeLinecap="round">
          <line x1={-26} y1={0} x2={-18} y2={0} />
          <line x1={26} y1={0} x2={18} y2={0} />
          <line x1={0} y1={-26} x2={0} y2={-18} />
          <line x1={0} y1={26} x2={0} y2={18} />
          <line x1={-19} y1={-19} x2={-13} y2={-13} />
          <line x1={19} y1={-19} x2={13} y2={-13} />
          <line x1={-19} y1={19} x2={-13} y2={13} />
          <line x1={19} y1={19} x2={13} y2={13} />
        </g>
        <circle r={15} fill="#FFD93D" />
        <circle r={15} fill="none" stroke="#FF8C42" strokeWidth={2} />
      </g>

      {/* moon orbit guide */}
      <circle
        cx={CX}
        cy={CY}
        r={ORBIT_VISUAL}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeDasharray="4 6"
      />
      {/* ocean (behind Earth) */}
      <polygon points={points.join(" ")} fill="#2E86DE" opacity={0.55} />
      {/* Earth with land */}
      <circle cx={CX} cy={CY} r={EARTH_R} fill="#4C9F70" />
      <clipPath id="earth-clip">
        <circle cx={CX} cy={CY} r={EARTH_R} />
      </clipPath>
      <g clipPath="url(#earth-clip)">
        <ellipse
          cx={CX - 25}
          cy={CY - 20}
          rx={30}
          ry={18}
          fill="#3E8E41"
          transform={`rotate(-20 ${CX - 25} ${CY - 20})`}
        />
        <ellipse
          cx={CX + 25}
          cy={CY + 25}
          rx={26}
          ry={16}
          fill="#3E8E41"
          transform={`rotate(15 ${CX + 25} ${CY + 25})`}
        />
        <ellipse cx={CX + 10} cy={CY - 45} rx={20} ry={12} fill="#3E8E41" />
      </g>
      {/* night hemisphere: dark half facing away from the sun */}
      <g clipPath="url(#earth-clip)">
        <g transform={`rotate(${sunAngleDeg + 180} ${CX} ${CY})`}>
          <path
            d={`M ${CX} ${CY - EARTH_R} A ${EARTH_R} ${EARTH_R} 0 0 0 ${CX} ${CY + EARTH_R} Z`}
            fill="rgba(8, 8, 30, 0.62)"
          />
        </g>
      </g>
      {/* harbor marker at the top */}
      <line
        x1={CX}
        y1={CY - EARTH_R + 4}
        x2={CX}
        y2={CY - OCEAN_BASE - 26}
        stroke="#FFD93D"
        strokeWidth={2}
      />
      <text x={CX} y={CY - OCEAN_BASE - 14} textAnchor="middle" fontSize={22}>
        🍩
      </text>
      <text x={CX + 34} y={CY - OCEAN_BASE - 14} fontSize={10} fill="#FFD93D">
        도넛항
      </text>
      {/* moon */}
      <g transform={`translate(${moon.x.toFixed(1)} ${moon.y.toFixed(1)})`}>
        <circle r={16} fill="#D9D9E3" />
        <circle cx={-5} cy={-4} r={3} fill="#B9B9C6" />
        <circle cx={6} cy={2} r={2.2} fill="#B9B9C6" />
        <circle cx={-2} cy={7} r={1.8} fill="#B9B9C6" />
      </g>
    </svg>
  );
}
