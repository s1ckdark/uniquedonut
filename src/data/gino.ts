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
];
