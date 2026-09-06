"use client";

// Cartoon donut illustrations for the math quiz, drawn in the site palette.
// The donut hole is cut with fill-rule="evenodd" ring paths so it stays
// transparent on any background — no masks, no id collisions.

const SPRINKLES: { x: number; y: number; a: number; c: string }[] = [
  { x: 50, y: 25, a: 15, c: "#FFD93D" },
  { x: 33, y: 33, a: -35, c: "#6BCB77" },
  { x: 67, y: 34, a: 60, c: "#00ccff" },
  { x: 26, y: 50, a: 85, c: "#FEFEFE" },
  { x: 74, y: 52, a: -80, c: "#FFD93D" },
  { x: 34, y: 68, a: 25, c: "#00ccff" },
  { x: 66, y: 69, a: -50, c: "#FEFEFE" },
  { x: 50, y: 76, a: 100, c: "#6BCB77" },
];

/** Circle as a path subpath, for building evenodd rings. */
function ring(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
}

/** The donut shape in a 100×100 coordinate space, as a <g>. */
export function DonutShape() {
  return (
    <g>
      {/* Dough ring */}
      <path
        d={`${ring(50, 50, 46)} ${ring(50, 50, 13)}`}
        fill="#E8A25D"
        fillRule="evenodd"
      />
      {/* Pink glaze ring */}
      <path
        d={`${ring(50, 50, 35)} ${ring(50, 50, 13)}`}
        fill="#FF6B9D"
        fillRule="evenodd"
      />
      {/* Sprinkles on the glaze band */}
      {SPRINKLES.map((s, i) => (
        <rect
          key={i}
          x={s.x - 5}
          y={s.y - 2}
          width={10}
          height={4}
          rx={2}
          fill={s.c}
          transform={`rotate(${s.a} ${s.x} ${s.y})`}
        />
      ))}
    </g>
  );
}

/** Standalone cartoon donut. */
export function Donut({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="도넛"
    >
      <DonutShape />
    </svg>
  );
}

/**
 * One plate holding `count` donuts, with a "= count" label on the right.
 * Used both in questions (counting aid) and explanations.
 */
export function DonutPlate({ count, label }: { count: number; label: string }) {
  const donutPx = 64;
  const spacing = 72;
  const width = count * spacing + 12;
  const height = 84;

  return (
    <div className="flex items-center gap-3">
      <span className="w-12 shrink-0 text-xs text-white/40">{label}</span>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`도넛 ${count}개가 놓인 접시`}
      >
        {/* Plate: two-tone ellipse */}
        <ellipse
          cx={width / 2}
          cy={66}
          rx={width / 2 - 4}
          ry={18}
          fill="#F3EDFB"
        />
        <ellipse
          cx={width / 2}
          cy={62}
          rx={width / 2 - 10}
          ry={13}
          fill="#FEFEFE"
        />
        {/* Donuts with soft shadows */}
        {Array.from({ length: count }).map((_, i) => {
          const x = 6 + i * spacing;
          return (
            <g key={i}>
              <ellipse
                cx={x + donutPx / 2}
                cy={64}
                rx={26}
                ry={5}
                fill="rgba(0,0,0,0.18)"
              />
              <g transform={`translate(${x}, 0) scale(0.64)`}>
                <DonutShape />
              </g>
            </g>
          );
        })}
      </svg>
      <span
        className="shrink-0 text-xl font-black text-[#FFD93D]"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        = {count}
      </span>
    </div>
  );
}
