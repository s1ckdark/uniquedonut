export interface Donut {
  slug: string;
  name: string;
  description: string;
  file: string;
  category: string;
  tags: string[];
  price: string;
  color: string;
}

export interface Category {
  name: string;
  emoji: string;
  color: string;
  donuts: Donut[];
}

const allDonuts: Donut[] = [
  // Glazed Originals
  {
    slug: "bubble-clock",
    name: "Bubble Clock",
    description: "Time flows in fizzy bubbles",
    file: "bubble-clock.html",
    category: "Glazed Originals",
    tags: ["Canvas", "Animation"],
    price: "$4.50",
    color: "#FF6B9D",
  },
  {
    slug: "blur-clock",
    name: "Blur Clock",
    description: "Time melts into soft focus",
    file: "blur-clock.html",
    category: "Glazed Originals",
    tags: ["CSS", "Animation"],
    price: "$3.75",
    color: "#FF6B9D",
  },
  {
    slug: "starfall",
    name: "Starfall",
    description: "A shower of falling stars",
    file: "starfall.html",
    category: "Glazed Originals",
    tags: ["Canvas", "Particles"],
    price: "$4.25",
    color: "#FF6B9D",
  },
  // Sprinkle Explosions
  {
    slug: "fireworks-drone",
    name: "Fireworks Drone",
    description: "Aerial pyrotechnics display",
    file: "fireworks-drone.html",
    category: "Sprinkle Explosions",
    tags: ["Canvas", "Particles"],
    price: "$5.50",
    color: "#FFD93D",
  },
  {
    slug: "fluid-motion",
    name: "Fluid Motion",
    description: "Liquid dynamics simulation",
    file: "fluid-motion.html",
    category: "Sprinkle Explosions",
    tags: ["WebGL", "Physics"],
    price: "$5.75",
    color: "#FFD93D",
  },
  {
    slug: "antigravity",
    name: "Antigravity",
    description: "Objects defy gravity on click",
    file: "antigravity.html",
    category: "Sprinkle Explosions",
    tags: ["Canvas", "Physics"],
    price: "$5.25",
    color: "#FFD93D",
  },
  {
    slug: "antigravity-trail",
    name: "Antigravity Trail",
    description: "Trails that float upward",
    file: "antigravity-trail.html",
    category: "Sprinkle Explosions",
    tags: ["Canvas", "Physics"],
    price: "$5.00",
    color: "#FFD93D",
  },
  // Cream Filled
  {
    slug: "terrain-3d",
    name: "Terrain 3D",
    description: "Procedural 3D landscape",
    file: "terrain-3d.html",
    category: "Cream Filled",
    tags: ["WebGL", "3D"],
    price: "$6.50",
    color: "#6BCB77",
  },
  {
    slug: "image-to-3d",
    name: "Image to 3D",
    description: "Photos become 3D objects",
    file: "image-to-3d.html",
    category: "Cream Filled",
    tags: ["WebGL", "3D"],
    price: "$6.75",
    color: "#6BCB77",
  },
  {
    slug: "data-display",
    name: "Data Display",
    description: "Beautiful data visualization",
    file: "data-display.html",
    category: "Cream Filled",
    tags: ["Canvas", "Data"],
    price: "$6.25",
    color: "#6BCB77",
  },
  {
    slug: "contour-lines",
    name: "Contour Lines",
    description: "Topographic reveal, altitude by altitude",
    file: "contour-lines.html",
    category: "Cream Filled",
    tags: ["Canvas", "Animation"],
    price: "$6.00",
    color: "#6BCB77",
  },
  // Chef's Special
  {
    slug: "night-dragon-lizard",
    name: "Night Dragon Lizard",
    description: "Mystical dragon grimoire",
    file: "night-dragon-lizard-pretext.html",
    category: "Chef's Special",
    tags: ["Canvas", "Interactive"],
    price: "$7.50",
    color: "#FF8C42",
  },
  {
    slug: "golf-swing",
    name: "Golf Swing",
    description: "Physics-based golf motion",
    file: "golf-swing.html",
    category: "Chef's Special",
    tags: ["Canvas", "Physics"],
    price: "$7.25",
    color: "#FF8C42",
  },
  {
    slug: "gravity-text",
    name: "Gravity Text",
    description: "Letters fall with gravity",
    file: "gravity-text.html",
    category: "Chef's Special",
    tags: ["Canvas", "Physics"],
    price: "$7.00",
    color: "#FF8C42",
  },
  {
    slug: "hand-shake",
    name: "Hand Shake",
    description: "Wave at your camera, watch donuts dance",
    file: "hand-shake.html",
    category: "Chef's Special",
    tags: ["Camera", "AI"],
    price: "$8.00",
    color: "#FF8C42",
  },
];

export const categories: Category[] = [
  {
    name: "Glazed Originals",
    emoji: "🍩",
    color: "#FF6B9D",
    donuts: allDonuts.filter((d) => d.category === "Glazed Originals"),
  },
  {
    name: "Sprinkle Explosions",
    emoji: "🎆",
    color: "#FFD93D",
    donuts: allDonuts.filter((d) => d.category === "Sprinkle Explosions"),
  },
  {
    name: "Cream Filled",
    emoji: "🧁",
    color: "#6BCB77",
    donuts: allDonuts.filter((d) => d.category === "Cream Filled"),
  },
  {
    name: "Chef's Special",
    emoji: "👨‍🍳",
    color: "#FF8C42",
    donuts: allDonuts.filter((d) => d.category === "Chef's Special"),
  },
];

export function getDonutBySlug(slug: string): Donut | undefined {
  return allDonuts.find((d) => d.slug === slug);
}

export function getAllSlugs(): string[] {
  return allDonuts.map((d) => d.slug);
}
