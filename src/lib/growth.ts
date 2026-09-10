// Growth hormone & sleep math for the Sleep & Grow page. Pure module —
// no DOM, no React.

export const BEDTIME_EARLIEST = 21; // 21:00
export const BEDTIME_LATEST = 25; // 01:00 next day (as hour 25)
export const WAKE_HOUR = 7; // 07:00 fixed wake-up
const AWAKE = 0.08;

/** Total sleep hours for a bedtime (21..25 = 9pm..1am), waking at 7am. */
export function sleepDurationHours(bedHour: number): number {
  return WAKE_HOUR + 24 - bedHour;
}

/** Growth-hormone level 0..1 at t hours after falling asleep.
 *  Piecewise: awake 0.08 → rise to 1.0 by 1h → hold ~1.0 through 3h
 *  (0.85 at 3h) → decay to 0.2 by 6h → 0.15 for the rest of sleep. */
export function ghLevelFromOnset(t: number): number {
  if (t < 0) return AWAKE;
  if (t < 1) return AWAKE + 0.92 * t;
  if (t < 3) return 1 - 0.075 * (t - 1);
  if (t < 6) return 0.85 - (0.65 * (t - 3)) / 3;
  return 0.15;
}

/** GH level at a clock hour (0..24) given the bedtime (21..25). */
export function ghAt(clockHour: number, bedHour: number): number {
  const duration = sleepDurationHours(bedHour);
  const t = (clockHour - bedHour + 24) % 24;
  if (t > duration) return AWAKE; // awake already
  return ghLevelFromOnset(t);
}

export interface SleepVerdict {
  label: string;
  emoji: string;
  description: string;
}

/** Kid-friendly verdict against the 9–11h recommendation (ages 6–13). */
export function sleepVerdict(hours: number): SleepVerdict {
  if (hours < 8) {
    return {
      label: "부족",
      emoji: "🥱",
      description: "성장 마법이 아쉬워요. 조금만 일찍 자볼까요?",
    };
  }
  if (hours < 9) {
    return {
      label: "조금 부족",
      emoji: "😪",
      description: "거의 다 왔어요! 30분만 일찍 자면 딱 좋아요.",
    };
  }
  if (hours <= 11) {
    return {
      label: "딱 좋아요",
      emoji: "😄",
      description: "우리 나이(6~13세)의 목표는 9~11시간! 완벽해요!",
    };
  }
  return {
    label: "넉넉",
    emoji: "😊",
    description: "아주 넉넉해요! 잠도 충분, 키도 쑥쑥!",
  };
}

/** "밤 9:30" style label for bedtimes in the 21..25 range. */
export function formatBedtime(bedHour: number): string {
  const h = Math.floor(bedHour);
  const m = bedHour % 1 === 0.5 ? "30" : "00";
  const names: Record<number, string> = {
    21: "밤 9",
    22: "밤 10",
    23: "밤 11",
    24: "자정 12",
    25: "새벽 1",
  };
  return `${names[h] ?? `${h}`}:${m}`;
}
