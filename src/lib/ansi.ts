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
