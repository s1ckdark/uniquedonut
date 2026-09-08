// Phone Size Lab: curated device specs (real published dimensions) and a
// data-integrity validator. Pure module — no DOM, no React, no three.js.

export interface Device {
  slug: string;
  name: string;
  brand: string;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  screenIn: number;
  color: string;
  custom?: boolean;
}

export const devices: Device[] = [
  {
    slug: "iphone-16-pro-max",
    name: "iPhone 16 Pro Max",
    brand: "Apple",
    widthMm: 77.6,
    heightMm: 163.0,
    depthMm: 8.25,
    screenIn: 6.9,
    color: "#8a8a8f",
  },
  {
    slug: "iphone-16-pro",
    name: "iPhone 16 Pro",
    brand: "Apple",
    widthMm: 71.5,
    heightMm: 149.6,
    depthMm: 8.25,
    screenIn: 6.3,
    color: "#b0a58f",
  },
  {
    slug: "iphone-16-plus",
    name: "iPhone 16 Plus",
    brand: "Apple",
    widthMm: 77.8,
    heightMm: 160.9,
    depthMm: 7.8,
    screenIn: 6.7,
    color: "#7db4d8",
  },
  {
    slug: "iphone-16",
    name: "iPhone 16",
    brand: "Apple",
    widthMm: 71.6,
    heightMm: 147.6,
    depthMm: 7.8,
    screenIn: 6.1,
    color: "#a5c9dd",
  },
  {
    slug: "iphone-16e",
    name: "iPhone 16e",
    brand: "Apple",
    widthMm: 71.5,
    heightMm: 146.7,
    depthMm: 7.8,
    screenIn: 6.1,
    color: "#3f4045",
  },
  {
    slug: "iphone-se3",
    name: "iPhone SE (3세대)",
    brand: "Apple",
    widthMm: 67.3,
    heightMm: 138.4,
    depthMm: 7.3,
    screenIn: 4.7,
    color: "#1c1c1e",
  },
  {
    slug: "iphone-12-mini",
    name: "iPhone 12 mini",
    brand: "Apple",
    widthMm: 64.2,
    heightMm: 131.5,
    depthMm: 7.4,
    screenIn: 5.4,
    color: "#3c4043",
  },
  {
    slug: "galaxy-s25-ultra",
    name: "Galaxy S25 Ultra",
    brand: "Samsung",
    widthMm: 77.9,
    heightMm: 162.8,
    depthMm: 8.2,
    screenIn: 6.9,
    color: "#54575c",
  },
  {
    slug: "galaxy-s25",
    name: "Galaxy S25",
    brand: "Samsung",
    widthMm: 70.5,
    heightMm: 146.9,
    depthMm: 7.2,
    screenIn: 6.2,
    color: "#3a6ea5",
  },
  {
    slug: "galaxy-s25-edge",
    name: "Galaxy S25 Edge",
    brand: "Samsung",
    widthMm: 75.5,
    heightMm: 158.2,
    depthMm: 5.8,
    screenIn: 6.7,
    color: "#c8b8db",
  },
  {
    slug: "galaxy-z-fold-6",
    name: "Galaxy Z Fold 6 (접힘)",
    brand: "Samsung",
    widthMm: 68.1,
    heightMm: 153.5,
    depthMm: 12.1,
    screenIn: 6.2,
    color: "#243b55",
  },
  {
    slug: "galaxy-z-fold-8",
    name: "Galaxy Z Fold 8 (접힘)",
    brand: "Samsung",
    widthMm: 81.9,
    heightMm: 123.9,
    depthMm: 9.7,
    screenIn: 5.4,
    color: "#1f3a5f",
  },
  {
    slug: "pixel-9-pro-xl",
    name: "Pixel 9 Pro XL",
    brand: "Google",
    widthMm: 76.6,
    heightMm: 162.9,
    depthMm: 8.5,
    screenIn: 6.8,
    color: "#e8e4d8",
  },
  {
    slug: "pixel-9",
    name: "Pixel 9",
    brand: "Google",
    widthMm: 72.7,
    heightMm: 152.8,
    depthMm: 8.5,
    screenIn: 6.3,
    color: "#a8d5ba",
  },
  {
    slug: "minimal-phone-2",
    name: "미니멀폰 2",
    brand: "Minimal",
    widthMm: 72,
    heightMm: 122.6,
    depthMm: 9.48,
    screenIn: 3.92,
    color: "#2f2f35",
  },
  {
    slug: "titan-2-elite",
    name: "타이탄2 엘리트",
    brand: "Unihertz",
    widthMm: 75,
    heightMm: 117.8,
    depthMm: 10.6,
    screenIn: 4.5,
    color: "#3a3f45",
  },
];

export const DEFAULT_SELECTION = ["iphone-16-pro-max", "galaxy-s25-ultra"];

/** Validate device data integrity. Returns violations; empty = valid. */
export function validateDevices(list: Device[]): string[] {
  const violations: string[] = [];
  const seen = new Set<string>();

  for (const d of list) {
    const tag = d.slug || "(no slug)";
    if (!d.slug) violations.push(`${tag}: empty slug`);
    if (seen.has(d.slug)) violations.push(`${tag}: duplicate slug`);
    seen.add(d.slug);

    for (const [key, value] of [
      ["widthMm", d.widthMm],
      ["heightMm", d.heightMm],
      ["depthMm", d.depthMm],
      ["screenIn", d.screenIn],
    ] as const) {
      if (!(value > 0)) violations.push(`${tag}: ${key} must be positive`);
    }

    if (!/^#[0-9a-f]{6}$/i.test(d.color)) {
      violations.push(`${tag}: color must be a #rrggbb hex`);
    }
  }
  return violations;
}
