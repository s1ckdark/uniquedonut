// Cold storybook content: how a cold virus plays out inside the body.
// Written for an 8-year-old: short sentences, easy words, and hard terms
// explained inline. Pure module — no DOM, no React.

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
    title: "바이러스가 콧속에!",
    emoji: "🤧",
    text: "어느 날, 뾰족뾰족한 감기 바이러스가 콧속으로 스윽 들어왔어요. 코 안은 촉촉하고 부드러워서, 바이러스가 살며시 붙어서 몸속으로 들어가려 해요.",
    fact: "바이러스는 주로 손을 타고 코와 입으로 들어와요. 손을 깨끗이 씻으면 막을 수 있어요!",
  },
  {
    id: "alarm",
    title: "몸속 경보",
    emoji: "🚨",
    text: "코 안을 지키던 커다란 세포, 대식세포가 바이러스를 발견했어요! '나쁜 놈이다! 모두 모여라!' 몸속 곳곳에 급한 연락이 퍼져요.",
    fact: "대식세포는 '크게 먹는 세포'라는 뜻이에요. 정말로 바이러스를 먹어치워요!",
  },
  {
    id: "battle",
    title: "백혈구, 출동!",
    emoji: "⚔️",
    text: "하얀 피 속 지킴이, 백혈구가 우르르 달려왔어요. 어떤 백혈구는 바이러스를 꼭 붙잡고, 대식세포는 아삭아삭 먹어치워요!",
    fact: "콧물 속에는 싸운 세포와 바이러스가 섞여 있어요. 휴지로 꼭 닦아 주세요!",
  },
  {
    id: "redcell",
    title: "그런데 적혈구는?",
    emoji: "🔴",
    text: "빨간 적혈구는 싸우지 않아요! 대신 산소(숨쉴 때 들이마시는 귀한 것!)를 가방에 담아 이리저리 뛰어다니며, 싸우는 백혈구에게 나라줘요. 몸속의 응원단장이에요!",
    fact: "적혈구는 온몸을 1분에 두세 바퀴 돌아요. 우체부 아저씨처럼 부지런해요!",
  },
  {
    id: "fever",
    title: "몸이 뜨거워져요",
    emoji: "🌡️",
    text: "싸움이 점점 세지면 몸이 뜨거워져요. 그건 몸이 바이러스를 약하게 만드는 방법이에요. 콧물과 기침은 싸운 흔적을 몸밖으로 밀어내는 청소예요.",
    fact: "감기에 걸리면 푹 자고 쉬는 게 제일 좋은 약이에요.",
  },
  {
    id: "antibody",
    title: "항체 특별부대",
    emoji: "🛡️",
    text: "드디어 특별한 무기가 나타났어요! 항체는 Y자 모양의 열쇠처럼 생겨서, 바이러스에 착 달라붙어 꼼짝 못 하게 해요. 킬러 T세포는 숨어 있는 바이러스까지 찾아서 잡아요.",
    fact: "항체는 나쁜 것만 골라서 붙잡는 신기한 자물쇠예요.",
  },
  {
    id: "victory",
    title: "승리와 기억",
    emoji: "🏆",
    text: "드디어 바이러스를 다 물리쳤어요! 몸은 이 바이러스를 항체로 꼭 기억해요. 다음에 같은 바이러스가 또 오면, 번개처럼 이겨버려요.",
    fact: "감기가 나으려면 보통 일주일쯤 걸려요. 그동안 몸속에서는 지금도 열심히 싸우고 있어요!",
  },
];
