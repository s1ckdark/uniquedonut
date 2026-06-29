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
