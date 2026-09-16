// 천고마비 storybook content: meaning, origin, and today's usage.
// Written for an 8-year-old. Pure module — no DOM, no React.

export type IdiomSceneId =
  | "meaning"
  | "steppe"
  | "warning"
  | "today"
  | "science";

export interface IdiomScene {
  id: IdiomSceneId;
  title: string;
  emoji: string;
  text: string; // narration
  fact: string; // "사실!" box
}

export const idiomScenes: IdiomScene[] = [
  {
    id: "meaning",
    title: "하늘은 높고, 말은 살찐다",
    emoji: "🐎",
    text: "천고마비(天高馬肥)! 한 글자씩 읽어볼까요? 天은 하늘, 高는 높을, 馬는 말, 肥는 살찔. 그래서 '하늘은 높고 말은 살찐다'라는 뜻이에요. 가을을 네 글자로 가장 멋지게 그린 사자성어예요!",
    fact: "네 글자로 뜻을 나타내는 재미있는 말을 '사자성어'라고 불러요.",
  },
  {
    id: "steppe",
    title: "초원의 유목민, 흉노",
    emoji: "🌾",
    text: "아주 먼 옛날, 넓은 초원에는 유목민 '흉노'가 살았어요. 말들은 여름 내내 초록 풀을 먹었어요. 그리고 가을이 오면 어김없이 통통하게 살이 올랐죠!",
    fact: "유목민은 말을 타고 이사하며 살았어요. 말은 가족이고, 자동차였어요!",
  },
  {
    id: "warning",
    title: "사기에 적힌 경고",
    emoji: "📜",
    text: "중국의 오래된 역사책 사기(史記) 흉노열전에는 가을이면 흉노가 살찐 말을 몰고 남쪽으로 내려왔다는 기록이 있어요. 중국 사람들은 가을이 오면 '이제 조심해야 한다!' 하고 긴장했대요. 천고마비는 이 이야기에서 유래했어요.",
    fact: "정확한 네 글자 모양은 훨씬 뒤에 갖춰졌지만, 뜻은 사기의 이 기록에서 왔어요.",
  },
  {
    id: "today",
    title: "오늘날의 뜻",
    emoji: "🍁",
    text: "시간이 아주 많이 흐르면서 무서운 뜻은 옅어졌어요. 이제 천고마비는 '하늘은 높고 푸르며, 더 없이 좋은 가을'을 이르는 말이에요. 가을이 되면 '천고마비의 계절이 왔네요!' 하고 인사하기도 해요.",
    fact: "'가을 추' 자를 넣은 추고마비(秋高馬肥)라고도 불러요.",
  },
  {
    id: "science",
    title: "왜 가을 하늘은 높을까?",
    emoji: "☁️",
    text: "가을 하늘은 왜 유난히 높아 보일까요? 가을 공기는 차고 건조해서 먼지와 물방울이 아주 적어요. 그래서 하늘이 맑고 멀게, 아주 높게 보이는 거예요!",
    fact: "가을에 먼 산이 또렷하게 보이는 것도 바로 이 이유예요!",
  },
];
