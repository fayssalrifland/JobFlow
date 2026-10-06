"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Target } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DemoButton } from "@/components/marketing/demo-button";
import { CountUp, Magnetic } from "./landing-motion";

const HEADLINE = ["Take", "control", "of", "your", "job", "search."];

const STATS = [
  { value: 7, suffix: "", label: "pipeline stages" },
  { value: 10, suffix: "+", label: "live metrics" },
  { value: 30, suffix: "s", label: "to add a role" },
];

export function LandingHeroCopy() {
  const reduce = useReducedMotion();
  return (
    <div>
      <motion.span
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
      >
        <Target className="h-3.5 w-3.5 text-indigo-500" aria-hidden />
        Job search, organised
      </motion.span>

      <h1 className="mt-5 text-4xl font-semibold leading-[1.06] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] dark:text-white">
        {HEADLINE.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            className="inline-block"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 26, rotateX: -50 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.65, delay: 0.08 + i * 0.07, ease: [0.21, 0.65, 0.16, 1] }}
          >
            {word === "control" ? (
              <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                {word}
              </span>
            ) : (
              word
            )}
            {i < HEADLINE.length - 1 ? "\u00A0" : ""}
          </motion.span>
        ))}
      </h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        className="mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-300"
      >
        Track every application, nail every interview, and see what&apos;s actually working.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.68 }}
        className="mt-7 flex flex-wrap gap-3"
      >
        <Magnetic>
          <Link href="/register">
            <Button size="lg">
              Start Tracking <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Link>
        </Magnetic>
        <Magnetic>
          <DemoButton />
        </Magnetic>
      </motion.div>

      <motion.ul
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.85 }}
        className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400"
      >
        {["No credit card", "Demo included", "Dark mode"].map((item) => (
          <li key={item} className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
            {item}
          </li>
        ))}
      </motion.ul>

      <motion.dl
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="mt-7 grid max-w-md grid-cols-3 gap-4 border-t border-slate-200 pt-5 dark:border-slate-800"
      >
        {STATS.map((s) => (
          <div key={s.label}>
            <dt className="order-2 mt-1 text-xs text-slate-500 dark:text-slate-400">{s.label}</dt>
            <dd className="text-2xl font-bold text-slate-900 dark:text-white">
              <CountUp to={s.value} suffix={s.suffix} />
            </dd>
          </div>
        ))}
      </motion.dl>
    </div>
  );
}
