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

function convertBlock(data: PixelData, options: AsciiOptions): string {
  void data;
  void options;
  return ""; // implemented in a later task
}

/** Convert a pixel buffer to a TUI-art string. Pure: no DOM, no side effects. */
export function convertImage(data: PixelData, options: AsciiOptions): string {
  return options.mode === "block"
    ? convertBlock(data, options)
    : convertAscii(data, options);
}
