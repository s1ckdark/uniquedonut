"use client";

// Side-view beach: sea level maps directly from the harbor's tide height h
// (amplitude included), so a closer moon visibly swings the sea further.

export default function TidesBeach({ h }: { h: number }) {
  const t = Math.max(-1, Math.min(1, h / 1.6));
  const waterTop = 115 - 55 * t;
  const lowTide = t < -0.5;
  const SEA_EDGE = 150;

  return (
    <svg viewBox="0 0 300 220" className="w-full" role="img" aria-label="도넛항 해변">
      {/* sand slope */}
      <path d="M 60 220 L 110 150 L 300 118 L 300 220 Z" fill="#E8C97A" />
      {/* wet sand band (reach of the water) */}
      <path
        d="M 60 220 L 110 150 L 300 118 L 300 140 L 110 168 Z"
        fill="#D4B265"
        opacity={0.8}
      />
      {/* sea with wavy top */}
      <path
        d={`M 0 ${waterTop.toFixed(1)} q 18 -6 36 0 t 36 0 t 36 0 t 42 0 L ${SEA_EDGE} 220 L 0 220 Z`}
        fill="#2E86DE"
        opacity={0.9}
      />
      {/* beach friends at low tide */}
      {lowTide && (
        <>
          <text x={78} y={178} fontSize={16}>
            🐚
          </text>
          <text x={104} y={186} fontSize={16}>
            ⭐
          </text>
        </>
      )}
      {/* donut shop on the right */}
      <g>
        <rect x={205} y={78} width={62} height={42} rx={4} fill="#FF6B9D" />
        <polygon points="200,78 236,58 272,78" fill="#FFD93D" />
        <text x={236} y={106} textAnchor="middle" fontSize={18}>
          🍩
        </text>
      </g>
      {/* gauge */}
      <line
        x1={14}
        y1={60}
        x2={14}
        y2={170}
        stroke="#FEFEFE"
        strokeWidth={2}
        opacity={0.6}
      />
      <text x={22} y={63} fontSize={9} fill="#FEFEFE">
        만
      </text>
      <text x={22} y={171} fontSize={9} fill="#FEFEFE">
        간
      </text>
      <circle cx={14} cy={waterTop} r={4} fill="#FFD93D" />
    </svg>
  );
}
