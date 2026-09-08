// Sap-tree learning content: the guests at a summer-night sap tree and the
// stag-vs-rhino beetle differences. Pure module — no DOM, no React.

export type SapGuestId =
  | "stag"
  | "rhino"
  | "butterfly"
  | "hornet"
  | "giant-hornet";

export interface SapGuest {
  id: SapGuestId;
  name: string;
  emoji: string;
  what: string; // what it does at the sap tree
  funFact: string;
}

export const sapGuests: SapGuest[] = [
  {
    id: "stag",
    name: "사슴벌레",
    emoji: "🪲",
    what: "큰 턱으로 수액 자리를 지키면서 사이좋게(?) 나눠 마셔요.",
    funFact: "수컷의 턱이 사슴 뿔처럼 생겨서 '사슴'벌레라는 이름이 붙었어요!",
  },
  {
    id: "rhino",
    name: "장수풍뎅이",
    emoji: "🦏",
    what: "번쩍이는 몸으로 수액이 흐르는 나무를 찾아와 맛있게 마셔요.",
    funFact: "힘이 장수처럼 세다고 여겨서 이름이 붙었대요!",
  },
  {
    id: "butterfly",
    name: "나비",
    emoji: "🦋",
    what: "낮에 먼저 찾아와 부드러운 입으로 수액을 빨아마셔요.",
    funFact: "나비가 뚫은 작은 구멍을 밤에 딱정벌레들이 더 크게 벌려 써요!",
  },
  {
    id: "hornet",
    name: "말벌",
    emoji: "🐝",
    what: "수액의 단물이 좋아 날아들어요. 사슴벌레와 실갱이를 벌이기도!",
    funFact: "수액에 흠뻑 취한 말벌은 의외로 얌전해진대요.",
  },
  {
    id: "giant-hornet",
    name: "장수말벌",
    emoji: "🐝",
    what: "세계에서 가장 큰 말벌! 큰 턱으로 수액도 실컷 마셔요.",
    funFact: "다른 벌들의 천적이에요. 벌집을 습격해 애벌레를 가져가요!",
  },
];

export type BeetlePart = "weapon" | "body" | "color" | "fight";

export interface BeetleDifference {
  id: BeetlePart;
  title: string;
  stag: string; // 사슴벌레
  rhino: string; // 장수풍뎅이
  tip: string;
}

export const beetleDifferences: BeetleDifference[] = [
  {
    id: "weapon",
    title: "무기의 위치",
    stag: "턱이 사슴 뿔처럼 크게 자라나요.",
    rhino: "머리 위에 뿔이 하나 솟아요.",
    tip: "얼굴 옆에 무기면 사슴벌레, 머리 위 뿔이면 장수풍뎅이!",
  },
  {
    id: "body",
    title: "몸모양",
    stag: "납작하고 길쭉해요.",
    rhino: "통통하고 둥근 편이에요.",
    tip: "옆모습이 날씬하면 사슴벌레!",
  },
  {
    id: "color",
    title: "색깔",
    stag: "붉은 갈색 계열의 무광이에요.",
    rhino: "번쩍이는 검정색 광택이 나요.",
    tip: "빛에 반짝반짝하면 장수풍뎅이!",
  },
  {
    id: "fight",
    title: "싸움 방식",
    stag: "턱으로 집어서 바깥으로 휙 던져요.",
    rhino: "뿔로 들어올려서 뒤집어버려요.",
    tip: "둘의 목표는 나무에서 떨어뜨리는 거예요!",
  },
];
