// Cold storybook content: how a cold virus plays out inside the body.
// Pure module — no DOM, no React.

export type ColdSceneId =
  | "invade"
  | "alarm"
  | "battle"
  | "redcell"
  | "fever"
  | "antibody"
  | "victory";

export interface ColdScene {
  id: ColdSceneId;
  title: string;
  emoji: string;
  text: string; // narration
  fact: string; // "사실!" box
}

export const coldScenes: ColdScene[] = [
  {
    id: "invade",
    title: "코로 들어온 불청객",
    emoji: "🤧",
    text: "어느 날, 뾰족뾰족한 감기 바이러스가 콧속으로 스윽 들어왔어요. 코와 목의 점막에 살며시 붙어서 몸속 깊이 파고들어요.",
    fact: "바이러스는 주로 손을 타고 코와 입으로 들어와요. 손 씻기가 최고의 경비병!",
  },
  {
    id: "alarm",
    title: "몸속 경보",
    emoji: "🚨",
    text: "점막을 지키던 대식세포가 바이러스를 발견했어요! '적 발견! 모두 모여라!' 몸속 곳곳에 긴급 신호가 퍼져요.",
    fact: "대식세포는 '크게 먹는 세포'라는 뜻이에요.",
  },
  {
    id: "battle",
    title: "백혈구, 출동!",
    emoji: "⚔️",
    text: "하얀 백혈구들이 우르르 몰려왔어요. 호중구는 바이러스를 꼭 붙잡고, 대식세포는 아작아작 먹어치워요!",
    fact: "콧물 속에는 싸운 세포들과 바이러스가 섞여 있어요.",
  },
  {
    id: "redcell",
    title: "그런데 적혈구는?",
    emoji: "🔴",
    text: "빨간 적혈구는 싸우지 않아요! 산소 가방을 메고 이리저리 뛰어다니며, 싸우는 백혈구들에게 산소를 날라줘요. 몸속의 응원단장이죠!",
    fact: "적혈구는 온몸을 1분에 두어 바퀴 돌며 산소를 배달해요.",
  },
  {
    id: "fever",
    title: "몸이 뜨거워져요",
    emoji: "🌡️",
    text: "전쟁이 치열해지면 몸에 열이 나요. 열로 바이러스를 약하게 만드는 몸의 작전이거든요. 콧물과 기침은 찌꺼기를 몸밖으로 밀어내는 청소예요.",
    fact: "그래서 감기에 걸리면 쉬고 자는 게 최고의 약이에요.",
  },
  {
    id: "antibody",
    title: "항체 특별부대",
    emoji: "🛡️",
    text: "B세포가 Y자 모양 항체 미사일을 만들었어요! 항체가 바이러스에 착착 붙어 꼼짝 못 하게 해요. 킬러 T세포는 숨은 바이러스까지 찾아내 요격해요.",
    fact: "항체는 바이러스만 딱 붙잡는 신기한 자물쇠예요.",
  },
  {
    id: "victory",
    title: "승리와 기억",
    emoji: "🏆",
    text: "드디어 바이러스를 몰아냈어요! 몸은 이 바이러스를 항체로 꼭 기억해요. 다음에 같은 놈이 오면 번개처럼 이겨버리죠.",
    fact: "감기가 낫는 데는 보통 일주일쯤 걸려요. 그동안 몸이 열심히 싸우는 거예요!",
  },
];
