// Educational content for Gino. Add new learning pages here and they
// appear in the gino dropdown automatically.

export interface GinoContent {
  slug: string;
  name: string;
  href: string;
  emoji: string;
  color: string;
}

export const ginoContents: GinoContent[] = [
  {
    slug: "donut-math",
    name: "곱하기 마법",
    href: "/math",
    emoji: "🍩",
    color: "#FFD93D",
  },
];
