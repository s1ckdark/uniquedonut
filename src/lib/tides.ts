// Moon-and-tides learning simulation: pure physics + state labeling.
// No DOM, no React.

/** Moon distance is expressed as a multiple of D_REF. */
export const D_REF = 1;
export const D_MIN = 0.6;
export const D_MAX = 1.4;

/** Tidal amplitude follows the inverse-cube law: A = (D_REF/d)^3. */
export function tideAmplitude(moonDist: number): number {
  return Math.pow(D_REF / moonDist, 3);
}

/** Tidal height at angle difference phi (radians) from the moon.
 *  P2 tidal term: +A toward (and opposite) the moon, -A/2 at quadrature. */
export function tideHeight(phi: number, moonDist: number): number {
  const c = Math.cos(phi);
  return tideAmplitude(moonDist) * ((3 * c * c - 1) / 2);
}

/** The sun's tidal amplitude relative to the moon at D_REF (~46%). */
export const A_SUN = 0.46;

/** Solar tide at angle difference phi (radians) from the sun. */
export function sunTideHeight(phi: number): number {
  const c = Math.cos(phi);
  return A_SUN * ((3 * c * c - 1) / 2);
}

/** Total tide at a point: lunar + solar contributions. */
export function combinedTideHeight(
  pointAngleRad: number,
  moonAngleRad: number,
  sunAngleRad: number,
  moonDist: number,
): number {
  return (
    tideHeight(pointAngleRad - moonAngleRad, moonDist) +
    sunTideHeight(pointAngleRad - sunAngleRad)
  );
}

export interface SpringNeap {
  key: "spring" | "neap" | "mid";
  label: string;
  emoji: string;
  description: string;
}

/** Classify sun-moon alignment: aligned → spring tide, quadrature → neap. */
export function springNeap(
  moonAngleDeg: number,
  sunAngleDeg: number,
): SpringNeap {
  let delta = Math.abs(moonAngleDeg - sunAngleDeg) % 360;
  if (delta > 180) delta = 360 - delta;
  if (delta <= 30 || delta >= 150) {
    return {
      key: "spring",
      label: "사리",
      emoji: "🌊",
      description: "달과 태양이 줄을 서서 물때가 가장 커요!",
    };
  }
  if (delta >= 60 && delta <= 120) {
    return {
      key: "neap",
      label: "조금",
      emoji: "🫧",
      description: "달과 태양이 직각이라 물때가 잔잔해요.",
    };
  }
  return {
    key: "mid",
    label: "보통",
    emoji: "🌤️",
    description: "사리와 조금 사이의 평범한 물때예요.",
  };
}

export interface TideState {
  label: string;
  emoji: string;
  description: string;
}

/** Label the harbor state from normalized level u = h / A (range [-0.5, 1])
 *  and its movement vs the previous sample. */
export function tideState(u: number, prevU: number | null): TideState {
  if (u >= 0.6) {
    return {
      label: "만조",
      emoji: "🌊",
      description: "바닷물이 가장 높이 차올랐어요!",
    };
  }
  if (u <= -0.35) {
    return {
      label: "간조",
      emoji: "🏖️",
      description: "바닷물이 가장 많이 빠졌어요! 갯벌이 보여요.",
    };
  }
  const rising = prevU === null ? true : u > prevU;
  return rising
    ? { label: "밀물", emoji: "📈", description: "바닷물이 밀려오고 있어요. 슝~ 슝~" }
    : { label: "썰물", emoji: "📉", description: "바닷물이 빠져나가고 있어요. 슝~ 슝~" };
}

/** Radius of the ocean ring at a screen angle, with visual exaggeration.
 *  Angles in radians, clockwise from the top of the view. */
export function oceanRingRadius(
  baseRadius: number,
  pointAngleRad: number,
  moonAngleRad: number,
  moonDist: number,
  exaggeration: number,
): number {
  const phi = pointAngleRad - moonAngleRad;
  return baseRadius + tideHeight(phi, moonDist) * exaggeration;
}

/** Screen position for an angle (clockwise from top) at distance r. */
export function polar(
  cx: number,
  cy: number,
  r: number,
  angleRad: number,
): { x: number; y: number } {
  return { x: cx + r * Math.sin(angleRad), y: cy - r * Math.cos(angleRad) };
}
