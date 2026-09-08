"use client";

// Side-view beach: sea level maps directly from the harbor's tide height h
// (combined lunar + solar, so springs swing wider than neaps). The sky shows
// day or night depending on where the sun is relative to the harbor.

export default function TidesBeach({
  h,
  sunAngleDeg,
}: {
  h: number;
  sunAngleDeg: number;
}) {
  const t = Math.max(-1, Math.min(1, h / 2.2)); // wider range: springs reach ±1.46
  const waterTop = 115 - 55 * t;
  const lowTide = t < -0.5;
  const SEA_EDGE = 150;

  // The harbor sits at screen angle 0; daytime when the sun is within 90°.
  const sunRad = (sunAngleDeg * Math.PI) / 180;
  const isDay = Math.cos(sunRad) > 0;
  // Celestial icon crosses the sky: x from sin, mirrored for the moon.
  const sunX = 150 - 120 * Math.sin(sunRad);
  const moonX = 150 - 120 * Math.sin(sunRad + Math.PI);

  return (
    <svg viewBox="0 0 300 220" className="w-full" role="img" aria-label="도넛항 해변">
      {/* sky */}
      <rect x={0} y={0} width={300} height={120} fill={isDay ? "#5AA7DE" : "#0A1030"} />
      {isDay ? (
        <text x={sunX} y={44} fontSize={28} textAnchor="middle">
          ☀️
        </text>
      ) : (
        <>
          <text x={moonX} y={44} fontSize={24} textAnchor="middle">
            🌙
          </text>
          <text x={40} y={24} fontSize={8} fill="#FEFEFE">
            ✦
          </text>
          <text x={230} y={34} fontSize={8} fill="#FEFEFE">
            ✦
          </text>
          <text x={260} y={18} fontSize={6} fill="#FEFEFE">
            ✦
          </text>
        </>
      )}
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
