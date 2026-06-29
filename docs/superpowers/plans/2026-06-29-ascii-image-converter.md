# ASCII Image Converter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/ascii` demo page that converts uploaded or webcam-captured images into terminal-style (TUI) art — ASCII art and Unicode block art, with color toggle, copy, and PNG download.

**Architecture:** Pure client-side Canvas processing, no server and no external deps. Conversion logic lives in pure, DOM-free functions in `src/lib/ascii.ts` (unit-tested). The page owns the `<canvas>` and webcam/upload state (mirroring `/visualizer`); a presentational `AsciiOutput` component renders the result with copy/download actions.

**Tech Stack:** Next.js 16 (app router, `"use client"`), React 19, Tailwind v4, TypeScript. Tests via Node's built-in `node:test` + `tsx`.

**Spec:** `docs/superpowers/specs/2026-06-29-ascii-image-converter-design.md`

**Conventions (from existing code):** Pages are client components at `src/app/<route>/page.tsx`. Components in `src/components/`. The visualizer page (`src/app/visualizer/page.tsx`) is the closest template — same permission state machine, same Tailwind styling tokens (`#1A0A2E` bg, `#FF6B9D`/`#FFD93D`/`#6BCB77` accents, Bungee Shade headings).

---

## File Structure

- **Create:** `src/lib/ascii.ts` — pure conversion functions (no DOM). Types, luminance, ASCII/block mapping, ANSI color, entry point.
- **Create:** `src/lib/ascii.test.ts` — unit tests for the pure functions.
- **Create:** `src/lib/ansi.ts` — pure ANSI-sequence-to-HTML parser used by the display component.
- **Create:** `src/lib/ansi.test.ts` — unit tests for the parser.
- **Create:** `src/components/AsciiOutput.tsx` — presentational component: renders converted text, copy + download actions.
- **Create:** `src/app/ascii/page.tsx` — client page: upload + webcam input, canvas pixel reading, controls, calls conversion.
- **Modify:** `src/app/shop/page.tsx` — add a link card to the new `/ascii` demo.
- **Modify:** `package.json` — add `tsx` devDependency and `test` script.

---

## Task 1: Set up test infrastructure

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add tsx devDependency and test script**

Run:
```bash
npm install -D tsx
```

Then verify `package.json` `devDependencies` now includes `"tsx"`. Add **only** the `test` script line to the existing `scripts` block — leave all other scripts (`dev`, `build`, `start`, `lint`, `preview`, `deploy`) untouched, exactly as they are now:

```json
"test": "node --test --import tsx 'src/lib/**/*.test.ts'"
```

The `scripts` block should end up with the original six scripts plus this new `test` entry.

- [ ] **Step 2: Verify test runner works**

Create a temporary throwaway file `src/lib/__smoke.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";

test("smoke", () => {
  assert.equal(1 + 1, 2);
});
```

Run: `npm test`
Expected: 1 test passes. Then delete `src/lib/__smoke.test.ts`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add node:test + tsx test infrastructure"
```

---

## Task 2: Pixel types and luminance (TDD)

**Files:**
- Create: `src/lib/ascii.ts`
- Test: `src/lib/ascii.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/ascii.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { luminance, samplePixel } from "./ascii";

test("luminance of black is 0", () => {
  assert.equal(luminance(0, 0, 0, 255), 0);
});

test("luminance of white is 255", () => {
  assert.equal(luminance(255, 255, 255, 255), 255);
});

test("luminance is weighted (green brighter than blue at same value)", () => {
  // Rec.601: green weight 0.587, blue weight 0.114
  assert.ok(luminance(0, 200, 0, 255) > luminance(0, 0, 200, 255));
});

test("luminance scales by alpha (transparent pixels read dark)", () => {
  const solid = luminance(255, 255, 255, 255);
  const transparent = luminance(255, 255, 255, 0);
  assert.ok(transparent < solid);
  assert.equal(transparent, 0);
});

test("samplePixel reads RGBA at (x,y) from a flat buffer", () => {
  // 1x2 image: top red, bottom blue
  const pixels = new Uint8Array([255, 0, 0, 255, 0, 0, 255, 255]);
  assert.deepEqual(samplePixel({ pixels, width: 1, height: 2 }, 0, 0), {
    r: 255,
    g: 0,
    b: 0,
    a: 255,
  });
  assert.deepEqual(samplePixel({ pixels, width: 1, height: 2 }, 0, 1), {
    r: 0,
    g: 0,
    b: 255,
    a: 255,
  });
});

test("samplePixel clamps out-of-range coordinates to edges", () => {
  const pixels = new Uint8Array([10, 20, 30, 255]);
  assert.deepEqual(samplePixel({ pixels, width: 1, height: 1 }, 5, 5), {
    r: 10,
    g: 20,
    b: 30,
    a: 255,
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './ascii'` (or import errors).

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/ascii.ts`:
```ts
// Pure image-to-TUI conversion functions. No DOM, no Canvas — these operate
// on flat RGBA pixel buffers so they stay unit-testable.

/** A flat RGBA pixel buffer (row-major), as produced by canvas getImageData. */
export interface PixelData {
  pixels: Uint8Array | Uint8ClampedArray | number[];
  width: number;
  height: number;
}

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export type AsciiMode = "ascii" | "block";

export interface AsciiOptions {
  mode: AsciiMode;
  color: boolean;
  targetWidth: number;
}

/** Rec.601 luminance, scaled by alpha so transparent pixels read dark. 0–255. */
export function luminance(r: number, g: number, b: number, a: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) * (a / 255);
}

/** Read the RGBA pixel at (x, y), clamping coordinates to image edges. */
export function samplePixel(data: PixelData, x: number, y: number): Rgba {
  const cx = Math.min(Math.max(Math.floor(x), 0), data.width - 1);
  const cy = Math.min(Math.max(Math.floor(y), 0), data.height - 1);
  const i = (cy * data.width + cx) * 4;
  return {
    r: data.pixels[i] ?? 0,
    g: data.pixels[i + 1] ?? 0,
    b: data.pixels[i + 2] ?? 0,
    a: data.pixels[i + 3] ?? 0,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ascii.ts src/lib/ascii.test.ts
git commit -m "feat(ascii): add pixel types and luminance/sampling helpers"
```

---

## Task 3: ASCII-mode conversion (TDD)

**Files:**
- Modify: `src/lib/ascii.ts`
- Test: `src/lib/ascii.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/ascii.test.ts`:
```ts
import { convertImage } from "./ascii";

// Helper: build a PixelData of solid color, width x height.
function solid(w: number, h: number, r: number, g: number, b: number) {
  const pixels = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    pixels[i * 4] = r;
    pixels[i * 4 + 1] = g;
    pixels[i * 4 + 2] = b;
    pixels[i * 4 + 3] = 255;
  }
  return { pixels, width: w, height: h };
}

test("ASCII mode: solid black yields all spaces (darkest ramp char)", () => {
  const out = convertImage(solid(4, 4, 0, 0, 0), {
    mode: "ascii",
    color: false,
    targetWidth: 4,
  });
  // Every line is 4 spaces.
  for (const line of out.split("\n")) {
    assert.equal(line, "    ");
  }
});

test("ASCII mode: solid white yields all '@' (brightest ramp char)", () => {
  const out = convertImage(solid(4, 4, 255, 255, 255), {
    mode: "ascii",
    color: false,
    targetWidth: 4,
  });
  for (const line of out.split("\n")) {
    assert.equal(line, "@@@@");
  }
});

test("ASCII mode: output width matches targetWidth", () => {
  const out = convertImage(solid(20, 10, 128, 128, 128), {
    mode: "ascii",
    color: false,
    targetWidth: 10,
  });
  const lines = out.split("\n");
  assert.ok(lines.length > 0);
  for (const line of lines) {
    assert.equal(line.length, 10);
  }
});

test("ASCII mode with color: output contains ANSI foreground sequence", () => {
  const out = convertImage(solid(2, 2, 255, 0, 0), {
    mode: "ascii",
    color: true,
    targetWidth: 2,
  });
  // \x1b[38;2;255;0;0m
  assert.ok(out.includes("\x1b[38;2;255;0;0m"), "expected red foreground ANSI");
  assert.ok(out.includes("\x1b[0m"), "expected reset sequence");
});

test("ASCII mode without color: no ANSI escape sequences", () => {
  const out = convertImage(solid(2, 2, 255, 0, 0), {
    mode: "ascii",
    color: false,
    targetWidth: 2,
  });
  assert.ok(!out.includes("\x1b"), "no escape sequences expected");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `convertImage is not a function` (not yet exported).

- [ ] **Step 3: Write minimal implementation**

Append to `src/lib/ascii.ts`:
```ts
// Brightness ramp, dark -> light. 10 steps.
const RAMP = " .:-=+*#%@";

const ANSI = {
  reset: "\x1b[0m",
  fg: (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`,
  bg: (r: number, g: number, b: number) => `\x1b[48;2;${r};${g};${b}m`,
};

function rampChar(lum: number): string {
  const idx = Math.min(
    RAMP.length - 1,
    Math.max(0, Math.floor((lum / 255) * RAMP.length)),
  );
  return RAMP[idx];
}

function convertAscii(data: PixelData, options: AsciiOptions): string {
  const { targetWidth, color } = options;
  const colStep = data.width / targetWidth;
  // Glyph cells are ~2:1 tall, so sample rows half as densely.
  const rowStep = colStep * 2;
  const cols = targetWidth;
  const rows = Math.max(1, Math.floor(data.height / rowStep));

  const lines: string[] = [];
  for (let row = 0; row < rows; row++) {
    let line = "";
    for (let col = 0; col < cols; col++) {
      const px = samplePixel(data, col * colStep, row * rowStep);
      const lum = luminance(px.r, px.g, px.b, px.a);
      const ch = rampChar(lum);
      if (color) {
        line += ANSI.fg(px.r, px.g, px.b) + ch;
      } else {
        line += ch;
      }
    }
    if (color) line += ANSI.reset;
    lines.push(line);
  }
  return lines.join("\n");
}

// convertImage entry point is added in Task 5; for now export a temporary
// passthrough so these tests can run. (Replaced in Task 5.)
export function convertImage(data: PixelData, options: AsciiOptions): string {
  return convertAscii(data, options);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests including the new ASCII tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ascii.ts src/lib/ascii.test.ts
git commit -m "feat(ascii): add ASCII-mode luminance-to-character conversion"
```

---

## Task 4: Block-mode conversion (TDD)

**Files:**
- Modify: `src/lib/ascii.ts`
- Test: `src/lib/ascii.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/ascii.test.ts`:
```ts
test("block mode with color: emits half-block char with fg and bg ANSI", () => {
  // 2x2: top row red, bottom row blue. One output char pairs them.
  const pixels = new Uint8Array([
    255, 0, 0, 255, 255, 0, 0, 255,
    0, 0, 255, 255, 0, 0, 255, 255,
  ]);
  const out = convertImage(
    { pixels, width: 2, height: 2 },
    { mode: "block", color: true, targetWidth: 2 },
  );
  assert.ok(out.includes("▀"), "expected half-block glyph");
  assert.ok(out.includes("\x1b[38;2;255;0;0m"), "expected red foreground (top)");
  assert.ok(out.includes("\x1b[48;2;0;0;255m"), "expected blue background (bottom)");
});

test("block mode without color: solid black yields full blocks", () => {
  const out = convertImage(solid(2, 2, 0, 0, 0), {
    mode: "block",
    color: false,
    targetWidth: 2,
  });
  for (const line of out.split("\n")) {
    assert.equal(line, "██");
  }
});

test("block mode without color: solid white yields spaces (shade ramp brightest)", () => {
  const out = convertImage(solid(2, 2, 255, 255, 255), {
    mode: "block",
    color: false,
    targetWidth: 2,
  });
  for (const line of out.split("\n")) {
    assert.equal(line, "  ");
  }
});

test("block mode: two source rows collapse into one output row", () => {
  // 4 rows tall -> block mode pairs 2 rows each -> 2 output rows
  const out = convertImage(solid(2, 4, 128, 128, 128), {
    mode: "block",
    color: false,
    targetWidth: 2,
  });
  const lines = out.split("\n");
  assert.equal(lines.length, 2);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — block-mode tests fail because `convertImage` still routes everything to ASCII mode.

- [ ] **Step 3: Write minimal implementation**

Append the block converter and rewrite the `convertImage` entry point in `src/lib/ascii.ts`. First, add the shade ramp near the existing `RAMP` const:
```ts
// Shade ramp for colorless block mode, dark -> light.
const SHADE_RAMP = "█▓▒░ ";
```

Then append the block converter:
```ts
function convertBlock(data: PixelData, options: AsciiOptions): string {
  const { targetWidth, color } = options;
  const colStep = data.width / targetWidth;
  const cols = targetWidth;
  // Each output row pairs two source rows (half-block top + bottom).
  const pairs = Math.max(1, Math.floor(data.height / 2 / colStep));
  const rows = pairs;

  const lines: string[] = [];
  for (let row = 0; row < rows; row++) {
    let line = "";
    for (let col = 0; col < cols; col++) {
      const top = samplePixel(data, col * colStep, (row * 2) * colStep);
      const bottom = samplePixel(data, col * colStep, (row * 2 + 1) * colStep);
      if (color) {
        line +=
          ANSI.fg(top.r, top.g, top.b) +
          ANSI.bg(bottom.r, bottom.g, bottom.b) +
          "▀";
      } else {
        const lumTop = luminance(top.r, top.g, top.b, top.a);
        const lumBot = luminance(bottom.r, bottom.g, bottom.b, bottom.a);
        const avg = (lumTop + lumBot) / 2;
        const idx = Math.min(
          SHADE_RAMP.length - 1,
          Math.max(0, Math.floor((avg / 255) * SHADE_RAMP.length)),
        );
        line += SHADE_RAMP[idx];
      }
    }
    if (color) line += ANSI.reset;
    lines.push(line);
  }
  return lines.join("\n");
}
```

Then replace the temporary `convertImage` with the real entry point that dispatches on mode:
```ts
/** Convert a pixel buffer to a TUI-art string. Pure: no DOM, no side effects. */
export function convertImage(data: PixelData, options: AsciiOptions): string {
  const clampedWidth = Math.min(200, Math.max(20, options.targetWidth));
  const safeOptions: AsciiOptions = { ...options, targetWidth: clampedWidth };
  return options.mode === "block"
    ? convertBlock(data, safeOptions)
    : convertAscii(data, safeOptions);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests (luminance, sample, ASCII, block).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ascii.ts src/lib/ascii.test.ts
git commit -m "feat(ascii): add Unicode block-mode conversion and entry point"
```

---

## Task 5: ANSI-to-HTML parser (TDD)

The display component must show color. We render ANSI sequences as styled `<span>`s. This parser is pure and tested separately.

**Files:**
- Create: `src/lib/ansi.ts`
- Test: `src/lib/ansi.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/ansi.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { ansiToSpans } from "./ansi";

test("plain text yields a single unstyled span", () => {
  const spans = ansiToSpans("hello");
  assert.equal(spans.length, 1);
  assert.deepEqual(spans[0], { text: "hello", color: undefined, background: undefined });
});

test("foreground color sequence sets color", () => {
  const spans = ansiToSpans("\x1b[38;2;255;0;0mred\x1b[0m");
  assert.equal(spans.length, 1);
  assert.equal(spans[0].text, "red");
  assert.equal(spans[0].color, "rgb(255,0,0)");
});

test("background color sequence sets background", () => {
  const spans = ansiToSpans("\x1b[48;2;0;0;255m\x1b[38;2;255;255;255m▀\x1b[0m");
  assert.equal(spans.length, 1);
  assert.equal(spans[0].text, "▀");
  assert.equal(spans[0].color, "rgb(255,255,255)");
  assert.equal(spans[0].background, "rgb(0,0,255)");
});

test("mixed styled and unstyled segments", () => {
  const spans = ansiToSpans("a\x1b[38;2;0;255;0mb\x1b[0mc");
  assert.equal(spans.length, 3);
  assert.equal(spans[0].text, "a");
  assert.equal(spans[0].color, undefined);
  assert.equal(spans[1].text, "b");
  assert.equal(spans[1].color, "rgb(0,255,0)");
  assert.equal(spans[2].text, "c");
  assert.equal(spans[2].color, undefined);
});

test("newline-containing text preserves newlines in span text", () => {
  const spans = ansiToSpans("ab\ncd");
  assert.equal(spans[0].text, "ab\ncd");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './ansi'`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/ansi.ts`:
```ts
// Minimal, dependency-free parser for the small subset of ANSI sequences our
// converter emits: 24-bit foreground (38;2;r;g;b), background (48;2;r;g;b),
// and reset (0). Everything else passes through as plain text.

export interface AnsiSpan {
  text: string;
  color?: string;
  background?: string;
}

const ESC = "\x1b";

export function ansiToSpans(input: string): AnsiSpan[] {
  const spans: AnsiSpan[] = [];
  let color: string | undefined;
  let background: string | undefined;
  let buffer = "";

  const flush = () => {
    if (buffer.length > 0) {
      spans.push({ text: buffer, color, background });
      buffer = "";
    }
  };

  let i = 0;
  while (i < input.length) {
    if (input[i] === ESC && input[i + 1] === "[") {
      // Parse until 'm'.
      let j = i + 2;
      while (j < input.length && input[j] !== "m") j++;
      const params = input.slice(i + 2, j).split(";");
      const code = Number(params[0]);
      if (code === 38 && params[1] === "2") {
        flush();
        color = `rgb(${params[2]},${params[3]},${params[4]})`;
      } else if (code === 48 && params[1] === "2") {
        flush();
        background = `rgb(${params[2]},${params[3]},${params[4]})`;
      } else if (code === 0) {
        flush();
        color = undefined;
        background = undefined;
      }
      i = j + 1; // skip past 'm'
      continue;
    }
    buffer += input[i];
    i++;
  }
  flush();
  return spans;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all ansi tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ansi.ts src/lib/ansi.test.ts
git commit -m "feat(ascii): add ANSI-to-HTML span parser for colored display"
```

---

## Task 6: AsciiOutput display component

**Files:**
- Create: `src/components/AsciiOutput.tsx`

This is presentational: receives the converted `text` (with ANSI), renders it in a terminal panel, and provides copy + download actions.

- [ ] **Step 1: Create the component**

Create `src/components/AsciiOutput.tsx`:
```tsx
"use client";

import { useMemo, useState } from "react";
import { ansiToSpans } from "@/lib/ansi";

interface AsciiOutputProps {
  text: string;
  /** Optional source pixel dims, used only for the caption. */
  sourceLabel?: string;
}

export default function AsciiOutput({ text, sourceLabel }: AsciiOutputProps) {
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => text.split("\n"), [text]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (insecure context); degrade silently.
      setCopied(false);
    }
  }

  function handleDownload() {
    // Rasterize the rendered <pre> to a PNG via a canvas.
    const font = "12px monospace";
    const charWidth = 7.2;
    const lineHeight = 14;
    const cols = Math.max(...lines.map((l) => l.length), 1);
    const padding = 16;

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(cols * charWidth) + padding * 2;
    canvas.height = lines.length * lineHeight + padding * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = font;
    ctx.textBaseline = "top";

    lines.forEach((line, y) => {
      const spans = ansiToSpans(line);
      let x = padding;
      for (const span of spans) {
        if (span.background) {
          ctx.fillStyle = span.background;
          ctx.fillRect(x, y * lineHeight + padding, span.text.length * charWidth, lineHeight);
        }
        ctx.fillStyle = span.color ?? "#FEFEFE";
        ctx.fillText(span.text, x, y * lineHeight + padding);
        x += span.text.length * charWidth;
      }
    });

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "ascii-art.png";
    link.click();
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#6BCB77]/40 bg-[#08140f] shadow-[0_0_36px_rgba(107,203,119,0.16)]">
      <div className="flex items-center justify-between border-b border-[#6BCB77]/30 bg-[#102018] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#FF6B9D]" />
          <span className="h-3 w-3 rounded-full bg-[#FFD93D]" />
          <span className="h-3 w-3 rounded-full bg-[#6BCB77]" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6BCB77]">
          {sourceLabel ?? "output"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full bg-[#6BCB77]/15 px-3 py-1 text-xs font-bold text-[#6BCB77] transition hover:bg-[#6BCB77]/30 cursor-pointer"
          >
            {copied ? "복사됨!" : "복사"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-full bg-[#FFD93D]/15 px-3 py-1 text-xs font-bold text-[#FFD93D] transition hover:bg-[#FFD93D]/30 cursor-pointer"
          >
            PNG
          </button>
        </div>
      </div>
      <pre
        className="overflow-auto px-4 py-4 font-mono text-[12px] leading-[14px] text-[#FEFEFE]/90"
        style={{ whiteSpace: "pre" }}
      >
        {lines.map((line, i) => (
          <div key={i}>
            {ansiToSpans(line).map((span, j) => (
              <span
                key={j}
                style={{
                  color: span.color,
                  backgroundColor: span.background,
                }}
              >
                {span.text}
              </span>
            ))}
          </div>
        ))}
      </pre>
    </section>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run lint`
Expected: no errors for the new file. (Fix any TypeScript errors.)

- [ ] **Step 3: Commit**

```bash
git add src/components/AsciiOutput.tsx
git commit -m "feat(ascii): add AsciiOutput display component with copy/download"
```

---

## Task 7: /ascii page — upload + canvas + conversion

**Files:**
- Create: `src/app/ascii/page.tsx`

This task builds the page with file upload (drag-drop + picker) and the conversion pipeline. Webcam is added in Task 8.

- [ ] **Step 1: Create the page**

Create `src/app/ascii/page.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import AsciiOutput from "@/components/AsciiOutput";
import { convertImage, type AsciiMode, type PixelData } from "@/lib/ascii";

const MAX_DIM = 320; // clamp source before reading pixels, to bound memory

export default function AsciiPage() {
  const [mode, setMode] = useState<AsciiMode>("block");
  const [color, setColor] = useState(true);
  const [targetWidth, setTargetWidth] = useState(80);
  const [output, setOutput] = useState<string>("");
  const [sourceLabel, setSourceLabel] = useState<string | undefined>();
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Read an image element into clamped pixel data, run conversion, set output.
  const renderFromImage = useCallback(
    (img: HTMLImageElement, label: string) => {
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);

      const pixelData: PixelData = { pixels: data, width: w, height: h };
      setOutput(convertImage(pixelData, { mode, color, targetWidth }));
      setSourceLabel(`${label} · ${w}×${h}`);
    },
    [mode, color, targetWidth],
  );

  // Re-convert whenever options change and we have a source image.
  useEffect(() => {
    if (imageRef.current) {
      renderFromImage(imageRef.current, sourceLabel?.split(" · ")[0] ?? "image");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, color, targetWidth]);

  function loadImageFile(file: File) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      renderFromImage(img, file.name);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadImageFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) loadImageFile(file);
  }

  return (
    <div className="min-h-screen bg-[#1A0A2E] text-[#FEFEFE]">
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/shop"
            className="rounded-full bg-[#FF6B9D]/15 px-4 py-2 text-sm font-bold text-[#FF6B9D] transition hover:scale-105"
          >
            ← Shop
          </Link>
        </div>
        <header className="mb-8 text-center">
          <h1
            className="text-5xl font-black leading-none md:text-7xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#FF6B9D",
              textShadow:
                "0 0 20px rgba(255,107,157,0.5), 3px 3px 0px #FFD93D",
            }}
          >
            ASCII OVEN
          </h1>
          <p
            className="mt-3 text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            사진을 터미널 아트로 굽기 🍩
          </p>
        </header>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          <div className="flex gap-2">
            {(["ascii", "block"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-full px-5 py-2 text-sm font-bold transition cursor-pointer ${
                  mode === m
                    ? "bg-white text-black"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {m === "ascii" ? "ASCII" : "블록"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setColor((c) => !c)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition cursor-pointer ${
              color ? "bg-[#6BCB77] text-black" : "bg-white/10 text-white/70"
            }`}
          >
            {color ? "컬러 ON" : "흑백"}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/50">해상도</span>
            <input
              type="range"
              min={40}
              max={200}
              step={10}
              value={targetWidth}
              onChange={(e) => setTargetWidth(Number(e.target.value))}
              className="w-40 accent-[#FF6B9D]"
            />
            <span className="w-8 font-mono text-sm text-white/70">
              {targetWidth}
            </span>
          </div>
        </div>

        {/* Upload zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mb-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-10 transition ${
            isDragging
              ? "border-[#FF6B9D] bg-[#FF6B9D]/10"
              : "border-white/20 bg-white/5 hover:border-white/40"
          }`}
        >
          <p className="text-2xl">🍩</p>
          <p className="mt-2 font-bold text-[#FFD93D]">
            이미지를 드롭하거나 클릭해서 선택
          </p>
          <p className="mt-1 text-xs text-white/40">PNG · JPG · WebP · GIF</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Output */}
        {output ? (
          <AsciiOutput text={output} sourceLabel={sourceLabel} />
        ) : (
          <div className="rounded-lg border border-white/10 bg-black/30 py-16 text-center text-white/40">
            변환된 아트가 여기에 표시됩니다
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify it builds and lints**

Run: `npm run lint`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds (the page is a client component; it should compile cleanly).

- [ ] **Step 3: Commit**

```bash
git add src/app/ascii/page.tsx
git commit -m "feat(ascii): add /ascii page with upload and conversion pipeline"
```

---

## Task 8: Add webcam capture to the page

**Files:**
- Modify: `src/app/ascii/page.tsx`

Reuse the visualizer's permission state machine (`idle | requesting | granted | denied`) and inline messaging.

- [ ] **Step 1: Add webcam state and refs**

In `src/app/ascii/page.tsx`, add these imports and state. Replace the existing import line for hooks with:
```tsx
import { useCallback, useEffect, useRef, useState } from "react";
```
(no change needed if already present).

Add after the existing `useState` declarations:
```tsx
type MicStatus = "idle" | "requesting" | "granted" | "denied";
const [camStatus, setCamStatus] = useState<MicStatus>("idle");
const videoRef = useRef<HTMLVideoElement>(null);
const streamRef = useRef<MediaStream | null>(null);
```

- [ ] **Step 2: Add webcam start/stop/capture handlers**

Add these functions inside the component (before `return`):
```tsx
const startCam = useCallback(async () => {
  try {
    setCamStatus("requesting");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamStatus("denied");
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
    setCamStatus("granted");
  } catch {
    setCamStatus("denied");
  }
}, []);

const stopCam = useCallback(() => {
  streamRef.current?.getTracks().forEach((t) => t.stop());
  streamRef.current = null;
  setCamStatus("idle");
}, []);

function captureFrame() {
  const video = videoRef.current;
  if (!video || !video.videoWidth) return;
  // Build an HTMLImageElement-like draw via canvas capture is not needed; reuse
  // renderFromImage by drawing the video frame onto a temp image is overkill —
  // instead factor pixel reading to accept a canvas source. Simpler: read frame
  // directly into PixelData here.
  const scale = Math.min(1, MAX_DIM / Math.max(video.videoWidth, video.videoHeight));
  const w = Math.max(1, Math.round(video.videoWidth * scale));
  const h = Math.max(1, Math.round(video.videoHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  // Mirror horizontally for natural selfie feel.
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const pixelData: PixelData = { pixels: data, width: w, height: h };
  setOutput(convertImage(pixelData, { mode, color, targetWidth }));
  setSourceLabel(`webcam · ${w}×${h}`);
}

useEffect(() => {
  return () => stopCam();
}, [stopCam]);
```

Note: `captureFrame` reads `mode`/`color`/`targetWidth` from closure; that is fine because it is a click handler re-created each render.

- [ ] **Step 3: Add the webcam UI block**

Insert this JSX between the upload zone (`</div>` after the upload `<div>`) and the output section:
```tsx
{/* Webcam */}
<div className="mb-6 flex flex-col items-center gap-3">
  {camStatus !== "granted" ? (
    <button
      type="button"
      onClick={startCam}
      className="rounded-full bg-gradient-to-r from-[#6BCB77] to-[#00ccff] px-6 py-2 font-bold text-black transition hover:opacity-90 active:scale-95 cursor-pointer"
    >
      📷 웹캠 시작
    </button>
  ) : (
    <div className="flex flex-col items-center gap-3">
      <video
        ref={videoRef}
        playsInline
        muted
        className="max-h-56 rounded-lg border border-white/20"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={captureFrame}
          className="rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#FF8C42] px-6 py-2 font-bold text-black transition hover:opacity-90 active:scale-95 cursor-pointer"
        >
          캡처
        </button>
        <button
          type="button"
          onClick={stopCam}
          className="rounded-full bg-white/10 px-6 py-2 font-bold text-white/70 transition hover:bg-white/20 cursor-pointer"
        >
          정지
        </button>
      </div>
    </div>
  )}
  {camStatus === "denied" && (
    <p className="max-w-md text-center text-sm text-[#FF6B9D]">
      웹캠 권한이 거부되었습니다. 주소창 자물쇠 아이콘 → 카메라 허용 후 새로고침하세요.
    </p>
  )}
</div>
```

- [ ] **Step 4: Verify it builds and lints**

Run: `npm run lint`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/ascii/page.tsx
git commit -m "feat(ascii): add webcam capture to /ascii page"
```

---

## Task 9: Link the demo from the shop

**Files:**
- Modify: `src/app/shop/page.tsx`

Add a discoverability link so the new demo is reachable. The shop page currently has a back-link header but no demo index; add a small link button near the top, matching the existing pink-pill style.

- [ ] **Step 1: Add the link**

In `src/app/shop/page.tsx`, in the header `<div className="flex items-center justify-between mb-8">`, the back-link is the first child. Add a sibling link after it (before the "OPEN 24/7" pill) wrapped so the row still uses `justify-between`. Concretely, replace:

```tsx
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all hover:scale-105"
              style={{
                background: "#FF6B9D20",
                color: "#FF6B9D",
                border: "1px solid #FF6B9D50",
              }}
            >
              ← Home
            </Link>
            <div
              className="px-4 py-2 rounded-full border border-dashed border-[#FFD93D] text-sm"
              style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
            >
              ⏰ OPEN 24/7
            </div>
          </div>
```

with:

```tsx
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all hover:scale-105"
                style={{
                  background: "#FF6B9D20",
                  color: "#FF6B9D",
                  border: "1px solid #FF6B9D50",
                }}
              >
                ← Home
              </Link>
              <Link
                href="/ascii"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all hover:scale-105"
                style={{
                  background: "#6BCB7720",
                  color: "#6BCB77",
                  border: "1px solid #6BCB7750",
                }}
              >
                ASCII Oven 🍩
              </Link>
            </div>
            <div
              className="px-4 py-2 rounded-full border border-dashed border-[#FFD93D] text-sm"
              style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
            >
              ⏰ OPEN 24/7
            </div>
          </div>
```

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/shop/page.tsx
git commit -m "feat(ascii): link ASCII Oven demo from the shop header"
```

---

## Task 10: Final verification

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass (luminance, sample, ascii, block, ansi parser).

- [ ] **Step 2: Run lint and build**

Run: `npm run lint`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds, `/ascii` route present.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`
Then in a browser open `http://localhost:3000/ascii` and verify:
1. Upload an image → colored block art appears, source label shows dimensions.
2. Toggle ASCII ↔ Block → output updates.
3. Toggle color off → grayscale, no ANSI in the rendered text.
4. Move the resolution slider → output width changes.
5. Click "복사" → "복사됨!" appears; paste into a plain text field → colored text if the target supports it.
6. Click "PNG" → a `ascii-art.png` downloads.
7. Click "📷 웹캠 시작", allow camera, click "캡처" → webcam frame converts.
8. Open `/shop` → the "ASCII Oven 🍩" link appears and navigates to `/ascii`.

- [ ] **Step 4: Final commit if anything was fixed during smoke test**

```bash
git add -A
git commit -m "chore(ascii): final smoke-test fixes"
```
(Only if there were changes; otherwise skip.)
