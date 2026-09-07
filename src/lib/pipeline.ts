// Data pipeline schematic: stage definitions, bezier geometry, and particle
// logic. Pure module — no DOM, no React.

export interface Point {
  x: number;
  y: number;
}

export interface PipelineStageDetail {
  role: string;
  donutStory: string;
  examples: string[];
}

export type StageId = "source" | "ingest" | "transform" | "store" | "serve";

export interface PipelineStage {
  id: StageId;
  name: string;
  short: string;
  emoji: string;
  color: string;
  detail: PipelineStageDetail;
}

export const stages: PipelineStage[] = [
  {
    id: "source",
    name: "소스",
    short: "판매 기록이 발생하는 곳",
    emoji: "🧾",
    color: "#FF6B9D",
    detail: {
      role: "데이터가 처음 만들어지는 곳이에요. 주문 앱, 포스 기계, 온라인 스토어가 각자 다른 모양의 기록을 남깁니다.",
      donutStory:
        "도넛 가게에서 주문서가 매일매일 쌓이는 것과 같아요. 매장 포스, 배달 앱, 홈페이지 주문이 각각 뿅뿅 생겨요.",
      examples: ["앱/웹 이벤트 로그", "POS 판매 기록", "DB 트랜잭션"],
    },
  },
  {
    id: "ingest",
    name: "수집",
    short: "흩어진 데이터를 한곳으로",
    emoji: "📥",
    color: "#FF8C42",
    detail: {
      role: "여기저기 흩어진 데이터를 한곳으로 모아 오는 단계예요. 실시간으로 흘려보내기도 하고, 정해진 시간에 묶어 가져오기도 해요.",
      donutStory: "매장, 배달, 홈페이지 주문서를 매일 아침 한 상자로 모으는 일이에요.",
      examples: ["실시간 스트리밍 수집", "주기적 배치 수집", "API 폴링"],
    },
  },
  {
    id: "transform",
    name: "처리",
    short: "정제하고 변환하고 집계",
    emoji: "🔧",
    color: "#FFD93D",
    detail: {
      role: "지저분한 원본 데이터를 깨끗하게 다듬어요. 중복을 없애고, 형식을 맞추고, 매출처럼 의미 있는 숫자로 합쳐요.",
      donutStory:
        "주문서에서 취소된 주문은 빼고, 같은 도넛 판매는 모아서 '오늘 글레이즈드 120개!'처럼 세는 거예요.",
      examples: ["중복 제거·검증", "형식 변환", "집계·요약"],
    },
  },
  {
    id: "store",
    name: "저장",
    short: "창고에 차곡차곡",
    emoji: "🗄️",
    color: "#6BCB77",
    detail: {
      role: "다듬은 데이터를 잘 보관하는 단계예요. 나중에 꺼내 보기 쉽게 역할별로 나누어 쌓아둬요.",
      donutStory: "월별 도넛 판매 장부를 연도별로 정리해 창고에 넣어두는 것과 같아요.",
      examples: ["데이터 웨어하우스", "데이터 레이크", "분석용 DB"],
    },
  },
  {
    id: "serve",
    name: "시각화",
    short: "대시보드로 의사결정",
    emoji: "📊",
    color: "#00ccff",
    detail: {
      role: "저장된 데이터를 그래프와 대시보드로 보여주는 단계예요. 보는 사람이 한눈에 이해하고 결정할 수 있게 해요.",
      donutStory: "'오늘 제일 잘 나간 도넛은?'을 그래프로 보여주는 게시판이에요!",
      examples: ["대시보드", "정기 리포트", "알림/지표"],
    },
  },
];
