#!/usr/bin/env bash
# push_usage_snapshot.sh — racknerd용 토큰 사용량 스냅샷 푸시 (00:30 KST cron)
#
# 로컬 Postgres(token_usage 스키마)를 조회해 Token Board(/usage)용
# JSON 스냅샷을 만들고 workers.dev API로 POST 한다.
# 의존성: psql 접근 경로 + curl. JSON 조립은 SQL(json_build_object)이 담당.
#
# 설치 (racknerd):
#   1. 이 스크립트를 /opt/usage-push/ 등에 복사, chmod +x
#   2. 같은 디렉토리에 usage-push.env 생성 (아래 ENV 파일 예시 참고), chmod 600
#   3. crontab 등록 (서버는 UTC — 15:30 UTC = 00:30 KST):
#        30 15 * * * /opt/usage-push/push_usage_snapshot.sh >> /var/log/usage-push.log 2>&1
#
# 사용:
#   ./push_usage_snapshot.sh            # 조회 + POST
#   ./push_usage_snapshot.sh --dry-run  # POST 없이 JSON만 출력 (설치 점검용)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---- 설정 (env 파일이 있으면 덮어씀) ----
# Postgres 접근: 도커 컨테이너로 돌고 있으면 docker exec 경로를 쓰고,
# 호스트에 psql 이 있으면 "psql -h 127.0.0.1 -U postgres -d postgres" 로 바꾼다.
PSQL_CMD="${PSQL_CMD:-docker exec postgres psql -U postgres -d postgres}"
API_URL="${API_URL:-https://uniquedonut.s1ckdark.workers.dev/api/usage}"
# USAGE_PUSH_SECRET 은 env 파일 또는 환경변수로만 (스크립트에 값을 두지 않는다)

ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/usage-push.env}"
if [[ -f "$ENV_FILE" ]]; then
  # KEY=VALUE 형태만 안전하게 로드
  set -a
  # shellcheck disable=SC1090
  source <(grep -E '^[A-Za-z_]+=' "$ENV_FILE")
  set +a
fi

if [[ -z "${USAGE_PUSH_SECRET:-}" ]]; then
  echo "ERROR: USAGE_PUSH_SECRET 이 설정되지 않았습니다 (usage-push.env 또는 환경변수)" >&2
  exit 1
fi

# ---- 스냅샷 SQL: 검증 규칙(src/lib/usage.ts validateUsageSnapshot)에 맞춤 ----
#  - daily ≤ 800행, heatmap 168행(7x24), models ≤ 40행, providers ≤ 20행
#  - usd 는 null 허용, 날짜는 YYYY-MM-DD, syncedAt 은 +09:00 ISO
SNAPSHOT_SQL=$(cat <<'SQL'
WITH latest AS (
  SELECT * FROM token_usage.sync_runs ORDER BY id DESC LIMIT 1
), daily AS (
  SELECT day,
         sum(tokens)  AS tokens,
         sum(api_usd) AS usd,
         bool_and(cost_complete) AS cost_complete
    FROM token_usage.daily_usage GROUP BY day
), providers AS (
  SELECT provider, sum(tokens) AS tokens, sum(api_usd) AS usd
    FROM token_usage.daily_usage
   WHERE day >= (now() AT TIME ZONE 'Asia/Seoul')::date - 30
   GROUP BY provider
), models AS (
  SELECT provider, model, sum(tokens) AS tokens, sum(api_usd) AS usd
    FROM token_usage.daily_usage
   GROUP BY provider, model ORDER BY sum(tokens) DESC LIMIT 20
), heat AS (
  SELECT extract(isodow FROM day)::int AS dow, hour, sum(tokens) AS tokens
    FROM token_usage.hourly_usage WHERE hour IS NOT NULL GROUP BY 1, 2
)
SELECT json_build_object(
  'syncedAt',    to_char((SELECT finished_at FROM latest) AT TIME ZONE 'Asia/Seoul',
                         'YYYY-MM-DD"T"HH24:MI:SS+09:00'),
  'rows',        COALESCE((SELECT rows FROM latest), 0),
  'firstDay',    to_char((SELECT min(day) FROM token_usage.daily_usage), 'YYYY-MM-DD'),
  'lastDay',     to_char((SELECT max(day) FROM token_usage.daily_usage), 'YYYY-MM-DD'),
  'partial',     COALESCE((SELECT partial FROM latest), false),
  'pricingAsOf', COALESCE((SELECT to_char(pricing_as_of, 'YYYY-MM-DD') FROM latest), 'unknown'),
  'totalTokens', COALESCE((SELECT sum(tokens) FROM token_usage.daily_usage), 0),
  'totalUsd',    COALESCE((SELECT round(sum(api_usd)::numeric, 2) FROM token_usage.daily_usage), 0),
  'daily',       COALESCE((SELECT json_agg(json_build_object(
                    'day', to_char(day, 'YYYY-MM-DD'), 'tokens', tokens,
                    'usd', usd, 'costComplete', cost_complete) ORDER BY day FROM daily), '[]'::json),
  'providers',   COALESCE((SELECT json_agg(json_build_object(
                    'provider', provider, 'tokens', tokens, 'usd', usd)
                    ORDER BY tokens DESC) FROM providers), '[]'::json),
  'models',      COALESCE((SELECT json_agg(json_build_object(
                    'provider', provider, 'model', model, 'tokens', tokens, 'usd', usd)
                    ORDER BY tokens DESC) FROM models), '[]'::json),
  'heatmap',     COALESCE((SELECT json_agg(json_build_object(
                    'dow', dow, 'hour', hour, 'tokens', tokens)
                    ORDER BY dow, hour) FROM heat), '[]'::json)
);
SQL
)

# ---- 조회 ----
SNAPSHOT=$($PSQL_CMD -tAq -c "$SNAPSHOT_SQL")

if [[ -z "$SNAPSHOT" || "$SNAPSHOT" == "null" ]]; then
  echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') SKIP: 스냅샷이 비어 있음 (첫 적재 전이라 Postgres에 데이터 없음)"
  exit 0
fi

LAST_DAY=$(printf '%s' "$SNAPSHOT" | grep -o '"lastDay":"[^"]*"' | cut -d'"' -f4)
if [[ -z "$LAST_DAY" || "$LAST_DAY" == "null" ]]; then
  echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') SKIP: daily_usage 가 비어 있어 lastDay 없음"
  exit 0
fi

if [[ "${1:-}" == "--dry-run" ]]; then
  echo "DRY-RUN snapshot (lastDay=$LAST_DAY):"
  printf '%s\n' "$SNAPSHOT" | head -c 600
  echo "..."
  exit 0
fi

# ---- 전송 ----
HTTP_CODE=$(curl -s -o /tmp/usage-push-resp.json -w '%{http_code}' \
  --max-time 60 \
  -X POST "$API_URL" \
  -H "Authorization: Bearer $USAGE_PUSH_SECRET" \
  -H "Content-Type: application/json" \
  --data-binary "$SNAPSHOT")

if [[ "$HTTP_CODE" == "200" ]]; then
  echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') OK: pushed (lastDay=$LAST_DAY) → $(cat /tmp/usage-push-resp.json)"
else
  echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') FAIL: HTTP $HTTP_CODE → $(cat /tmp/usage-push-resp.json)"
  exit 1
fi
