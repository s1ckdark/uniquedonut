// Crab life-cycle content. Pure module — no DOM, no React.

export type CrabStageId = "egg" | "zoea" | "megalopa" | "juvenile" | "adult";

export interface CrabStage {
  id: CrabStageId;
  name: string;
  emoji: string;
  description: string;
  funFact: string;
  scale: number; // relative body size for the SVG (egg has none)
  paddles: boolean; // swimming-paddle legs (adult only)
}

export const crabStages: CrabStage[] = [
  {
    id: "egg",
    name: "알",
    emoji: "🥚",
    description:
      "엄마 꽃게는 배에 알을 붙여 품고 다녀요. 알 속에서 아기들이 조금씩 자라요.",
    funFact: "암컷 한 마리가 한 번에 수십만 개의 알을 품어요!",
    scale: 0,
    paddles: false,
  },
  {
    id: "zoea",
    name: "조에아",
    emoji: "🫧",
    description:
      "알이 바다에서 깨어나 '조에아' 유생이 돼요. 가시가 돋친 물뿌리개 같은 모습으로 플랑크톤처럼 떠다녀요.",
    funFact: "꽃게라고는 상상할 수 없는 모습이에요! 너무 작아서 현미경으로 봐야 해요.",
    scale: 0.25,
    paddles: false,
  },
  {
    id: "megalopa",
    name: "메가로파",
    emoji: "🦐",
    description:
      "조에아가 자라 '메가로파'가 돼요. 이제 게답게 변신 중! 하지만 배가 아직 새우처럼 길게 남아 있어요.",
    funFact: "메가로파는 '큰 눈'이라는 뜻이에요. 눈이 유난히 커서 붙은 이름!",
    scale: 0.5,
    paddles: false,
  },
  {
    id: "juvenile",
    name: "새끼게",
    emoji: "🦀",
    description:
      "드디어 꽃게 모습! 긴 배를 몸 아래로 접어 넣고 바다 바닥으로 내려가 살아요.",
    funFact: "모래 속에 파묻혀 숨는 숨바꼭질이 특기예요.",
    scale: 0.75,
    paddles: false,
  },
  {
    id: "adult",
    name: "어미게",
    emoji: "🦀",
    description:
      "탈피를 거듭하며 커져 어미 게가 돼요. 가장 뒤의 다리 두 개가 노처럼 평평해져요!",
    funFact: "그 노를 저으며 물속을 슝슝 헤엄쳐요. 알을 품으면 또 엄마가 돼요!",
    scale: 1,
    paddles: true,
  },
];
