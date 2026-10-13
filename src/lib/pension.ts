// 국민연금 역대 수급 데이터 — 2026-10-13 뉴시스 보도(최보윤 의원실,
// 국민연금공단 제출 자료)를 정형화한 인포그래픽 데이터 모듈.
// Pure module — no DOM, no React.

export interface HeroStats {
  /** 평균 납부 보험료 (원) */
  paidAvg: number;
  /** 평균 수급액 (원) */
  receivedAvg: number;
  /** 수급 개월 수 */
  months: number;
  /** 1000만원 이하 납부 · 1억원 초과 수급자 수 */
  beneficiaries: number;
}

export const HERO: HeroStats = {
  paidAvg: 8_330_000,
  receivedAvg: 111_900_000,
  months: 260,
  beneficiaries: 19_972,
};

/** 수급액 ÷ 납부액 (≈13.4배) */
export function heroMultiple(): number {
  return HERO.receivedAvg / HERO.paidAvg;
}

/** "낸 것보다 많이 받은" 인원이 기사에 직접 제시된 납부액 구간들. */
export interface BracketRow {
  label: string;
  /** 해당 납부액 구간 총 인원 */
  total: number;
  /** 낸 보험료보다 많이 받은 인원 */
  excess: number;
}

export const EXCESS_BY_BRACKET: BracketRow[] = [
  { label: "1000만~2000만", total: 2_059_542, excess: 1_294_563 },
  { label: "2000만~3000만", total: 1_016_145, excess: 555_232 },
  { label: "3000만~4000만", total: 509_080, excess: 268_774 },
  { label: "4000만~5000만", total: 317_526, excess: 184_720 },
  { label: "5000만~6000만", total: 230_268, excess: 81_404 },
  { label: "6000만 초과", total: 621_832, excess: 205_256 },
];

/** 막대 스케일링용 최대 구간 인원. */
export function maxBracketPopulation(): number {
  return Math.max(...EXCESS_BY_BRACKET.map((r) => r.total));
}

/** 구간별 "낸 것보다 많이 받은" 비율 (원본 순서 유지). */
export function excessRates(): Array<BracketRow & { rate: number }> {
  return EXCESS_BY_BRACKET.map((r) => ({ ...r, rate: r.excess / r.total }));
}

/** 연금 1억원 이상 수령자를 납부 보험료 구간별로 (기사 순서 = 내림차순). */
export interface OverBracket {
  label: string;
  count: number;
}

export const OVER_100M_BY_BRACKET: OverBracket[] = [
  { label: "1000만~2000만", count: 116_226 },
  { label: "2000만 초과", count: 111_749 },
  { label: "3000만 초과", count: 98_256 },
  { label: "4000만 초과", count: 86_560 },
  { label: "5000만 초과", count: 81_404 },
  { label: "6000만 초과", count: 71_233 },
  { label: "7000만 초과", count: 62_534 },
  { label: "8000만 초과", count: 46_944 },
  { label: "9000만 초과", count: 24_545 },
  { label: "1000만 이하", count: 19_972 },
  { label: "1억 초과", count: 3_518 },
];

/** 납부 보험료 1000만원 이하(75만8893명)의 수급액 분포 (상호배타 구간). */
export interface ReceivedTier {
  label: string;
  count: number;
}

export const LOW_TIER_TOTAL = 758_893;

export const LOW_TIER_RECEIVED_TIERS: ReceivedTier[] = [
  { label: "5000만원 이상", count: 202_486 },
  { label: "4000만~5000만", count: 104_156 },
  { label: "3000만~4000만", count: 105_168 },
  { label: "2000만~3000만", count: 124_938 },
  { label: "1000만~2000만", count: 118_630 },
];

/** 낸 것보다 많이 받은 사람 최소 규모. */
export const MIN_EXCESS_TOTAL = 3_260_147;

/** 제도 변곡점 타임라인. */
export interface TimelineEvent {
  year: number;
  emoji: string;
  title: string;
  detail: string;
}

export const TIMELINE: TimelineEvent[] = [
  {
    year: 1988,
    emoji: "🌱",
    title: "국민연금 출범",
    detail: "보험료율 3% · 소득대체율 70%로 시작 — 가입 독려 목적",
  },
  {
    year: 1999,
    emoji: "🚪",
    title: "특례노령연금 종료",
    detail: "제도 초기엔 5년 가입만으로도 연금 수령 가능 (현행 10년)",
  },
  {
    year: 2026,
    emoji: "⚖️",
    title: "현재 제도",
    detail: "모수개혁으로 보험료율 13% · 소득대체율 43%",
  },
  {
    year: 2050,
    emoji: "📉",
    title: "재정수지 적자 전환 전망",
    detail: "국회예산정책처 시나리오 — 현 제도 유지 시",
  },
  {
    year: 2069,
    emoji: "🏜️",
    title: "기금 소진 전망",
    detail: "급속한 고령화·저출생이 재정 지속가능성 위협",
  },
];

/** 수지균형 보험료율 21.2% vs 현행 13% — 개혁 압력 지표. */
export const PREMIUM_RATE_NOW = 13;
export const PREMIUM_RATE_BALANCED = 21.2;
