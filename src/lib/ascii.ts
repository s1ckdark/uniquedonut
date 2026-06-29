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
