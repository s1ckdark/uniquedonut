"use client";

import { useMemo, useState } from "react";
import { ansiToSpans } from "@/lib/ansi";

interface AsciiOutputProps {
  text: string;
  /** Optional caption, e.g. source dimensions. */
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
    // Rasterize the rendered text to a PNG via an offscreen canvas.
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
    ctx.font = "12px monospace";
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
