import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroPipeline } from "@/components/marketing/hero-pipeline";
import { LandingHeroCopy } from "@/components/marketing/landing-hero";
import { ScrollProgress, SectionHeading } from "@/components/marketing/landing-motion";
import {
  AnalyticsShowcase,
  CtaPanel,
  FaqAccordion,
  FeaturesBento,
  HowItWorks,
  LogoMarquee,
  Playground,
  TestimonialsMarquee,
} from "@/components/marketing/landing-sections";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <ScrollProgress />

      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              JF
            </span>
            <span className="text-base font-semibold tracking-tight">JobFlow</span>
          </Link>
          <nav aria-label="Marketing" className="hidden items-center gap-6 text-sm text-slate-600 md:flex dark:text-slate-300">
            <a href="#how" className="transition-colors hover:text-slate-900 dark:hover:text-white">How it works</a>
            <a href="#features" className="transition-colors hover:text-slate-900 dark:hover:text-white">Features</a>
            <a href="#analytics" className="transition-colors hover:text-slate-900 dark:hover:text-white">Analytics</a>
            <a href="#faq" className="transition-colors hover:text-slate-900 dark:hover:text-white">FAQ</a>
            <Link href="/case-study" className="transition-colors hover:text-slate-900 dark:hover:text-white">Case study</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Start Tracking</Button>
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="landing-grid-bg absolute inset-0" />
          <div aria-hidden className="animate-drift-slow absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/20" />
          <div aria-hidden className="animate-drift-slower absolute -right-20 top-20 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-500/20" />
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <LandingHeroCopy />
              <HeroPipeline />
            </div>
          </div>
        </section>

        <LogoMarquee />

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeading
            eyebrow="How it works"
            title="Three steps. Zero spreadsheets."
            body="A simple loop: capture roles, move them forward, learn from the numbers."
          />
          <div className="mt-8">
            <HowItWorks />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Features"
              title="Everything a serious search needs"
              body="One calm workspace for applications, interviews, reminders and CVs."
            />
            <div className="mt-8">
              <FeaturesBento />
            </div>
          </div>
        </section>

        {/* Interactive playground */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeading
            eyebrow="Feel it"
            title="This is how moving a card feels"
            body="Go ahead — click through the stages. The real board works with drag & drop."
          />
          <div className="mt-8">
            <Playground />
          </div>
        </section>

        {/* Analytics preview */}
        <section id="analytics" className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Analytics"
              title="Answers, not just charts"
              body="Which source converts? Where do you stall? Calculated from your data."
            />
            <div className="mt-8">
              <AnalyticsShowcase />
            </div>
            <p className="mt-4 text-[11px] text-slate-400">
              Illustrative preview. Your dashboard uses your own numbers.
            </p>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeading
            eyebrow="Loved by job seekers"
            title="What people would say"
            body="Placeholder quotes — this is a portfolio project, so nothing is claimed as real."
          />
          <div className="mt-8">
            <TestimonialsMarquee />
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-slate-200 bg-slate-50 py-16 sm:py-20 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading align="center" eyebrow="FAQ" title="Quick answers" />
            <div className="mt-8">
              <FaqAccordion />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <CtaPanel />
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:px-6 dark:text-slate-400">
          <p>JobFlow — a portfolio project. Company names in the demo are fictional examples.</p>
          <div className="flex gap-4">
            <Link href="/case-study" className="hover:text-slate-900 dark:hover:text-white">Case study</Link>
            <Link href="/login" className="hover:text-slate-900 dark:hover:text-white">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
