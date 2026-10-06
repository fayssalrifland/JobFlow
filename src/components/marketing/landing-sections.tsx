"use client";

import { AnimatePresence, motion, useReducedMotion, useScroll } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileText,
  MousePointerClick,
  Search,
  SquareKanban,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DemoButton } from "@/components/marketing/demo-button";
import { cn } from "@/lib/utils";
import { CountUp, Magnetic, Reveal, SectionHeading, SpotlightCard, Stagger, StaggerItem } from "./landing-motion";

/* ------------------------------------------------------------------ */
/* Logo / trust marquee                                                */
/* ------------------------------------------------------------------ */
const MARQUEE_COMPANIES = [
  "Spotify", "Stripe", "Figma", "Notion", "Linear", "Shopify",
  "Airbnb", "Duolingo", "Intercom", "Zalando", "Miro", "Typeform",
];

export function LogoMarquee() {
  const row = [...MARQUEE_COMPANIES, ...MARQUEE_COMPANIES];
  return (
    <div className="marquee-paused overflow-hidden border-y border-slate-200/70 bg-white/60 py-5 dark:border-slate-800 dark:bg-slate-950/60">
      <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        Built for applications at companies like these
      </p>
      <div className="relative">
        <div className="animate-marquee flex w-max items-center gap-10 pr-10" aria-hidden>
          {row.map((name, i) => (
            <span key={`${name}-${i}`} className="whitespace-nowrap text-lg font-semibold text-slate-300 dark:text-slate-600">
              {name}
            </span>
          ))}
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent dark:from-slate-950" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent dark:from-slate-950" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* How it works — scroll-linked progress line                          */
/* ------------------------------------------------------------------ */
const STEPS = [
  { title: "Add it in 30 seconds", body: "Role, salary, source, contact, CV. Just the essentials." },
  { title: "Drag it forward", body: "Move cards as replies land. Every step is recorded." },
  { title: "See what works", body: "Which sources convert, where you stall, what to fix." },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.75", "end 0.45"] });
  const reduce = useReducedMotion();

  return (
    <div ref={ref} className="relative">
      {/* Progress rail (desktop) */}
      <div aria-hidden className="absolute left-0 right-0 top-5 hidden md:block">
        <div className="h-0.5 rounded-full bg-slate-200 dark:bg-slate-800" />
        <motion.div
          style={reduce ? undefined : { scaleX: scrollYProgress }}
          className="h-0.5 origin-left -mt-0.5 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400"
        />
      </div>
      <Stagger className="relative grid gap-4 md:grid-cols-3" gap={0.14}>
        {STEPS.map((step, i) => (
          <StaggerItem key={step.title}>
            <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <span className="relative z-10 grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-base font-bold text-white shadow-lg shadow-indigo-500/25">
                {i + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{step.body}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Features bento                                                      */
/* ------------------------------------------------------------------ */
const FEATURES = [
  { icon: SquareKanban, title: "Kanban pipeline", body: "Drag cards through every stage. Keyboard-friendly too.", large: true },
  { icon: BarChart3, title: "Real analytics", body: "Response rate, funnel, time-in-stage — from your data.", large: true },
  { icon: CalendarDays, title: "Interviews", body: "Rounds, links & agenda in one view.", large: false },
  { icon: Bell, title: "Reminders", body: "Never miss a follow-up again.", large: false },
  { icon: FileText, title: "CV versions", body: "Know which CV got the interview.", large: false },
  { icon: Search, title: "Instant search", body: "Find any application in milliseconds.", large: false },
];

export function FeaturesBento() {
  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" gap={0.08}>
      {FEATURES.map((f) => (
        <StaggerItem key={f.title} className={cn(f.large && "sm:col-span-2")}>
          <SpotlightCard className="h-full rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
              <f.icon className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{f.body}</p>
          </SpotlightCard>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

/* ------------------------------------------------------------------ */
/* Analytics showcase — bars + ring animate on scroll                  */
/* ------------------------------------------------------------------ */
const FUNNEL = [
  { label: "Applied", value: 100 },
  { label: "Screening", value: 46 },
  { label: "Interview", value: 29 },
  { label: "Tech test", value: 17 },
  { label: "Offer", value: 8 },
];

function AnimatedRing({ value }: { value: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center">
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`Response rate ${value} percent`}>
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-slate-100 dark:stroke-slate-800" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          stroke="url(#ringGrad)"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (c * value) / 100 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.6, ease: [0.21, 0.65, 0.16, 1] }}
          transform="rotate(-90 60 60)"
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold text-slate-900 dark:text-white">
          <CountUp to={value} suffix="%" />
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">response</p>
      </div>
    </div>
  );
}

export function AnalyticsShowcase() {
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-[1.2fr_1fr]">
      <Reveal className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Your funnel</p>
        <ul className="mt-4 space-y-3.5">
          {FUNNEL.map((row, i) => (
            <li key={row.label}>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{row.label}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  <CountUp to={row.value} suffix="%" />
                </span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${row.value}%` }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 1.1, delay: i * 0.12, ease: [0.21, 0.65, 0.16, 1] }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
      <div className="grid gap-4">
        <Reveal delay={0.1} className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <AnimatedRing value={32} />
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">32 of 100 applications got a reply</p>
        </Reveal>
        <Reveal delay={0.18} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white">
          <p className="text-3xl font-bold">
            <CountUp to={4.2} decimals={1} suffix=" days" />
          </p>
          <p className="mt-1 text-sm text-indigo-100">average time to first response</p>
        </Reveal>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Interactive playground — click through a mini pipeline              */
/* ------------------------------------------------------------------ */
const PLAY_STAGES = ["Applied", "Screening", "Interview", "Tech test", "Offer", "Accepted"] as const;

export function Playground() {
  const [stage, setStage] = useState(1);
  const reduce = useReducedMotion();
  return (
    <Reveal className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 p-6 sm:p-8 dark:border-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-300">
            <MousePointerClick className="h-3.5 w-3.5" aria-hidden /> Try it — no sign-up
          </p>
          <h3 className="mt-1 text-xl font-semibold text-white">Move an application forward</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setStage((s) => Math.max(0, s - 1))} disabled={stage === 0}>
            Back
          </Button>
          <Button size="sm" onClick={() => setStage((s) => Math.min(PLAY_STAGES.length - 1, s + 1))} disabled={stage === PLAY_STAGES.length - 1}>
            Move forward <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      </div>

      {/* Stage track */}
      <div className="mt-6 flex items-center gap-1.5" role="group" aria-label="Pipeline stages">
        {PLAY_STAGES.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStage(i)}
            className="group flex-1"
            aria-label={`Go to ${label}`}
            aria-current={i === stage ? "step" : undefined}
          >
            <div
              className={cn(
                "h-2 rounded-full transition-colors duration-300",
                i <= stage ? "bg-gradient-to-r from-indigo-400 to-emerald-400" : "bg-slate-700 group-hover:bg-slate-600",
              )}
            />
            <p className={cn("mt-1.5 hidden text-[11px] sm:block", i === stage ? "font-semibold text-white" : "text-slate-400")}>
              {label}
            </p>
          </button>
        ))}
      </div>

      {/* Moving card */}
      <div className="mt-5 rounded-xl bg-slate-800/80 p-4">
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: -32 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="flex flex-1 items-center gap-3"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-sm font-bold text-white">
                JR
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">Jonas Reid · Backend Engineer</p>
                <p className="text-xs text-slate-400">
                  Stage: <span className="font-semibold text-indigo-300">{PLAY_STAGES[stage]}</span>
                  {" · "}Day {3 + stage * 4}
                </p>
              </div>
              {stage >= 4 ? (
                <span className="ml-auto hidden shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300 sm:inline-flex">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> On track
                </span>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">
        Inside the app you&apos;d just drag the card — JobFlow logs every move automatically.
      </p>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* Testimonials marquee                                                */
/* ------------------------------------------------------------------ */
const QUOTES = [
  { quote: "One place for every application and follow-up.", name: "Frontend Engineer" },
  { quote: "The funnel view makes progress visible.", name: "Career Coach" },
  { quote: "Response rate per source changed how I apply.", name: "Bootcamp Graduate" },
  { quote: "Reminders alone saved my search.", name: "Product Designer" },
  { quote: "Finally, interviews with context attached.", name: "Data Analyst" },
];

export function TestimonialsMarquee() {
  const row = [...QUOTES, ...QUOTES];
  return (
    <div className="marquee-paused relative overflow-hidden">
      <div className="animate-marquee-fast flex w-max gap-4 pr-4">
        {row.map((item, i) => (
          <figure
            key={i}
            className="w-72 shrink-0 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <blockquote className="text-sm text-slate-700 dark:text-slate-200">“{item.quote}”</blockquote>
            <figcaption className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Placeholder · {item.name}
            </figcaption>
          </figure>
        ))}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent dark:from-slate-950" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent dark:from-slate-950" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ accordion                                                       */
/* ------------------------------------------------------------------ */
const FAQ = [
  { q: "Is my data private?", a: "Yes. Everything is scoped to your account, passwords are hashed, and sessions use secure signed cookies." },
  { q: "Can I try it without signing up?", a: "Yes — open the demo account. It's pre-filled with fictional data so you can explore everything." },
  { q: "Where do analytics come from?", a: "Your own records. Funnel, response rate and time-in-stage are computed, never hardcoded." },
  { q: "Does it work on mobile?", a: "Yes. The board becomes swipeable columns, and every page is fully responsive with dark mode." },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {FAQ.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className={cn(
              "overflow-hidden rounded-2xl border transition-colors",
              isOpen
                ? "border-indigo-200 bg-white dark:border-indigo-500/40 dark:bg-slate-900"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-slate-900 dark:text-white"
            >
              {item.q}
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.21, 0.65, 0.16, 1] }}
                >
                  <p className="px-5 pb-4 text-sm text-slate-600 dark:text-slate-300">{item.a}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CTA panel                                                           */
/* ------------------------------------------------------------------ */
export function CtaPanel() {
  return (
    <Reveal className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-14 text-center dark:bg-slate-900">
      <div aria-hidden className="animate-drift-slow absolute -left-20 -top-24 h-72 w-72 rounded-full bg-indigo-600/40 blur-3xl" />
      <div aria-hidden className="animate-drift-slower absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
      <div aria-hidden className="landing-grid-bg absolute inset-0 opacity-60" />
      {/* Shine sweep */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-shine absolute inset-y-0 w-24 bg-white/10 blur-md" />
      </div>
      <div className="relative">
        <h2 className="text-balance mx-auto max-w-xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Your next offer starts with an organised search
        </h2>
        <p className="mx-auto mt-2 max-w-md text-slate-300">
          Free account, or explore the demo first. Takes under a minute.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Magnetic>
            <Link href="/register">
              <Button size="lg">
                Start Tracking <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
          </Magnetic>
          <Magnetic>
            <DemoButton variant="secondary" />
          </Magnetic>
        </div>
      </div>
    </Reveal>
  );
}
