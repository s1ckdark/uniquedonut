"use client";

import { ghAt, sleepDurationHours, formatBedtime } from "@/lib/growth";

// 24-hour growth-hormone timeline (18:00 → next 18:00) that redraws as the
// bedtime slider moves. The sleep window is shaded; the big wave over the
// first three hours of sleep is the lesson.

const W = 320;
const H = 170;
const PAD = { top: 22, right: 12, bottom: 26, left: 12 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const DAY_START = 18; // timeline starts at 18:00

function xOf(hour: number): number {
  const h = ((hour - DAY_START) % 24 + 24) % 24;
  return PAD.left + (h / 24) * PLOT_W;
}

function yOf(level: number): number {
  return PAD.top + PLOT_H - level * PLOT_H * 0.92;
}

export default function GrowthDay({ bedHour }: { bedHour: number }) {
  const duration = sleepDurationHours(bedHour);

  // Sample the curve every 15 minutes.
  const samples: string[] = [];
  for (let t = DAY_START; t <= DAY_START + 24.001; t += 0.25) {
    const x = xOf(t);
    const y = yOf(ghAt(t % 24, bedHour));
    samples.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const areaPath = `M ${PAD.left},${PAD.top + PLOT_H} L ${samples
    .map((s) => s.replace(",", " "))
    .join(" L ")} L ${PAD.left + PLOT_W},${PAD.top + PLOT_H} Z`;

  // Sleep shading: bed → wake (may wrap past midnight).
  const bedX = xOf(bedHour);
  const wakeX = xOf(7);

  // Deep-sleep wave zone: first 3h after onset.
  const waveStart = xOf(bedHour + 0.5);
  const waveEnd = xOf(bedHour + 3);

  const hourMarks = [18, 21, 0, 3, 6, 9, 12, 15, 18];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="하루 성장호르몬 그래프"
    >
      {/* sleep shading (wraps through the right edge) */}
      <rect x={bedX} y={PAD.top - 8} width={PAD.left + PLOT_W - bedX} height={PLOT_H + 8} fill="#3b4a8f" opacity={0.45} />
      <rect x={PAD.left} y={PAD.top - 8} width={wakeX - PAD.left} height={PLOT_H + 8} fill="#3b4a8f" opacity={0.45} />

      {/* deep-sleep wave zone */}
      <rect x={waveStart} y={PAD.top - 14} width={waveEnd - waveStart} height={PLOT_H + 14} fill="#f4a261" opacity={0.14} />
      <line x1={waveStart} y1={PAD.top - 14} x2={waveStart} y2={PAD.top + PLOT_H} stroke="#f4a261" strokeWidth={1.5} strokeDasharray="4 4" />
      <line x1={waveEnd} y1={PAD.top - 14} x2={waveEnd} y2={PAD.top + PLOT_H} stroke="#f4a261" strokeWidth={1.5} strokeDasharray="4 4" />
      <text x={(waveStart + waveEnd) / 2} y={PAD.top - 4} textAnchor="middle" fontSize={9} fill="#f4a261" fontWeight="bold">
        깊은 잠 파도!
      </text>

      {/* curve */}
      <path d={areaPath} fill="#f4a261" opacity={0.35} />
      <polyline points={samples.join(" ")} fill="none" stroke="#f4a261" strokeWidth={2.5} strokeLinejoin="round" />

      {/* axis */}
      <line x1={PAD.left} y1={PAD.top + PLOT_H} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H} stroke="#FEFEFE" strokeWidth={1} opacity={0.4} />
      {hourMarks.map((h, i) => (
        <text key={`${h}-${i}`} x={xOf(h)} y={H - 10} textAnchor="middle" fontSize={9} fill="#FEFEFE" opacity={0.6}>
          {h === 0 ? "12" : h > 12 ? `${h - 12}` : `${h}`}
        </text>
      ))}
      <text x={PAD.left} y={H - 1} fontSize={8} fill="#FEFEFE" opacity={0.4}>
        (오후 6시부터 다음 날까지)
      </text>

      {/* markers */}
      <text x={bedX} y={PAD.top + PLOT_H + 12} textAnchor="middle" fontSize={13}>🛏️</text>
      <text x={wakeX} y={PAD.top + PLOT_H + 12} textAnchor="middle" fontSize={13}>⏰</text>
      <text x={xOf(12)} y={PAD.top - 4} textAnchor="middle" fontSize={12}>☀️</text>
      <text x={xOf(0)} y={PAD.top - 4} textAnchor="middle" fontSize={12}>🌙</text>
    </svg>
  );
}
