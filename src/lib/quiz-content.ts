// Content-topic question banks for the Quiz Arena — every question is
// lifted from the matching gino story page. Pure module — no DOM, no React.

export interface ContentQuestion {
  prompt: string;
  options: string[]; // exactly 4
  answer: string; // one of options
}

export interface ContentTopic {
  slug: string; // matches the gino content slug
  name: string;
  emoji: string;
  color: string; // matches the gino hub card color
  baseDifficulty: number; // 0–100, the topic's share before timeout/count
  questions: ContentQuestion[];
}

export const contentTopics: ContentTopic[] = [
  {
    slug: "moon-tides",
    name: "달과 바다",
    emoji: "🌊",
    color: "#00ccff",
    baseDifficulty: 40,
    questions: [
      {
        prompt: "달이 지구를 잡아당기면 바닷물이 몰리는 곳은 어디일까요?",
        options: ["달 쪽과 정반대쪽, 두 곳", "달 쪽 한 곳만", "지구 전체에 똑같이", "달의 뒷면"],
        answer: "달 쪽과 정반대쪽, 두 곳",
      },
      {
        prompt: "달이 지구를 한 바퀴 돌면 도넛항은 만조를 몇 번 만날까요?",
        options: ["2번", "1번", "4번", "없어요"],
        answer: "2번",
      },
      {
        prompt: "달과 태양이 한 줄로 서서 물때가 가장 클 때를 뭐라고 부를까요?",
        options: ["사리", "조금", "밀물", "간조"],
        answer: "사리",
      },
      {
        prompt: "달과 태양이 직각일 때 물때가 잔잔해지는 것을 뭐라고 할까요?",
        options: ["조금", "사리", "만조", "대조"],
        answer: "조금",
      },
      {
        prompt: "달이 지구에 가까워지면 물때는 어떻게 될까요?",
        options: ["훨씬 커져요", "조금 작아져요", "그대로예요", "멈춰버려요"],
        answer: "훨씬 커져요",
      },
      {
        prompt: "바닷물이 밀려오고 있을 때를 부르는 말은 무엇일까요?",
        options: ["밀물", "썰물", "만조", "사리"],
        answer: "밀물",
      },
    ],
  },
  {
    slug: "mantis-diary",
    name: "사마귀 관찰",
    emoji: "🦗",
    color: "#6BCB77",
    baseDifficulty: 34,
    questions: [
      {
        prompt: "사마귀 수컷의 더듬이는 어떤가요?",
        options: ["길고 빗처럼 복슬복슬해요", "짧고 가느다랗아요", "아주 굵고 짧아요", "아예 없어요"],
        answer: "길고 빗처럼 복슬복슬해요",
      },
      {
        prompt: "암컷 사마귀의 배 아랫마디는 몇 개일까요?",
        options: ["6개", "8개", "4개", "10개"],
        answer: "6개",
      },
      {
        prompt: "사마귀 아기(약충)의 모습은 어떤가요?",
        options: ["어른의 미니판이에요", "엄마와 전혀 달라요", "번데기예요", "물고기 같아요"],
        answer: "어른의 미니판이에요",
      },
      {
        prompt: "사마귀는 번데기를 거칠까요?",
        options: ["아니요, 탈피만 해요", "네, 번데기를 거쳐요", "둘 다 거쳐요", "알에서 바로 어른이 돼요"],
        answer: "아니요, 탈피만 해요",
      },
      {
        prompt: "사마귀 알주머니 하나에는 알이 몇 개쯤 들어 있을까요?",
        options: ["100~400개", "1~4개", "10~20개", "몇만 개"],
        answer: "100~400개",
      },
      {
        prompt: "사마귀가 잡이발(앞다리)로 하는 일은 무엇일까요?",
        options: ["사냥하기", "걷기", "수영하기", "노래하기"],
        answer: "사냥하기",
      },
    ],
  },
  {
    slug: "crab-life",
    name: "꽃게의 일생",
    emoji: "🦀",
    color: "#FF8C42",
    baseDifficulty: 34,
    questions: [
      {
        prompt: "갓 태어난 꽃게 아기의 이름은 무엇일까요?",
        options: ["조에아", "메가로파", "어미게", "약충"],
        answer: "조에아",
      },
      {
        prompt: "새우 같은 긴 배를 가진 중간 단계의 이름은?",
        options: ["메가로파", "조에아", "새끼게", "성충"],
        answer: "메가로파",
      },
      {
        prompt: "어미 꽃게의 마지막 다리는 어떻게 생겼나요?",
        options: ["노처럼 평평해요", "집게 같아요", "날개 같아요", "아예 없어요"],
        answer: "노처럼 평평해요",
      },
      {
        prompt: "꽃게 아기는 엄마 꽃게와 닮았나요?",
        options: ["전혀 달라요", "완전 똑같아요", "색만 같아요", "크기만 달라요"],
        answer: "전혀 달라요",
      },
      {
        prompt: "꽃게가 겪지 않는 단계는 무엇일까요?",
        options: ["번데기", "알", "조에아", "메가로파"],
        answer: "번데기",
      },
      {
        prompt: "사마귀 아기와 꽃게 아기의 다른 점은?",
        options: [
          "사마귀는 미니판, 꽃게는 완전히 다른 모습",
          "둘 다 어른 미니판이에요",
          "둘 다 전혀 달라요",
          "꽃게만 번데기가 있어요",
        ],
        answer: "사마귀는 미니판, 꽃게는 완전히 다른 모습",
      },
    ],
  },
  {
    slug: "sap-tree",
    name: "수액 나무 친구들",
    emoji: "🪲",
    color: "#FF6B9D",
    baseDifficulty: 34,
    questions: [
      {
        prompt: "사슴벌레의 무기(뿔처럼 보이는 것)는 어디에 붙어 있나요?",
        options: ["턱", "머리 위", "등", "다리"],
        answer: "턱",
      },
      {
        prompt: "장수풍뎅이의 뿔은 어디에 있나요?",
        options: ["머리 위", "턱", "배 끝", "꼬리"],
        answer: "머리 위",
      },
      {
        prompt: "사슴벌레의 몸모양은 어떤가요?",
        options: ["납작하고 길쭉해요", "통통하고 둥글어요", "둥글고 납작해요", "네모나요"],
        answer: "납작하고 길쭉해요",
      },
      {
        prompt: "장수풍뎅이의 색깔은 어떤가요?",
        options: ["번쩍이는 검정 광택이에요", "붉은 갈색 무광이에요", "초록색이에요", "무지개색이에요"],
        answer: "번쩍이는 검정 광택이에요",
      },
      {
        prompt: "세계에서 가장 큰 말벌의 이름은?",
        options: ["장수말벌", "말벌", "꿀벌", "뒤영벌"],
        answer: "장수말벌",
      },
      {
        prompt: "사슴벌레와 장수풍뎅이의 변태 방식은?",
        options: ["완전변태 (번데기가 있어요)", "불완전변태 (번데기 없어요)", "변태하지 않아요", "알만 낳아요"],
        answer: "완전변태 (번데기가 있어요)",
      },
    ],
  },
  {
    slug: "cold-story",
    name: "감기 이야기",
    emoji: "🤧",
    color: "#9b5de5",
    baseDifficulty: 30,
    questions: [
      {
        prompt: "감기를 진짜로 낫게 하는 치료사는 누구일까요?",
        options: ["우리 몸", "주사", "약", "병원"],
        answer: "우리 몸",
      },
      {
        prompt: "대식세포의 뜻은 무엇일까요?",
        options: ["크게 먹는 세포", "작고 귀여운 세포", "빨간 세포", "딱딱한 세포"],
        answer: "크게 먹는 세포",
      },
      {
        prompt: "감기에 걸렸을 때 열이 나는 이유는?",
        options: [
          "바이러스를 약하게 만드는 몸의 방법이에요",
          "몸이 아파서 그래요",
          "너무 뛰어서 그래요",
          "더위를 먹어서 그래요",
        ],
        answer: "바이러스를 약하게 만드는 몸의 방법이에요",
      },
      {
        prompt: "적혈구의 역할은 무엇일까요?",
        options: ["산소를 나르는 응원단장", "바이러스와 싸우는 군인", "몸을 데우는 보일러", "상처를 막는 반창고"],
        answer: "산소를 나르는 응원단장",
      },
      {
        prompt: "콧물 속에는 무엇이 섞여 있을까요?",
        options: ["싸운 세포와 바이러스", "그냥 깨끗한 물", "꽃가루만", "먼지만"],
        answer: "싸운 세포와 바이러스",
      },
      {
        prompt: "항체는 어떻게 생겼나요?",
        options: ["Y자 모양의 열쇠", "동그란 공", "네모난 상자", "별 모양"],
        answer: "Y자 모양의 열쇠",
      },
    ],
  },
  {
    slug: "shot-shield",
    name: "주사와 방패",
    emoji: "💉",
    color: "#4895ef",
    baseDifficulty: 32,
    questions: [
      {
        prompt: "주사나 약이 정말로 하는 일은 무엇일까요?",
        options: [
          "열 내리고 콧물 멎게 편하게 해줘요",
          "바이러스를 직접 죽여요",
          "감기를 바로 낫게 해요",
          "몸을 튼튼하게 만들어요",
        ],
        answer: "열 내리고 콧물 멎게 편하게 해줘요",
      },
      {
        prompt: "항생제가 잡는 것은 무엇일까요?",
        options: ["세균", "바이러스", "감기", "열"],
        answer: "세균",
      },
      {
        prompt: "감기 바이러스에게 항생제는 어떤가요?",
        options: ["안 통해요", "아주 잘 통해요", "조금만 써요", "항상 써야 해요"],
        answer: "안 통해요",
      },
      {
        prompt: "백신 속에는 무엇이 들어 있나요?",
        options: [
          "힘을 못 쓰게 만든 바이러스 조금",
          "진짜 독한 바이러스",
          "그냥 물약",
          "항생제",
        ],
        answer: "힘을 못 쓰게 만든 바이러스 조금",
      },
      {
        prompt: "백신은 무엇과 같은가요?",
        options: ["몸속 군사들의 모의 훈련", "진짜 전쟁", "잠자는 약", "맛있는 간식"],
        answer: "몸속 군사들의 모의 훈련",
      },
      {
        prompt: "독감 예방주사는 언제 맞나요?",
        options: ["매년 가을에", "평생 한 번만", "여름마다", "아플 때마다"],
        answer: "매년 가을에",
      },
    ],
  },
  {
    slug: "sleep-grow",
    name: "키 크는 잠",
    emoji: "😴",
    color: "#f4a261",
    baseDifficulty: 30,
    questions: [
      {
        prompt: "성장호르몬이 나오는 곳은 어디일까요?",
        options: ["뇌 속의 뇌하수체", "심장", "팔", "다리"],
        answer: "뇌 속의 뇌하수체",
      },
      {
        prompt: "성장호르몬이 가서 일하는 곳은?",
        options: ["뼈 끝의 성장판", "머리카락", "눈", "배"],
        answer: "뼈 끝의 성장판",
      },
      {
        prompt: "성장호르몬이 가장 많이 나올 때는 언제일까요?",
        options: [
          "잠든 뒤 처음 3시간의 깊은 잠",
          "한낮에 씩씩하게 놀 때",
          "운동 직후",
          "밥을 먹을 때",
        ],
        answer: "잠든 뒤 처음 3시간의 깊은 잠",
      },
      {
        prompt: "우리 나이(6~13세)의 권장 수면 시간은?",
        options: ["9~11시간", "5~6시간", "12~14시간", "7~8시간"],
        answer: "9~11시간",
      },
      {
        prompt: "'밤 10시~2시 골든타임'에 대한 사실은 무엇일까요?",
        options: [
          "시계보다 잠든 지 얼마나 됐는지가 중요해요",
          "정확히 밤 10시에만 나와요",
          "전부 다 거짓말이에요",
          "낮잠에서 더 많이 나와요",
        ],
        answer: "시계보다 잠든 지 얼마나 됐는지가 중요해요",
      },
      {
        prompt: "키 크는 습관이 '아닌' 것은 무엇일까요?",
        options: ["밤늦게 스마트폰 놀기", "푹 자기", "뛰어놀기", "우유·달걀 먹기"],
        answer: "밤늦게 스마트폰 놀기",
      },
    ],
  },
  {
    slug: "idiom-cheongoma",
    name: "천고마비",
    emoji: "🐎",
    color: "#e76f51",
    baseDifficulty: 28,
    questions: [
      {
        prompt: "천고마비의 뜻은 무엇일까요?",
        options: ["하늘은 높고 말은 살찌다", "하늘이 무너진다", "천 마리의 말", "높은 산에 오르다"],
        answer: "하늘은 높고 말은 살찌다",
      },
      {
        prompt: "馬 자는 어떻게 읽나요?",
        options: ["말 마", "말 말", "마 말", "마 마"],
        answer: "말 마",
      },
      {
        prompt: "천고마비의 유래가 적힌 책은?",
        options: ["사기(史記)", "삼국유사", "훈민정음", "동의보감"],
        answer: "사기(史記)",
      },
      {
        prompt: "천고마비 유래의 주인공 유목민은 누구일까요?",
        options: ["흉노", "몽골", "고구려", "스키타이"],
        answer: "흉노",
      },
      {
        prompt: "오늘날 천고마비의 뜻은 무엇일까요?",
        options: [
          "높고 푸른 가을을 찬양하는 말",
          "전쟁을 경고하는 말",
          "말을 사랑하는 말",
          "추위를 탓하는 말",
        ],
        answer: "높고 푸른 가을을 찬양하는 말",
      },
      {
        prompt: "가을 하늘이 높아 보이는 이유는?",
        options: ["공기가 건조하고 깨끗해서", "구름이 많아서", "비가 자주 와서", "바람이 세게 불어서"],
        answer: "공기가 건조하고 깨끗해서",
      },
    ],
  },
];

export function findTopic(slug: string): ContentTopic | undefined {
  return contentTopics.find((t) => t.slug === slug);
}

/** Emoji for a leaderboard topic slug — story topics plus the daily-math,
 *  memory, and dictation challenges. */
export function topicEmoji(slug: string): string {
  if (slug === "daily-math") return "🧮";
  if (slug === "memory") return "🧠";
  if (slug === "dictation") return "📝";
  return findTopic(slug)?.emoji ?? "📚";
}
