"use client";

import type { IdiomSceneId } from "@/lib/idiom";

// 천고마비 storybook illustrations. A reusable cartoon horse drives the
// story: lean in summer, fat in autumn, small with a rider heading south.

const BG = "#1a1430";

/** Cartoon horse centered near (0,0). `fat` widens the body. */
function Horse({ fat = 1 }: { fat?: number }) {
  const bodyRx = 26 * fat;
  return (
    <g>
      {/* tail */}
      <path d="M -26 0 q -12 4 -10 18" fill="none" stroke="#7a4a21" strokeWidth={4} strokeLinecap="round" />
      {/* body */}
      <ellipse cx={0} cy={0} rx={bodyRx} ry={16} fill="#a9683a" />
      {/* legs */}
      {[-14, -4, 10, 20].map((x) => (
        <rect key={x} x={x} y={12} width={5} height={22} rx={2} fill="#8a5430" />
      ))}
      {/* neck + head */}
      <path d="M 18 -8 q 12 -12 16 -24" fill="none" stroke="#a9683a" strokeWidth={12} strokeLinecap="round" />
      <ellipse cx={38} cy={-34} rx={11} ry={7} fill="#a9683a" transform="rotate(-20 38 -34)" />
      <path d="M 33 -42 l -3 -8 l 7 3 Z" fill="#a9683a" />
      <circle cx={42} cy={-35} r={1.8} fill="#1A0A2E" />
      {/* mane */}
      <path d="M 14 -18 q 8 -6 12 -14" fill="none" stroke="#5c3317" strokeWidth={5} strokeLinecap="round" />
    </g>
  );
}

function SceneMeaning() {
  const cards = [
    { hanja: "天", read: "하늘 천" },
    { hanja: "高", read: "높을 고" },
    { hanja: "馬", read: "말 마" },
    { hanja: "肥", read: "살찔 비" },
  ];
  return (
    <g>
      <rect y={40} width={280} height={70} fill="#5aa7de" opacity={0.35} />
      <text x={140} y={30} textAnchor="middle" fontSize={12} fill="#7cc7ff">
        ¸.·´¯`·.´¯`·.¸ 높은 가을 하늘 ¸.·´¯`·.´¯`·.¸
      </text>
      {cards.map((c, i) => (
        <g key={c.hanja} transform={`translate(${38 + i * 68} 105)`}>
          <rect x={-24} y={-26} width={48} height={62} rx={8} fill="#241a3f" stroke="#e76f51" strokeWidth={2} />
          <text y={8} textAnchor="middle" fontSize={26} fontWeight="bold" fill="#FEFEFE">
            {c.hanja}
          </text>
          <text y={28} textAnchor="middle" fontSize={9} fill="#e76f51">
            {c.read}
          </text>
        </g>
      ))}
      <g transform="translate(70 185) scale(0.55)">
        <Horse fat={1.15} />
      </g>
      <text x={175} y={178} fontSize={16} fill="#FFD93D">통통! 🍂</text>
    </g>
  );
}

function SceneSteppe() {
  return (
    <g>
      <rect y={110} width={280} height={90} fill="#7a9c50" />
      <path d="M 0 112 q 70 -14 140 0 q 70 14 140 0 L 280 200 L 0 200 Z" fill="#8fb35f" />
      <circle cx={240} cy={40} r={18} fill="#FFD93D" opacity={0.9} />
      {[
        [30, 130], [90, 142], [150, 132], [220, 145], [260, 128],
      ].map(([x, y], i) => (
        <path key={i} d={`M ${x} ${y} q 2 -8 0 -12 M ${x + 4} ${y} q 2 -6 1 -10`} stroke="#5c7a3a" strokeWidth={2} fill="none" />
      ))}
      <g transform="translate(130 130)">
        <Horse fat={1.25} />
        <text x={-6} y={-32} fontSize={11} fill="#FFD93D">살찜!</text>
      </g>
      <g transform="translate(45 168) scale(0.6)">
        <Horse fat={1.25} />
      </g>
    </g>
  );
}

function SceneWarning() {
  return (
    <g>
      {/* southern wall/gate */}
      <rect x={216} y={60} width={12} height={110} fill="#6b5b73" />
      <rect x={200} y={44} width={44} height={20} rx={3} fill="#8a7a93" />
      <text x={222} y={190} fontSize={10} fill="#FEFEFE" textAnchor="middle">중국</text>
      {/* riders heading south (down-left) */}
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${70 + i * 62} ${70 + i * 26}) scale(0.6)`}>
          <Horse fat={1.1} />
          {/* rider */}
          <circle cx={2} cy={-26} r={8} fill="#5c3a6e" />
          <path d="M -6 -22 L 10 -22 L 7 -6 L -3 -6 Z" fill="#7a4a8f" />
        </g>
      ))}
      {/* big direction arrow */}
      <path d="M 40 40 q -14 50 -6 110" fill="none" stroke="#FF6B6B" strokeWidth={4} strokeDasharray="8 6" />
      <polygon points="34,150 26,134 44,136" fill="#FF6B6B" />
      <text x={52} y={168} fontSize={12} fill="#FF6B6B" fontWeight="bold">남쪽으로!</text>
      <text x={190} y={30} fontSize={22}>📜</text>
      <text x={96} y={28} fontSize={11} fill="#FFD93D">사기(史記) 흉노열전</text>
    </g>
  );
}

function SceneToday() {
  return (
    <g>
      {/* autumn tree */}
      <rect x={62} y={90} width={12} height={70} fill="#7a4a21" />
      <circle cx={68} cy={70} r={34} fill="#e76f51" />
      <circle cx={48} cy={82} r={20} fill="#f4a261" />
      <circle cx={90} cy={82} r={20} fill="#e05c43" />
      {[
        [130, 60], [160, 90], [120, 130], [190, 60], [150, 150],
      ].map(([x, y], i) => (
        <text key={i} x={x} y={y} fontSize={14}>🍂</text>
      ))}
      {/* greeting card */}
      <rect x={168} y={96} width={92} height={64} rx={8} fill="#241a3f" stroke="#FFD93D" strokeWidth={2} />
      <text x={214} y={122} textAnchor="middle" fontSize={13} fill="#FFD93D" fontWeight="bold">
        천고마비의
      </text>
      <text x={214} y={140} textAnchor="middle" fontSize={13} fill="#FFD93D" fontWeight="bold">
        계절이에요!
      </text>
      <text x={30} y={182} fontSize={11} fill="#FEFEFE">높고 푸른 하늘 · 풍요의 가을 🍁</text>
    </g>
  );
}

function SceneScience() {
  return (
    <g>
      {/* two panels: hazy summer (left) vs clear autumn (right) */}
      <rect x={10} y={40} width={122} height={130} rx={8} fill="#8a8578" opacity={0.55} />
      <rect x={148} y={40} width={122} height={130} rx={8} fill="#5aa7de" opacity={0.75} />
      <text x={71} y={30} textAnchor="middle" fontSize={11} fill="#FEFEFE">여름 (습하고 흐림)</text>
      <text x={209} y={30} textAnchor="middle" fontSize={11} fill="#7cc7ff">가을 (건조하고 맑음)</text>
      {/* dust specks on the summer side */}
      {[[30, 70], [55, 95], [40, 120], [80, 65], [95, 105], [65, 140], [105, 130]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.4} fill="#c9c2b2" opacity={0.9} />
      ))}
      {/* blurry mountain vs crisp mountain */}
      <path d="M 18 170 l 34 -48 l 30 48 Z" fill="#6b7a55" opacity={0.5} />
      <path d="M 156 170 l 34 -52 l 32 52 Z" fill="#4c7a55" />
      <path d="M 190 118 l -0 0" stroke="#fff" />
      <text x={71} y={188} textAnchor="middle" fontSize={10} fill="#FEFEFE">먼지·물방울 많음</text>
      <text x={209} y={188} textAnchor="middle" fontSize={10} fill="#FEFEFE">공기가 깨끗!</text>
    </g>
  );
}

export default function IdiomArt({ scene }: { scene: IdiomSceneId }) {
  return (
    <svg
      viewBox="0 0 280 200"
      className="h-auto w-full"
      role="img"
      aria-label="천고마비 이야기 장면"
    >
      <rect width={280} height={200} rx={14} fill={BG} />
      {scene === "meaning" && <SceneMeaning />}
      {scene === "steppe" && <SceneSteppe />}
      {scene === "warning" && <SceneWarning />}
      {scene === "today" && <SceneToday />}
      {scene === "science" && <SceneScience />}
    </svg>
  );
}
