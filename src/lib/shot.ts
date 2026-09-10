// Shot & Shield storybook: what a cold shot really does and how vaccines
// work. Written for an 8-year-old. Pure module — no DOM, no React.

export type ShotSceneId =
  | "hospital"
  | "injection"
  | "antibiotic"
  | "question"
  | "training"
  | "memory"
  | "victory"
  | "tips";

export interface ShotScene {
  id: ShotSceneId;
  title: string;
  emoji: string;
  text: string; // narration
  fact: string; // "사실!" box
}

export const shotScenes: ShotScene[] = [
  {
    id: "hospital",
    title: "병원에 갔어요",
    emoji: "🏥",
    text: "감기가 너무 심해져서 병원에 갔어요. 의사 선생님이 귀와 목을 꼼꼼히 보더니 말했어요. '감기네요. 걱정 마세요. 몸이 지금 열심히 싸우고 있어요!'",
    fact: "의사 선생님은 몸속 이야기를 듣고 병을 찾아내는 탐정이에요.",
  },
  {
    id: "injection",
    title: "주사는 무슨 일을 할까?",
    emoji: "💉",
    text: "주사나 약은 바이러스를 직접 죽이지 않아요! 열을 내려주고, 콧물을 멎게 해서 편안하게 해줄 뿐이에요. 감기를 진짜로 낫게 하는 치료사는 바로 우리 몸이에요.",
    fact: "약은 몸이 싸우기 편하게 도와주는 응원 도구예요.",
  },
  {
    id: "antibiotic",
    title: "항생제의 비밀",
    emoji: "🔬",
    text: "'항생제'라는 강한 약이 있어요. 이건 세균(박테리아)을 잡는 무기예요. 하지만 감기 바이러스에게는 힘이 안 써져요! 세균과 바이러스는 전혀 다른 생물이거든요.",
    fact: "세균은 초록 막대, 바이러스는 보라 공! 항생제는 막대만 잡아요.",
  },
  {
    id: "question",
    title: "미리 이기는 방법은?",
    emoji: "🤔",
    text: "'감기에 걸리기 전에 미리 이기는 방법은 없을까?' 있어요! 바로 예방주사(백신)이에요. 다만 감기 바이러스는 종류가 200개가 넘어서 백신을 만들기 어렵어요. 대신 독감(감기보다 독한 사촌)은 백신이 있어요!",
    fact: "독감 예방주사는 매년 가을에 맞아요. 올해 독감에 딱 맞는 거예요!",
  },
  {
    id: "training",
    title: "백신은 모의 훈련",
    emoji: "🎯",
    text: "백신 속에는 힘을 못 쓰게 만든 바이러스가 조금 들어 있어요. 몸속 군사들이 이걸 상대로 훈련을 해요. '이놈이 이렇게 생겼구나!' 하고 연습하는 거예요.",
    fact: "실제 전쟁 전에 하는 연습전과 똑같아요!",
  },
  {
    id: "memory",
    title: "항체 기억 만들기",
    emoji: "🧠",
    text: "훈련이 끝나면 몸은 항체를 만들어요. 그리고 이 바이러스를 오래도록 기억해요. 딱 한 번의 연습으로 진짜 무기가 생기는 거예요!",
    fact: "감기 이야기 마지막 장 '승리와 기억'과 똑같은 원리예요!",
  },
  {
    id: "victory",
    title: "진짜가 와도 번개승!",
    emoji: "⚡",
    text: "훈련된 몸에 진짜 독감 바이러스가 들어오면? 몸은 이미 항체를 갖고 있어서 번개처럼 싸워 이겨버려요. 아프기도 전에 끝나요!",
    fact: "예방주사를 맞으면 독감에 걸려도 훨씬 가볍게 지나가요.",
  },
  {
    id: "tips",
    title: "건강 지키기 3가지",
    emoji: "💪",
    text: "몸속 군사를 최강으로 만들어요! 첫째, 예방주사로 미리 훈련해요. 둘째, 손을 깨끗이 씻어요. 셋째, 푹 자고 잘 먹어요. 이게 최고의 방패예요!",
    fact: "밤에 자는 동안 몸이 열심히 수리 공사를 해요!",
  },
];
