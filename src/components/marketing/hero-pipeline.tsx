"use client";

import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { BellRing, CalendarCheck2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "APPLIED", label: "Applied", dot: "bg-slate-400", ring: "ring-slate-300" },
  { key: "INTERVIEW", label: "Interview", dot: "bg-indigo-500", ring: "ring-indigo-300" },
  { key: "OFFER", label: "Offer", dot: "bg-amber-500", ring: "ring-amber-300" },
] as const;

const GHOST_CARDS = [
  { company: "Acme", role: "Frontend Dev" },
  { company: "Nimbus", role: "React Engineer" },
  { company: "Helios", role: "UI Engineer" },
  { company: "Kite", role: "Product Engineer" },
];

function FeaturedCard({ compact = false }: { compact?: boolean }) {
  return (
    <motion.div
      layoutId="hero-featured-card"
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className={cn(
        "rounded-xl border border-indigo-200 bg-white p-3 shadow-lg shadow-indigo-500/10 dark:border-indigo-500/40 dark:bg-slate-900",
        compact && "p-2.5",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white">
          MC
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
            Maya Chen · Frontend
          </p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">Lumen · €72–88k</p>
        </div>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-pulse-ring absolute inset-0 rounded-full bg-emerald-400" />
            <span className="relative rounded-full bg-emerald-500 h-1.5 w-1.5" />
          </span>
          Live
        </span>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
          initial={{ width: "12%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 6.6, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}

export function HeroPipeline() {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [paused, setPaused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Auto-play the card through the pipeline
  useEffect(() => {
    if (reduce || paused) return;
    const id = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 2200);
    return () => clearInterval(id);
  }, [reduce, paused]);

  // Scroll parallax: gently lift + fade the visual as you scroll past
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start start", "end start"] });
  const scrollY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const scrollScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.35]);

  return (
    <motion.div
      ref={wrapRef}
      style={reduce ? undefined : { y: scrollY, scale: scrollScale, opacity: scrollOpacity }}
      className="perspective-1200 relative"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.25, ease: [0.21, 0.65, 0.16, 1] }}
    >
      {/* Glow behind */}
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-emerald-400/10 blur-2xl"
      />

      <motion.div
        animate={reduce ? undefined : { rotateX: tilt.y, rotateY: tilt.x }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
        onMouseMove={(e) => {
          if (reduce) return;
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          setTilt({
            x: ((e.clientX - rect.left) / rect.width - 0.5) * 10,
            y: -((e.clientY - rect.top) / rect.height - 0.5) * 8,
          });
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => {
          setPaused(false);
          setTilt({ x: 0, y: 0 });
        }}
        className="preserve-3d rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" aria-hidden />
            Your pipeline · live
          </p>
          <div className="flex gap-1.5" aria-hidden>
            {STAGES.map((s, i) => (
              <span
                key={s.key}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === stage ? "w-6 bg-indigo-500" : "w-1.5 bg-slate-200 dark:bg-slate-700",
                )}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5" role="group" aria-label="Pipeline preview stages">
          {STAGES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStage(i)}
              className={cn(
                "rounded-xl border p-2 text-left transition-colors",
                i === stage
                  ? "border-indigo-200 bg-indigo-50/60 dark:border-indigo-500/40 dark:bg-indigo-950/30"
                  : "border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/30",
              )}
            >
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />
                {s.label}
              </span>
              <div className="mt-2 min-h-[104px] space-y-2">
                <AnimatePresence mode="popLayout">
                  {stage === i && <FeaturedCard key="featured" compact />}
                </AnimatePresence>
                {GHOST_CARDS.slice(i, i + 1).map((g) => (
                  <div
                    key={g.company}
                    className="rounded-lg border border-slate-200 bg-white p-2 opacity-70 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <div className="h-2 w-10 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-1.5 h-2 w-full rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        <p className="mt-2.5 text-center text-[11px] text-slate-400">
          Click a stage to move Maya — drag & drop works the same inside the app
        </p>
      </motion.div>

      {/* Floating notification pills */}
      <motion.div
        aria-hidden
        className="animate-float-soft absolute -left-3 top-16 hidden items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur sm:flex dark:border-slate-700 dark:bg-slate-900/95"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
          <CalendarCheck2 className="h-3.5 w-3.5" />
        </span>
        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
          Interview Tue · 10:00
        </span>
      </motion.div>

      <motion.div
        aria-hidden
        className="animate-float-soft-delayed absolute -right-3 bottom-14 hidden items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur sm:flex dark:border-slate-700 dark:bg-slate-900/95"
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1, duration: 0.6 }}
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
          <BellRing className="h-3.5 w-3.5" />
        </span>
        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
          Follow up with Lumen
        </span>
      </motion.div>
    </motion.div>
  );
}
