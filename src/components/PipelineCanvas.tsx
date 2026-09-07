"use client";

import { useEffect, useRef } from "react";
import {
  stages,
  positionOnSegment,
  updateParticles,
  makeParticle,
  nextSpawnDelayMs,
  MAX_PARTICLES,
  type Particle,
  type Point,
} from "@/lib/pipeline";

export interface PipelineLink {
  from: Point;
  to: Point;
}

export default function PipelineCanvas({
  links,
  playing,
}: {
  links: PipelineLink[];
  playing: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const spawnDelayRef = useRef<number>(nextSpawnDelayMs());
  const idRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const w = parent.offsetWidth * dpr;
      const h = parent.offsetHeight * dpr;
      // Assigning canvas.width/height (even the same value) resets the
      // bitmap — only assign when the size actually changed so pausing
      // doesn't wipe the frozen frame.
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
    };
    resize();
    window.addEventListener("resize", resize);

    const render = (now: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.width;
      const H = canvas.height;

      if (lastTimeRef.current === 0) lastTimeRef.current = now;
      const dt = Math.min(100, now - lastTimeRef.current);
      lastTimeRef.current = now;

      // Spawn timer
      spawnTimerRef.current += dt;
      let spawn: Particle | null = null;
      if (spawnTimerRef.current >= spawnDelayRef.current) {
        spawnTimerRef.current = 0;
        spawnDelayRef.current = nextSpawnDelayMs();
        if (particlesRef.current.length < MAX_PARTICLES && links.length > 0) {
          spawn = makeParticle(idRef.current++);
        }
      }
      particlesRef.current = updateParticles(particlesRef.current, dt, spawn);

      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Faint connector curves
      ctx.lineWidth = 2;
      for (const link of links) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.beginPath();
        ctx.moveTo(link.from.x, link.from.y);
        for (let t = 0.05; t <= 1.0001; t += 0.05) {
          const p = positionOnSegment(link.from, link.to, t);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      // Glowing particles
      for (const p of particlesRef.current) {
        const link = links[p.segment];
        if (!link) continue;
        const pos = positionOnSegment(link.from, link.to, p.t);
        const color = stages[p.segment].color;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      rafRef.current = requestAnimationFrame(render);
    };

    if (playing) {
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [playing, links]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
