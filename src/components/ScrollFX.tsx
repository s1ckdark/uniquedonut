"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Fires once when the element scrolls into view. */
function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/** Fade-and-rise wrapper triggered on scroll. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out will-change-transform ${
        inView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Horizontal bar that grows from 0 to `pct`% when scrolled into view. */
export function GrowBar({
  pct,
  color,
  trackClass = "bg-white/10",
  heightClass = "h-6",
  delay = 0,
  label,
  valueLabel,
}: {
  pct: number;
  color: string;
  trackClass?: string;
  heightClass?: string;
  delay?: number;
  label?: string;
  valueLabel?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const width = Math.max(0, Math.min(100, pct));
  return (
    <div ref={ref}>
      {(label || valueLabel) && (
        <div className="mb-1 flex items-baseline justify-between text-sm">
          <span className="font-bold text-white/80">{label}</span>
          <span className="font-mono text-white/50">{valueLabel}</span>
        </div>
      )}
      <div className={`overflow-hidden rounded-full ${trackClass} ${heightClass}`}>
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-out`}
          style={{
            width: inView ? `${width}%` : "0%",
            background: `linear-gradient(90deg, ${color}, ${color}B0)`,
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

/** Number that counts up from 0 when scrolled into view. */
export function CountUp({
  to,
  durationMs = 1200,
  format,
  className = "",
}: {
  to: number;
  durationMs?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.5);
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / durationMs);
      // ease-out cubic for a snappy settle
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(to * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, durationMs]);
  const shown = format ? format(value) : Math.round(value).toLocaleString("ko-KR");
  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  );
}
