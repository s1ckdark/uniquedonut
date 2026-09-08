// Mantis diary content: male-vs-female differences and growth stages.
// Pure module — no DOM, no React.

export type MantisPart = "body" | "antennae" | "wings" | "segments";

export interface MantisDifference {
  id: MantisPart;
  title: string;
  female: string;
  male: string;
  tip: string;
}

export const FEMALE_SEGMENTS = 6;
export const MALE_SEGMENTS = 8;

export const differences: MantisDifference[] = [
  {
    id: "body",
    title: "크기와 배모양",
    female: "몸이 크고 배가 통통하고 둥글둥글해요.",
    male: "몸이 작고 날씬해요.",
    tip: "나란히 놓고 보면 암컷이 한층 더 커요!",
  },
  {
    id: "antennae",
    title: "더듬이",
    female: "짧고 가느다랗게요.",
    male: "길고 빗처럼 복슬복슬해요.",
    tip: "더듬이가 빗살처럼 풍성하면 수컷이에요!",
  },
  {
    id: "wings",
    title: "날개",
    female: "배 끝까지 오지 않아요.",
    male: "배 끝보다 훌쩍 더 길게 뻗어요. 잘 날아다녀요!",
    tip: "날개가 꽁무니를 넘게 길면 수컷!",
  },
  {
    id: "segments",
    title: "배마디 수 🕵️",
    female: `배 아랫마디가 ${FEMALE_SEGMENTS}개예요.`,
    male: `배 아랫마디가 ${MALE_SEGMENTS}개예요.`,
    tip: "과학자들은 마디를 세어서 구분한답니다. 같이 세어봐요!",
  },
];

export type GrowthStageId = "ootheca" | "hatch" | "nymph" | "molt" | "adult";

export interface GrowthStage {
  id: GrowthStageId;
  name: string;
  emoji: string;
  description: string;
  funFact: string;
  scale: number; // relative body size for the SVG (ootheca has none)
  wings: boolean;
}

export const growthStages: GrowthStage[] = [
  {
    id: "ootheca",
    name: "알주머니",
    emoji: "🥚",
    description:
      "가을에 엄마 사마귀가 나뭇가지에 거품 알주머니(난괴)를 붙여요. 그 속에 알이 가득 들어 있어요.",
    funFact: "알주머니 하나에 알이 무려 100~400개나 들어 있대요!",
    scale: 0,
    wings: false,
  },
  {
    id: "hatch",
    name: "부화",
    emoji: "🐣",
    description:
      "봄이 되면 아기 사마귀들이 알주머니를 뚫고 쏟아져 나와요.",
    funFact: "갓 태어난 아기들은 서로 잡아먹히지 않으려고 후다닥 흩어져요!",
    scale: 0.3,
    wings: false,
  },
  {
    id: "nymph",
    name: "약충",
    emoji: "🐛",
    description:
      "아기 사마귀를 '약충'이라고 불러요. 어른의 미니판! 날개는 아직 없지만 사냥은 벌써 잘해요.",
    funFact: "몸이 반투명해서 속이 살짝 보이기도 해요.",
    scale: 0.55,
    wings: false,
  },
  {
    id: "molt",
    name: "탈피",
    emoji: "🧥",
    description:
      "몸이 커지려면 허물을 벗어야 해요. 5~8번 반복하며 조금씩 어른을 닮아가요.",
    funFact: "탈피 직후엔 몸이 물컹물컹해서 조심조심 움직여요.",
    scale: 0.8,
    wings: false,
  },
  {
    id: "adult",
    name: "성충",
    emoji: "🦗",
    description:
      "마지막 탈피가 끝나면 날개가 쫙 펴져요! 이제 어른 사마귀예요.",
    funFact: "성충이 되면 수컷은 날개로 훨훨 날아다니며 짝을 찾아요.",
    scale: 1,
    wings: true,
  },
];
