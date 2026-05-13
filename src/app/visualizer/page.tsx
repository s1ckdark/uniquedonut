"use client";

import { useRef, useState, useCallback, useEffect } from "react";

type VisualizerMode = "bars" | "wave" | "circular";

export default function VisualizerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(0));
  const timeArrayRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(0));

  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<VisualizerMode>("bars");
  const [sensitivity, setSensitivity] = useState(1.5);
  const [colorScheme, setColorScheme] = useState<"neon" | "ocean" | "fire" | "rainbow">("neon");
  const [micStatus, setMicStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");

  const colorMap = {
    neon: ["#00ff88", "#00ccff", "#ff00ff", "#ffff00"],
    ocean: ["#0077b6", "#00b4d8", "#48cae4", "#90e0ef"],
    fire: ["#ff0000", "#ff4500", "#ff8c00", "#ffd700"],
    rainbow: ["#ff0000", "#ff8800", "#ffff00", "#00ff00", "#0088ff", "#8800ff"],
  };

  const startMic = useCallback(async () => {
    try {
      setMicStatus("requesting");

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicStatus("denied");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      timeArrayRef.current = new Uint8Array(bufferLength);

      setMicStatus("granted");
      setIsActive(true);
    } catch (err: unknown) {
      console.error("Mic error:", err);
      setMicStatus("denied");
    }
  }, []);

  const stopMic = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close();
    analyserRef.current = null;
    setIsActive(false);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;
    const dataArray = dataArrayRef.current;
    const timeArray = timeArrayRef.current;
    const colors = colorMap[colorScheme];

    analyser.getByteFrequencyData(dataArray);
    analyser.getByteTimeDomainData(timeArray);

    // clear
    ctx.fillStyle = "rgba(10, 10, 20, 0.15)";
    ctx.fillRect(0, 0, W, H);

    if (mode === "bars") {
      const barCount = 80;
      const step = Math.floor(dataArray.length / barCount);
      const barWidth = W / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * step] / 255;
        const barH = val * H * sensitivity * 0.8;
        const x = i * (barWidth + 2);
        const colorIdx = Math.floor((i / barCount) * colors.length);
        const color = colors[Math.min(colorIdx, colors.length - 1)];

        // glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;

        // gradient bar
        const grad = ctx.createLinearGradient(x, H, x, H - barH);
        grad.addColorStop(0, color);
        grad.addColorStop(1, color + "44");
        ctx.fillStyle = grad;
        ctx.fillRect(x, H - barH, barWidth, barH);

        // mirror (top)
        const mirrorGrad = ctx.createLinearGradient(x, 0, x, barH * 0.3);
        mirrorGrad.addColorStop(0, color + "00");
        mirrorGrad.addColorStop(1, color + "33");
        ctx.fillStyle = mirrorGrad;
        ctx.fillRect(x, 0, barWidth, barH * 0.3);

        ctx.shadowBlur = 0;
      }
    } else if (mode === "wave") {
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;

      for (let line = 0; line < 3; line++) {
        const colorIdx = line % colors.length;
        ctx.strokeStyle = colors[colorIdx];
        ctx.shadowColor = colors[colorIdx];
        ctx.globalAlpha = 0.8 - line * 0.2;
        ctx.beginPath();

        const sliceWidth = W / timeArray.length;
        let x = 0;
        for (let i = 0; i < timeArray.length; i++) {
          const v = (timeArray[i] / 128.0 - 1) * sensitivity * (1 + line * 0.3);
          const y = H / 2 + v * (H / 2);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    } else if (mode === "circular") {
      const cx = W / 2;
      const cy = H / 2;
      const baseRadius = Math.min(W, H) * 0.2;
      const maxRadius = Math.min(W, H) * 0.45;

      // draw circular bars
      const barCount = 120;
      const step = Math.floor(dataArray.length / barCount);

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * step] / 255;
        const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
        const r = baseRadius + val * (maxRadius - baseRadius) * sensitivity;
        const colorIdx = Math.floor((i / barCount) * colors.length);
        const color = colors[Math.min(colorIdx, colors.length - 1)];

        const x1 = cx + Math.cos(angle) * baseRadius;
        const y1 = cy + Math.sin(angle) * baseRadius;
        const x2 = cx + Math.cos(angle) * r;
        const y2 = cy + Math.sin(angle) * r;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.lineWidth = 2.5;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // center circle
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius - 5, 0, Math.PI * 2);
      ctx.strokeStyle = colors[0];
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = colors[0];
      ctx.stroke();
      ctx.shadowBlur = 0;

      // center text
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const db = Math.round(avg);
      ctx.fillStyle = colors[0];
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${db}`, cx, cy);
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [mode, sensitivity, colorScheme]);

  useEffect(() => {
    if (isActive) {
      animationRef.current = requestAnimationFrame(draw);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    return () => {
      stopMic();
    };
  }, [stopMic]);

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex flex-col items-center">
      {/* Header */}
      <header className="w-full py-6 px-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent">
          Audio Visualizer
        </h1>
        <p className="text-gray-400 mt-2 text-sm">마이크 소리를 실시간으로 시각화합니다</p>
      </header>

      {/* Canvas */}
      <div className="w-full max-w-5xl px-4 flex-1">
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-2xl aspect-video">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ imageRendering: "auto" }}
          />
          {!isActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              {micStatus === "idle" && (
                <>
                  <div className="w-20 h-20 rounded-full border-2 border-white/20 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 7h2v-2.06c2.84-.48 5-2.94 5-5.94h-2c0 2.21-1.79 4-4 4s-4-1.79-4-4H6c0 3 2.16 5.52 5 5.94V21z" />
                    </svg>
                  </div>
                  <p className="text-white/50 text-lg">아래 버튼을 눌러 마이크를 활성화하세요</p>
                </>
              )}
              {micStatus === "requesting" && (
                <>
                  <div className="w-20 h-20 rounded-full border-2 border-cyan-400/50 flex items-center justify-center mb-4 animate-pulse">
                    <svg className="w-10 h-10 text-cyan-400 animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 7h2v-2.06c2.84-.48 5-2.94 5-5.94h-2c0 2.21-1.79 4-4 4s-4-1.79-4-4H6c0 3 2.16 5.52 5 5.94V21z" />
                    </svg>
                  </div>
                  <p className="text-cyan-400 text-lg animate-pulse">마이크 권한을 요청하고 있습니다...</p>
                  <p className="text-white/30 text-sm mt-2">브라우저에서 마이크 접근을 허용해주세요</p>
                </>
              )}
              {micStatus === "denied" && (
                <>
                  <div className="w-20 h-20 rounded-full border-2 border-red-400/50 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                    </svg>
                  </div>
                  <p className="text-red-400 text-lg">마이크 권한이 거부되었습니다</p>
                  <p className="text-white/40 text-sm mt-2">
                    브라우저 주소창의 자물쇠 아이콘을 클릭하고
                    <br />
                    마이크 권한을 "허용"으로 변경한 후 새로고침하세요
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-5xl px-4 py-6 space-y-4">
        {/* Main button */}
        <div className="flex justify-center">
          {!isActive ? (
            <button
              onClick={startMic}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-green-500 to-cyan-500 text-white font-semibold text-lg hover:opacity-90 transition-all shadow-lg shadow-green-500/25 active:scale-95 cursor-pointer"
            >
              마이크 시작
            </button>
          ) : (
            <button
              onClick={stopMic}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold text-lg hover:opacity-90 transition-all shadow-lg shadow-red-500/25 active:scale-95 cursor-pointer"
            >
              정지
            </button>
          )}
        </div>

        {/* Mode selector */}
        <div className="flex justify-center gap-2 flex-wrap">
          {(["bars", "wave", "circular"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                mode === m
                  ? "bg-white text-black shadow-lg"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {m === "bars" ? "바 차트" : m === "wave" ? "파형" : "원형"}
            </button>
          ))}
        </div>

        {/* Color scheme */}
        <div className="flex justify-center gap-2 flex-wrap">
          {(["neon", "ocean", "fire", "rainbow"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setColorScheme(c)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                colorScheme === c
                  ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a14]"
                  : "opacity-60 hover:opacity-100"
              }`}
              style={{
                background:
                  c === "neon"
                    ? "linear-gradient(135deg, #00ff88, #00ccff, #ff00ff)"
                    : c === "ocean"
                    ? "linear-gradient(135deg, #0077b6, #00b4d8, #90e0ef)"
                    : c === "fire"
                    ? "linear-gradient(135deg, #ff0000, #ff4500, #ffd700)"
                    : "linear-gradient(135deg, #ff0000, #00ff00, #0000ff, #8800ff)",
                color: "white",
              }}
            >
              {c === "neon" ? "네온" : c === "ocean" ? "바다" : c === "fire" ? "불꽃" : "무지개"}
            </button>
          ))}
        </div>

        {/* Sensitivity slider */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-white/50 text-sm">감도</span>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={sensitivity}
            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
            className="w-48 accent-cyan-400"
          />
          <span className="text-white/70 text-sm font-mono w-8">{sensitivity.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}
