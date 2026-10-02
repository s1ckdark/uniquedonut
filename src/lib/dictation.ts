// Dictation challenge: a Korean spelling bank where distractors are
// realistic misspelling traps (사이시옷, 된소리, 두음법칙, 되/돼, 띄어쓰기…).
// Pure module — no DOM, no React.

export type DictationTier = "words" | "sentences" | "advanced";

export interface DictationEntry {
  word: string; // the correct spelling (spoken + to be picked)
  distractors: string[]; // exactly 3 realistic misspellings
}

export const DICTATION_BANK: Record<DictationTier, DictationEntry[]> = {
  // 🌱 낱말 (1-2학년): 받침·된소리·두음법칙 기초 혼동
  words: [
    { word: "꽃씨", distractors: ["꼿씨", "꽃시", "꼿시"] },
    { word: "깡총깡총", distractors: ["깜총깜총", "깡충깡충", "깐충깐충"] },
    { word: "여름", distractors: ["년름", "여릅", "열음"] },
    { word: "부엉이", distractors: ["부엥이", "뿌엥이", "부엉히"] },
    { word: "호랑이", distractors: ["호랭이", "호랑히", "호라니"] },
    { word: "콩나물", distractors: ["꽁나물", "콩나뮬", "콘나물"] },
    { word: "까마귀", distractors: ["까마궤", "가마귀", "까마구"] },
    { word: "도마뱀", distractors: ["도마배", "도마벼", "도마밤"] },
    { word: "오목조목", distractors: ["오목쪼목", "오목죠목", "오목짜목"] },
    { word: "빙그레", distractors: ["핑그레", "빙그래", "삥그레"] },
  ],
  // 🔥 짧은 문장·헷갈리는 낱말 (3-4학년): 안/않, 되/돼, 띄어쓰기, 같이[가치]
  sentences: [
    { word: "안 된다", distractors: ["않 된다", "안된다", "않된다"] },
    { word: "할 수 있다", distractors: ["할수 있다", "할 수있다", "할수있다"] },
    { word: "되었다", distractors: ["돼었다", "되엇다", "돼엇다"] },
    { word: "없다", distractors: ["업다", "옅다", "없따"] },
    { word: "많이", distractors: ["만이", "마니", "만히"] },
    { word: "같이", distractors: ["가치", "갇이", "갈이"] },
    { word: "예쁘다", distractors: ["이쁘다", "예삐다", "엽쁘다"] },
    { word: "어이없다", distractors: ["어의없다", "어이업다", "어의업다"] },
    { word: "가끔", distractors: ["가끌", "가급", "가꿈"] },
    { word: "역시", distractors: ["엽시", "역시나", "여시"] },
  ],
  // ⚡ 어려운 낱말·문장 (5-6학년): 사이시옷, 겹받침, ㅎ 받침, 높임 표기
  advanced: [
    { word: "바닷가", distractors: ["바다가", "바닫가", "바다꽈"] },
    { word: "촛불", distractors: ["초불", "촛벌", "춧불"] },
    { word: "깻잎", distractors: ["깨잎", "껫잎", "깻입"] },
    { word: "어깨동무", distractors: ["업꺠동무", "어깧동무", "얼꺠동무"] },
    { word: "맛있어요", distractors: ["맛이써요", "마따써요", "맛써요"] },
    { word: "어머니께서", distractors: ["어머니 께서", "어머니개서", "어머니기서"] },
    { word: "그렇다", distractors: ["그렇따", "거렇다", "그럽다"] },
    { word: "파랗다", distractors: ["파랖다", "퍼랗다", "파랗따"] },
    { word: "귀찮다", distractors: ["귀찬다", "귀찮따", "기찬다"] },
    { word: "삐걱삐걱", distractors: ["삐겅삐겅", "빼걱빼걱", "삐걱쌔걱"] },
  ],
};

export interface DictationQuestion {
  word: string;
  options: string[]; // 4 unique values including the answer
  answer: string;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** A game's questions: bank entries shuffled (repeats only beyond the
 *  bank) with the answer shuffled into the options. */
export function buildDictationQuestions(
  tier: DictationTier,
  questionCount: number,
): DictationQuestion[] {
  let bank = shuffle(DICTATION_BANK[tier]);
  while (bank.length < questionCount) {
    bank = bank.concat(shuffle(DICTATION_BANK[tier]));
  }
  return bank.slice(0, questionCount).map((entry) => ({
    word: entry.word,
    answer: entry.word,
    options: shuffle([entry.word, ...entry.distractors]),
  }));
}

/** Difficulty: tier base + fixed 10s timeout (12) + 10 questions (5). */
export function dictationDifficulty(tier: DictationTier): number {
  const tierPts: Record<DictationTier, number> = {
    words: 16,
    sentences: 26,
    advanced: 36,
  };
  return tierPts[tier] + 12 + 5;
}
