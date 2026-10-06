import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { DemoButton } from "@/components/marketing/demo-button";

export const metadata: Metadata = {
  title: "JobFlow — Portfolio case study",
  description: "Problem, solution, architecture and technical trade-offs behind JobFlow.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {children}
      </div>
    </section>
  );
}

export default function CaseStudyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Link href="/" className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
        ← Back to JobFlow
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
        JobFlow — portfolio case study
      </h1>
      <p className="mt-3 text-slate-600 dark:text-slate-300">
        A full-stack job application tracker and career analytics platform, built to demonstrate
        product thinking, relational data modelling and front-end craft.
      </p>

      <Section title="Problem">
        <p>
          Job seekers run a sales pipeline without a CRM. Applications live in spreadsheets, browser
          tabs and memory. People forget which CV they sent, when to follow up, and which channels
          actually produce interviews. Without data, the search is tuned by feeling rather than
          evidence.
        </p>
      </Section>

      <Section title="Solution">
        <p>
          JobFlow centralises the entire search: a Kanban pipeline for stage management, a detail
          view with a complete activity timeline, interview scheduling, follow-up reminders with a
          notification centre, CV version management and an analytics page that answers concrete
          questions — response rate per source, funnel conversion, average time per stage.
        </p>
      </Section>

      <Section title="Technical challenges & decisions">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Complex Kanban state.</strong> Board data is a single normalised query cached by
            TanStack Query. Drag-and-drop uses dnd-kit with a pointer sensor (6px activation so
            clicks still work) and a keyboard sensor. Every card also exposes a native
            <em> “Move to…” </em> select, which keeps the board fully usable without a mouse.
          </li>
          <li>
            <strong>Optimistic updates with rollback.</strong> Status changes patch every cached list
            immediately, snapshot the previous cache, and restore it if the request fails. The success
            toast offers an <em>Undo</em> that simply issues the inverse mutation.
          </li>
          <li>
            <strong>Analytics from real records.</strong> Nothing is hardcoded. Funnel “reach” is
            reconstructed from the activity log (max stage ever reached, not just the current status),
            and time-in-stage is derived from consecutive status-change timestamps. Aggregation runs in
            the API layer over a per-user dataset — simple, testable and fast for realistic volumes;
            it would move to SQL aggregates if the dataset grew by orders of magnitude.
          </li>
          <li>
            <strong>Relational design.</strong> Users own companies, contacts, applications, CVs,
            interviews, reminders, activities and notifications. Tags are normalised through a join
            table so filtering and suggestions stay consistent. Cascade deletes keep the graph clean.
          </li>
          <li>
            <strong>Authentication.</strong> bcrypt password hashing, signed JWT session cookies
            (http-only, same-site lax) via jose, an edge middleware guard for route protection, plus
            per-user authorisation checks inside every handler — the middleware is a UX optimisation,
            not the security boundary.
          </li>
          <li>
            <strong>Responsive by design.</strong> Desktop gets a seven-column board, tablets get a
            horizontally scrollable board, and mobile switches to a stage-switcher plus vertical list
            with bottom navigation — a different interaction model rather than a shrunken desktop UI.
          </li>
          <li>
            <strong>Accessibility.</strong> Semantic landmarks, skip link, focus-visible styling,
            focus-trapped dialogs with Escape handling, labelled form fields with inline errors,
            live regions for result counts and dnd-kit screen-reader announcements.
          </li>
          <li>
            <strong>Job description analysis without AI keys.</strong> A deterministic server-side
            keyword model splits requirement sections and matches a technology dictionary. It always
            works offline; an LLM could be swapped in behind the same endpoint.
          </li>
        </ul>
      </Section>

      <Section title="Trade-offs">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Next.js App Router instead of Vite + Express.</strong> One TypeScript codebase,
            one deployment, shared Zod schemas between client forms and API handlers. Route handlers
            play the role of the Express controllers; <code>src/server/*</code> holds the domain layer.
          </li>
          <li>
            <strong>Drizzle ORM instead of Prisma.</strong> Same relational model and typed queries,
            with lighter runtime and SQL-shaped query building.
          </li>
          <li>
            <strong>CV files stored in the database.</strong> Base64 in Postgres keeps local setup
            zero-config for a portfolio project; an object store (S3/R2) with signed URLs is the
            production path.
          </li>
          <li>
            <strong>In-memory rate limiting.</strong> Fine for a single node; Redis would be required
            behind a load balancer.
          </li>
          <li>
            <strong>Email reminders are opt-in but inert.</strong> The preference is stored and the
            in-app notification centre is fully functional; wiring a provider such as Resend is a
            configuration step, not a redesign.
          </li>
        </ul>
      </Section>

      <Section title="What to look at first">
        <ul className="list-disc space-y-2 pl-5">
          <li>The board: drag a card, watch the optimistic move, then hit Undo in the toast.</li>
          <li>The application detail page: timeline, interviews and job-description analysis.</li>
          <li>Analytics: switch the range and see every metric recomputed server-side.</li>
          <li>Resize to mobile: the board becomes a stage switcher with bottom navigation.</li>
        </ul>
      </Section>

      <div className="mt-10 flex flex-wrap gap-3">
        <DemoButton size="md">Open the demo</DemoButton>
        <Link href="/register">
          <Button variant="secondary" size="md">
            Create an account
          </Button>
        </Link>
      </div>
    </main>
  );
}
