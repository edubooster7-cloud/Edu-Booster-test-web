"use client";

import { SLIDES } from "@/constants";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const AUTOPLAY_MS = 10000;

export function AuthCarousel() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const goTo = (index: number, dir: "next" | "prev" = "next") => {
    if (animating || index === current) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 420);
  };

  // Autoplay
  useEffect(() => {
    const id = setInterval(() => {
      goTo((current + 1) % SLIDES.length, "next");
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [current, animating]);

  const slide = SLIDES[current];

  return (
    <div className="relative hidden lg:flex flex-col h-full overflow-hidden bg-zinc-950">
      {/* ── Background image layer ── */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          animating ? "opacity-0" : "opacity-100",
        )}
      >
        <img
          key={current}
          src={slide.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30 dark:opacity-20 scale-105"
          style={{
            filter: "grayscale(30%) contrast(1.1)",
          }}
        />
      </div>

      {/* ── Decorative grid lines ── */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* ── Top logo area ── */}
      <div className="relative z-10 p-10">
        <div className="size-9 rounded-lg bg-white/10 ring-1 ring-white/20 flex items-center justify-center">
          <div className="size-4 rounded-sm bg-white/80" />
        </div>
      </div>

      {/* ── Content block ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-10 pb-12">
        {/* Tag */}
        <div
          className={cn(
            "mb-5 inline-flex items-center gap-2 transition-all duration-500 ease-out",
            animating
              ? direction === "next"
                ? "-translate-y-3 opacity-0"
                : "translate-y-3 opacity-0"
              : "translate-y-0 opacity-100",
          )}
        >
          <span className="size-1.5 rounded-full bg-primary" />
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/50">
            {slide.tag}
          </span>
        </div>

        {/* Headline */}
        <h2
          className={cn(
            "mb-4 text-4xl font-bold leading-[1.12] tracking-tight text-white whitespace-pre-line",
            "transition-all duration-500 ease-out delay-[60ms]",
            animating
              ? direction === "next"
                ? "-translate-y-4 opacity-0"
                : "translate-y-4 opacity-0"
              : "translate-y-0 opacity-100",
          )}
          style={{ fontFamily: "'Georgia', serif" }}
        >
          {slide.headline}
        </h2>

        {/* Body */}
        <p
          className={cn(
            "mb-10 max-w-85 text-sm leading-relaxed text-white/50",
            "transition-all duration-500 ease-out delay-[110ms]",
            animating
              ? direction === "next"
                ? "-translate-y-4 opacity-0"
                : "translate-y-4 opacity-0"
              : "translate-y-0 opacity-100",
          )}
        >
          {slide.body}
        </p>

        {/* Dot navigation */}
        <div className="flex items-center gap-3">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? "next" : "prev")}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                i === current
                  ? "w-6 h-1.5 bg-white"
                  : "size-1.5 bg-white/25 hover:bg-white/50",
              )}
            />
          ))}

          {/* Progress bar */}
          <div className="ml-auto flex items-center gap-1.5 text-[0.7rem] text-white/30 tabular-nums">
            <span className="text-white/70 font-medium">{current + 1}</span>
            <span>/</span>
            <span>{SLIDES.length}</span>
          </div>
        </div>

        {/* Auto-progress line */}
        <div className="mt-4 h-px w-full bg-white/10 overflow-hidden rounded-full">
          <div
            key={current}
            className="h-full bg-white/40 rounded-full"
            style={{
              animation: `grow ${AUTOPLAY_MS}ms linear forwards`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes grow {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  );
}
