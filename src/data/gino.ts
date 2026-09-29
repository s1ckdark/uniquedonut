// Educational content for Gino, listed on the /gino hub page.

export interface GinoContent {
  slug: string;
  name: string;
  description: string;
  href: string;
  emoji: string;
  color: string;
}

export const ginoContents: GinoContent[] = [
  {
    slug: "donut-math",
    name: "곱하기 마법",
    description: "도넛을 세면서 배우는 곱하기의 비밀",
    href: "/math",
    emoji: "🍩",
    color: "#FFD93D",
  },
  {
    slug: "moon-tides",
    name: "달과 바다",
    description: "달과 태양이 만드는 밀물과 썰물",
    href: "/tides",
    emoji: "🌊",
    color: "#00ccff",
  },
  {
    slug: "mantis-diary",
    name: "사마귀 관찰",
    description: "수컷 암컷 구분과 자라는 과정",
    href: "/mantis",
    emoji: "🦗",
    color: "#6BCB77",
  },
  {
    slug: "crab-life",
    name: "꽃게의 일생",
    description: "조에아에서 어미게까지 변신 이야기",
    href: "/crab",
    emoji: "🦀",
    color: "#FF8C42",
  },
  {
    slug: "sap-tree",
    name: "수액 나무 친구들",
    description: "여름밤 나무 식당에 모이는 곤충들",
    href: "/sap",
    emoji: "🪲",
    color: "#FF6B9D",
  },
  {
    slug: "cold-story",
    name: "감기 이야기",
    description: "몸속에서 벌어지는 감기 전쟁",
    href: "/cold",
    emoji: "🤧",
    color: "#9b5de5",
  },
  {
    slug: "shot-shield",
    name: "주사와 방패",
    description: "주사와 예방주사의 비밀",
    href: "/shot",
    emoji: "💉",
    color: "#4895ef",
  },
  {
    slug: "sleep-grow",
    name: "키 크는 잠",
    description: "성장호르몬과 잠의 마법",
    href: "/growth",
    emoji: "😴",
    color: "#f4a261",
  },
  {
    slug: "idiom-cheongoma",
    name: "천고마비",
    description: "가을 성어의 뜻과 유래",
    href: "/idiom",
    emoji: "🐎",
    color: "#e76f51",
  },
  {
    slug: "quiz-arena",
    name: "구구단 챌린지",
    description: "단을 골라 빠르게 풀는 포인트전",
    href: "/gugudan",
    emoji: "⚡",
    color: "#FFD93D",
  },
  {
    slug: "daily-math",
    name: "산수 놀이터",
    description: "매일매일 오늘의 산수 10문제",
    href: "/arithmetic",
    emoji: "🧮",
    color: "#FF8C42",
  },
  {
    slug: "memory",
    name: "기억력 챌린지",
    description: "숫자카드 짝 맞추기",
    href: "/memory",
    emoji: "🧠",
    color: "#c77dff",
  },
];
