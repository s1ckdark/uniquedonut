// AI usage board: types + validation + formatting for the nightly JSON
// snapshot pushed from the token_usage Postgres pipeline (racknerd).
// Pure module — no DOM, no React.

export interface DailyPoint {
  day: string; // YYYY-MM-DD (KST)
  tokens: number;
  usd: number | null; // API-정가 환산 추정; null when unpriceable
  costComplete: boolean;
}

export interface ProviderPoint {
  provider: string;
  tokens: number;
  usd: number | null;
}

export interface ModelPoint {
  provider: string;
  model: string;
  tokens: number;
  usd: number | null;
}

export interface HeatCell {
  dow: number; // 1=월 … 7=일
  hour: number; // 0..23
  tokens: number;
}

export interface UsageSnapshot {
  syncedAt: string; // ISO timestamp (KST)
  rows: number;
  firstDay: string; // YYYY-MM-DD
  lastDay: string; // YYYY-MM-DD
  partial: boolean;
  pricingAsOf: string;
  totalTokens: number;
  totalUsd: number;
  daily: DailyPoint[];
  providers: ProviderPoint[]; // 최근 30일
  models: ModelPoint[]; // top N
  heatmap: HeatCell[]; // Z.AI excluded upstream
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)$/;
const CAPS = { daily: 800, providers: 20, models: 40, heatmap: 168 };
const MAX_TEXT = 64;

function num(v: unknown, min = 0): number | null {
  return typeof v === "number" && Number.isFinite(v) && v >= min ? v : null;
}

function usd(v: unknown): number | null | undefined {
  if (v === null) return null; // explicitly unpriceable
  const n = num(v);
  return n === null ? undefined : n; // undefined = invalid
}

function validateDaily(v: unknown): DailyPoint | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  if (typeof o.day !== "string" || !DAY_RE.test(o.day)) return null;
  const tokens = num(o.tokens);
  if (tokens === null) return null;
  const u = usd(o.usd);
  if (u === undefined) return null;
  if (typeof o.costComplete !== "boolean") return null;
  return { day: o.day, tokens, usd: u, costComplete: o.costComplete };
}

function validateProvider(v: unknown): ProviderPoint | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  if (
    typeof o.provider !== "string" ||
    o.provider.length === 0 ||
    o.provider.length > MAX_TEXT
  ) {
    return null;
  }
  const tokens = num(o.tokens);
  if (tokens === null) return null;
  const u = usd(o.usd);
  if (u === undefined) return null;
  return { provider: o.provider, tokens, usd: u };
}

function validateModel(v: unknown): ModelPoint | null {
  const base = validateProvider(v);
  if (!base) return null;
  const model = (v as Record<string, unknown>).model;
  if (typeof model !== "string" || model.length === 0 || model.length > MAX_TEXT) {
    return null;
  }
  return { ...base, model };
}

function validateHeat(v: unknown): HeatCell | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  if (!Number.isInteger(o.dow) || (o.dow as number) < 1 || (o.dow as number) > 7) {
    return null;
  }
  if (!Number.isInteger(o.hour) || (o.hour as number) < 0 || (o.hour as number) > 23) {
    return null;
  }
  const tokens = num(o.tokens);
  if (tokens === null) return null;
  return { dow: o.dow as number, hour: o.hour as number, tokens };
}

function validateList<T>(
  v: unknown,
  cap: number,
  item: (x: unknown) => T | null,
): T[] | null {
  if (!Array.isArray(v) || v.length > cap) return null;
  const out: T[] = [];
  for (const entry of v) {
    const parsed = item(entry);
    if (parsed === null) return null;
    out.push(parsed);
  }
  return out;
}

/** Returns the snapshot when every field is well-formed, else null. */
export function validateUsageSnapshot(input: unknown): UsageSnapshot | null {
  if (typeof input !== "object" || input === null) return null;
  const o = input as Record<string, unknown>;
  if (typeof o.syncedAt !== "string" || !ISO_RE.test(o.syncedAt)) return null;
  if (typeof o.firstDay !== "string" || !DAY_RE.test(o.firstDay)) return null;
  if (typeof o.lastDay !== "string" || !DAY_RE.test(o.lastDay)) return null;
  if (typeof o.pricingAsOf !== "string" || o.pricingAsOf.length > 32) return null;
  if (typeof o.partial !== "boolean") return null;
  const rows = num(o.rows);
  const totalTokens = num(o.totalTokens);
  const totalUsd = num(o.totalUsd);
  if (rows === null || totalTokens === null || totalUsd === null) return null;
  const daily = validateList(o.daily, CAPS.daily, validateDaily);
  const providers = validateList(o.providers, CAPS.providers, validateProvider);
  const models = validateList(o.models, CAPS.models, validateModel);
  const heatmap = validateList(o.heatmap, CAPS.heatmap, validateHeat);
  if (!daily || !providers || !models || !heatmap) return null;
  return {
    syncedAt: o.syncedAt,
    rows: rows,
    firstDay: o.firstDay,
    lastDay: o.lastDay,
    partial: o.partial,
    pricingAsOf: o.pricingAsOf,
    totalTokens,
    totalUsd,
    daily,
    providers,
    models,
    heatmap,
  };
}

// ---------- formatting ----------

/** 999 → "999", 12,345 → "1.2만", 123,456,789 → "1.2억" */
export function fmtTokens(n: number): string {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}만`;
  return String(Math.round(n));
}

export function fmtUsd(n: number | null): string {
  if (n === null) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const PROVIDER_COLORS: Record<string, string> = {
  claude: "#FF6B9D",
  codex: "#4D96FF",
  zai: "#6BCB77",
  antigravity: "#FFD93D",
  grok: "#FF8C42",
};

export function providerColor(provider: string): string {
  return PROVIDER_COLORS[provider] ?? "#9AA0A6";
}

// ---------- calendar helpers ----------

/** Day-of-week (1=Mon…7=Sun) for a YYYY-MM-DD string, timezone-safe. */
export function dayOfWeek(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  // getDay(): 0=Sun…6=Sat → ISO dow 1..7
  return ((new Date(y, m - 1, d).getDay() + 6) % 7) + 1;
}

/** Lays daily points on a Mon-first week grid; null pads partial weeks. */
export function calendarWeeks(
  daily: DailyPoint[],
): Array<Array<DailyPoint | null>> {
  if (daily.length === 0) return [];
  const sorted = [...daily].sort((a, b) => a.day.localeCompare(b.day));
  const first = dayOfWeek(sorted[0].day);
  const weeks: Array<Array<DailyPoint | null>> = [[]];
  for (let i = 1; i < first; i++) weeks[0].push(null);
  for (const point of sorted) {
    const w = weeks[weeks.length - 1];
    w.push(point);
    if (w.length === 7) weeks.push([]);
  }
  const last = weeks[weeks.length - 1];
  while (last.length > 0 && last.length < 7) last.push(null);
  if (weeks[weeks.length - 1].length === 0) weeks.pop();
  return weeks;
}

// ---------- period aggregations (hour / week / month views) ----------

export interface HourPoint {
  hour: number; // 0..23
  tokens: number;
}

/** Heatmap(요일×시간)을 시간 축으로 합산 — Z.AI는 업스트림에서 제외됨. */
export function aggregateByHour(heatmap: HeatCell[]): HourPoint[] {
  const hours: HourPoint[] = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    tokens: 0,
  }));
  for (const cell of heatmap) {
    if (cell.hour >= 0 && cell.hour < 24) hours[cell.hour].tokens += cell.tokens;
  }
  return hours;
}

export interface WeekPoint {
  weekStart: string; // YYYY-MM-DD (Monday)
  tokens: number;
  usd: number;
}

function mondayOf(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dow = ((date.getDay() + 6) % 7) + 1; // 1=Mon…7=Sun
  date.setDate(date.getDate() - (dow - 1));
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** 일별 포인트를 월요일 시작 주 단위로 합산. */
export function aggregateByWeek(daily: DailyPoint[]): WeekPoint[] {
  const byKey = new Map<string, WeekPoint>();
  for (const point of daily) {
    const key = mondayOf(point.day);
    const bucket = byKey.get(key) ?? { weekStart: key, tokens: 0, usd: 0 };
    bucket.tokens += point.tokens;
    bucket.usd += point.usd ?? 0;
    byKey.set(key, bucket);
  }
  return [...byKey.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export interface MonthPoint {
  month: string; // YYYY-MM
  tokens: number;
  usd: number;
}

/** 일별 포인트를 월 단위로 합산. */
export function aggregateByMonth(daily: DailyPoint[]): MonthPoint[] {
  const byKey = new Map<string, MonthPoint>();
  for (const point of daily) {
    const key = point.day.slice(0, 7);
    const bucket = byKey.get(key) ?? { month: key, tokens: 0, usd: 0 };
    bucket.tokens += point.tokens;
    bucket.usd += point.usd ?? 0;
    byKey.set(key, bucket);
  }
  return [...byKey.values()].sort((a, b) => a.month.localeCompare(b.month));
}

// ---------- league (multi-participant) ----------

/** 참가자명 규칙: 1-16자, 한글/영문/숫자/공백/-/_ (공백은 trim·연속 축약). */
export function validateParticipantName(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (trimmed.length < 1 || trimmed.length > 16) return null;
  if (!/^[\p{Script=Hangul}\p{L}\p{N} _-]+$/u.test(trimmed)) return null;
  return trimmed;
}

export interface ParticipantSummary {
  name: string;
  lastSync: string;
  lastDay: string;
  totalTokens: number;
  totalUsd: number;
  /** lastDay로부터 30일 창의 토큰/비용 합 */
  tokens30d: number;
  usd30d: number;
  /** 최근 7일 (완결일 무관, daily 최대일 기준) */
  tokens7d: number;
  /** 최근 7일 vs 직전 7일 증감(%) — 직전 7일에 데이터가 없으면 null */
  delta7dPct: number | null;
}

/** 참가자 스냅샷 → 리그용 요약. 창 기준은 스냅샷 daily의 최대 날짜. */
export function summarizeParticipant(
  name: string,
  snapshot: UsageSnapshot,
): ParticipantSummary {
  const sorted = [...snapshot.daily].sort((a, b) => a.day.localeCompare(b.day));
  const lastDay = sorted.length > 0 ? sorted[sorted.length - 1].day : snapshot.lastDay;
  const anchor = new Date(`${lastDay}T00:00:00Z`).getTime();
  const DAY_MS = 86_400_000;
  const inWindow = (day: string, days: number) =>
    new Date(`${day}T00:00:00Z`).getTime() >= anchor - (days - 1) * DAY_MS &&
    new Date(`${day}T00:00:00Z`).getTime() <= anchor;

  const win30 = sorted.filter((p) => inWindow(p.day, 30));
  const last7 = sorted.filter((p) => inWindow(p.day, 7));
  const last7Start = last7.length > 0 ? last7[0].day : null;
  const prev7 = sorted.filter((p) => {
    if (last7Start === null) return false;
    return (
      new Date(`${p.day}T00:00:00Z`).getTime() <
        new Date(`${last7Start}T00:00:00Z`).getTime() &&
      new Date(`${p.day}T00:00:00Z`).getTime() >=
        new Date(`${last7Start}T00:00:00Z`).getTime() - 7 * DAY_MS
    );
  });
  const sum = (rows: typeof sorted, pick: (p: (typeof sorted)[number]) => number) =>
    rows.reduce((a, p) => a + pick(p), 0);

  const tokens7d = sum(last7, (p) => p.tokens);
  const prevTokens = sum(prev7, (p) => p.tokens);
  const delta7dPct = prevTokens > 0 ? ((tokens7d - prevTokens) / prevTokens) * 100 : null;

  return {
    name,
    lastSync: snapshot.syncedAt,
    lastDay,
    totalTokens: snapshot.totalTokens,
    totalUsd: snapshot.totalUsd,
    tokens30d: sum(win30, (p) => p.tokens),
    usd30d: Math.round(sum(win30, (p) => p.usd ?? 0) * 100) / 100,
    tokens7d,
    delta7dPct,
  };
}

export interface RankedParticipant extends ParticipantSummary {
  rank: number;
}

/** 랭킹: usd30d 내림차순, 동점이면 tokens30d 내림차순. */
export function rankParticipants(
  rows: ParticipantSummary[],
): RankedParticipant[] {
  const sorted = [...rows].sort(
    (a, b) => b.usd30d - a.usd30d || b.tokens30d - a.tokens30d,
  );
  return sorted.map((row, i) => ({ ...row, rank: i + 1 }));
}

// ---------- daily report (자정 적재 시점 자동 작성) ----------

export interface DailyReport {
  day: string; // 마지막 적재일 (한국 시간)
  tokens: number;
  usd: number | null;
  costComplete: boolean;
  /** 직전 7일 평균 (데이터가 7일 미만이면 null) */
  prev7Avg: number | null;
  /** prev7Avg 대비 증감 (%) — prev7Avg가 null이면 null */
  deltaPct: number | null;
  /** 최근 30일 기준 최다 모델 (스냅샷 models 상위) */
  topModel: ModelPoint | null;
}

/** 스냅샷의 마지막 완결일에 대한 일일 리포트를 도출 — 00:00 적재와 함께 생성.
 *  자정 직후 적재는 "오늘"이 0토큰으로 들어있으므로, 동기화 날짜(KST)보다
 *  이전 날짜 중 가장 최근일을 리포트 대상으로 삼는다. */
export function buildDailyReport(snapshot: UsageSnapshot): DailyReport | null {
  if (snapshot.daily.length === 0) return null;
  const sorted = [...snapshot.daily].sort((a, b) => a.day.localeCompare(b.day));
  const syncDay = snapshot.syncedAt.slice(0, 10); // YYYY-MM-DD (KST)
  const complete = sorted.filter((p) => p.day < syncDay);
  const last = complete.length > 0 ? complete[complete.length - 1] : sorted[sorted.length - 1];
  const prev = complete.slice(-8, -1);
  let prev7Avg: number | null = null;
  let deltaPct: number | null = null;
  if (prev.length > 0) {
    prev7Avg = prev.reduce((a, p) => a + p.tokens, 0) / prev.length;
    if (prev7Avg > 0) {
      deltaPct = ((last.tokens - prev7Avg) / prev7Avg) * 100;
    }
  }
  const topModel =
    snapshot.models.length > 0
      ? [...snapshot.models].sort((a, b) => b.tokens - a.tokens)[0]
      : null;
  return {
    day: last.day,
    tokens: last.tokens,
    usd: last.usd,
    costComplete: last.costComplete,
    prev7Avg,
    deltaPct,
    topModel,
  };
}
