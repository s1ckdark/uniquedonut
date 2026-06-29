# ASCII Image Converter (`/ascii`) — Design

**Date:** 2026-06-29
**Status:** Approved (pending spec review)
**Route:** `/ascii`

## Goal

A new demo page that converts an uploaded or webcam-captured image into
terminal-style (TUI) art. Sits alongside `/visualizer` (audio → canvas) and
`/shop`'s `donutsh` shell as another browser-sandbox experiment in the Unique
Donut shop.

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Conversion output | ASCII art **and** Unicode block art, user-toggled |
| Input | File upload (drag-drop + file picker) **and** webcam capture |
| Output use | On-screen preview **plus** copy-to-clipboard **plus** image download |
| Implementation approach | Pure client-side Canvas — no libraries, no server |

## Non-goals (YAGNI)

- No server-side processing or route handlers — everything runs in the browser.
- No external npm dependencies for the conversion (no `ascii-art`, etc.).
- No clipboard-paste input (upload + webcam is the agreed scope).
- No persistent storage / gallery of converted images.
- No video-to-ASCII animation (single frame only). Webcam captures one frame.

## File Structure

```
src/app/ascii/page.tsx          # Client page: UI, state, canvas pixel reading
src/components/AsciiOutput.tsx  # Display-only: renders converted text + actions
src/lib/ascii.ts                # Pure conversion functions (testable, no DOM)
src/lib/ascii.test.ts           # Unit tests for the pure functions
```

Responsibility split:
- `src/lib/ascii.ts` — **pure**: takes pixel data, returns strings. No Canvas,
  no DOM, no React. This is what gets unit-tested.
- `src/app/ascii/page.tsx` — owns the `<canvas>`, reads `getImageData`, manages
  webcam/upload state, calls the pure functions, passes results down.
- `src/components/AsciiOutput.tsx` — presentational only. Given converted text,
  renders it in a terminal style and offers copy/download actions.

This matches the existing pattern where `WebShell` and the visualizer page each
own their canvas/interaction logic while staying self-contained.

## Conversion Logic (`src/lib/ascii.ts`)

All functions are pure: `(pixels, width, height, options) => string`.

### Inputs / types

```ts
type Rgba = { r: number; g: number; b: number; a: number }; // 0–255

// Flat pixel buffer from canvas getImageData (RGBA, row-major).
// We accept the raw Uint8ClampedArray + width + height rather than wrapping.

type AsciiMode = "ascii" | "block";
type AsciiOptions = {
  mode: AsciiMode;
  color: boolean;        // emit ANSI color sequences
  targetWidth: number;   // output columns; height derived for aspect ratio
};
```

### Luminance

Per-pixel luminance via the standard Rec.601 weights:

```
lum = 0.299*R + 0.587*G + 0.114*B
```

Alpha is treated as a multiplier on luminance so transparent pixels read dark.

### ASCII mode

- Brightness ramp string (dark → light): `" .:-=+*#%@"` (10 steps).
- Map `lum` (0–255) to an index into the ramp.
- **Sampling:** source pixels are roughly 1:1 in each axis, but glyph cells are
  taller than wide (≈2:1). To preserve aspect, sample the source with a
  vertical step of 2 and horizontal step of 1 (tuned against `targetWidth`).
- Output: one character per cell.

### Block mode

- Use Unicode half-blocks to double vertical resolution and look photographic:
  - `▀` top half foreground-colored, `▄` bottom half, `█` full, ` ` empty,
    plus shade chars `░▒▓` for mid-tones when color is off.
- Pair two vertically-adjacent source rows per output row. The upper row's
  color/alpha becomes the cell's foreground; the lower row's becomes background
  (via `\x1b[48;2;r;g;bm`). This is what makes block mode look like a real image.

### Color

- When `color: true`, wrap each glyph in 24-bit ANSI:
  - foreground `\x1b[38;2;R;G;Bm`, background `\x1b[48;2;R;G;Bm`, reset `\x1b[0m`.
- When `color: false`, pick the glyph purely from luminance and emit plain text.
- The same converted string is used for both display (parsed to HTML) and
  clipboard copy (raw ANSI), so terminal paste keeps colors.

### Aspect / resolution guard

- `targetWidth` is bounded to a sane range (e.g. 40–200 columns) to protect
  memory and layout. The page clamps the slider to this range.

## Page Component (`src/app/ascii/page.tsx`)

Structure mirrors `/visualizer`:

- **Header:** Bungee Shade title, Korean subtitle, `← Shop` back link.
- **Input panel:**
  - Drag-and-drop zone + file-picker button.
  - Webcam start/stop button with the same permission state machine the
    visualizer uses: `idle | requesting | granted | denied`, with matching
    inline messaging and guidance for the denied state.
  - On webcam, "capture" grabs one frame from the `<video>` to the canvas.
- **Controls:**
  - Mode toggle: ASCII ↔ Block.
  - Color toggle: on/off.
  - Resolution slider (columns), clamped to the guarded range.
- **Canvas:** offscreen `<canvas>` (or visually hidden) used to draw the image
  and call `getImageData`. For very large images, draw onto a clamped-size
  canvas before reading pixels.
- **Output:** renders `<AsciiOutput>` with the converted string.

Re-conversion runs whenever the image, mode, color, or resolution changes.

## Output Component (`src/components/AsciiOutput.tsx`)

Presentational, receives `text` (converted string) and an optional label.

- Renders inside a `pre` with a monospace font, dark terminal background,
  matching the `donutsh` terminal aesthetic (rounded border, traffic-light
  header, subtle green glow).
- Parses ANSI color sequences into styled `<span>`s for display. (A small,
  dependency-free parser; sequences we emit are limited to the 38;2 / 48;2 /
  reset forms above, so parsing stays tiny.)
- Actions row:
  - **Copy** — copies the raw (ANSI) text to clipboard via
    `navigator.clipboard.writeText`. Shows a transient "Copied!" state.
  - **Download** — rasterizes the rendered output to PNG by drawing the `pre`
    text onto a canvas (or capturing the DOM) and triggering a download.

## Styling

Reuse Unique Donut tokens throughout — no new design language:
- Background `#1A0A2E` / terminal panel `#0a0a14` (from visualizer).
- Accents `#FF6B9D` (pink), `#FFD93D` (yellow), `#6BCB77` (green).
- Bungee Shade for the page title; monospace for the output.
- Buttons follow the visualizer's gradient-pill style.

## Error Handling

- **Webcam not available / denied:** reuse the visualizer's `denied` state with
  instructions (address-bar lock icon → allow → reload).
- **Image load failure:** friendly inline message, clear the canvas.
- **Oversized image:** clamp canvas read size; no crash on memory.
- **Clipboard unavailable:** the copy button degrades gracefully with a message
  rather than throwing.

## Testing

`src/lib/ascii.test.ts` covers the pure functions (no DOM needed):
- All-black pixels → darkest ramp char (` ` or `█` background depending on mode).
- All-white opaque pixels → brightest ramp char.
- Aspect sampling produces the expected output dimensions for a given
  `targetWidth`.
- `color: true` emits ANSI sequences; `color: false` emits none.
- Block mode pairs two rows per output line (half the input height in rows).

The project has **no test runner configured** today (`package.json` has no
`test` script and no test dependency). Since the conversion functions are pure
and dependency-free, we'll use Node's built-in `node:test` runner with `tsx`
for TypeScript execution — zero new runtime deps beyond `tsx` (devDependency),
no Vitest/Jest bundle. A `test` script will be added:

```json
"test": "node --test --import tsx src/lib/**/*.test.ts"
```

The pure functions are runner-agnostic, so this choice only affects invocation,
not the test code itself.
