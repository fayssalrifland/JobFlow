import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  applicationTags,
  applications,
  activities,
  companies,
  contacts,
  cvs,
  interviews,
  notifications,
  reminders,
  tags as tagsTable,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { STATUS_META, type ApplicationStatus } from "@/lib/constants";

export const DEMO_EMAIL = "demo@jobflow.app";
export const DEMO_PASSWORD = "demo1234";

/** Small deterministic PRNG so the demo data is stable between resets. */
function rng(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

type Spec = {
  company: string;
  accent: string;
  industry: string;
  website: string;
  position: string;
  location: string;
  locationType: "REMOTE" | "HYBRID" | "ONSITE";
  employmentType: "FULL_TIME" | "CONTRACT" | "PART_TIME" | "INTERNSHIP" | "FREELANCE";
  salaryMin: number;
  salaryMax: number;
  source: "LINKEDIN" | "INDEED" | "COMPANY_WEBSITE" | "REFERRAL" | "RECRUITER" | "OTHER";
  status: ApplicationStatus;
  reached?: ApplicationStatus;
  daysAgo: number;
  priority: "LOW" | "MEDIUM" | "HIGH";
  tags: string[];
  contact?: { name: string; email: string; linkedinUrl?: string };
  cv: number;
};

const SPECS: Spec[] = [
  { company: "Stripe", accent: "indigo", industry: "Fintech", website: "https://stripe.com", position: "Senior Frontend Engineer", location: "Remote (EU)", locationType: "REMOTE", employmentType: "FULL_TIME", salaryMin: 120000, salaryMax: 160000, source: "REFERRAL", status: "OFFER", daysAgo: 62, priority: "HIGH", tags: ["react", "typescript", "dream-job"], contact: { name: "Elena Fischer", email: "elena.fischer@example.com", linkedinUrl: "https://linkedin.com/in/example-elena" }, cv: 0 },
  { company: "Shopify", accent: "emerald", industry: "E-commerce", website: "https://shopify.com", position: "Frontend Developer, Checkout", location: "Remote (Global)", locationType: "REMOTE", employmentType: "FULL_TIME", salaryMin: 105000, salaryMax: 135000, source: "LINKEDIN", status: "TECHNICAL_TEST", daysAgo: 34, priority: "HIGH", tags: ["react", "remote"], contact: { name: "Marcus Reid", email: "marcus.reid@example.com" }, cv: 0 },
  { company: "Atlassian", accent: "sky", industry: "Developer tools", website: "https://atlassian.com", position: "Senior React Engineer", location: "Amsterdam, NL", locationType: "HYBRID", employmentType: "FULL_TIME", salaryMin: 95000, salaryMax: 120000, source: "RECRUITER", status: "INTERVIEW", daysAgo: 21, priority: "HIGH", tags: ["react", "design-systems"], contact: { name: "Priya Nair", email: "priya.nair@example.com" }, cv: 0 },
  { company: "Airbnb", accent: "rose", industry: "Travel", website: "https://airbnb.com", position: "Frontend Engineer, Growth", location: "Berlin, DE", locationType: "HYBRID", employmentType: "FULL_TIME", salaryMin: 100000, salaryMax: 130000, source: "COMPANY_WEBSITE", status: "REJECTED", reached: "INTERVIEW", daysAgo: 78, priority: "MEDIUM", tags: ["react", "growth"], cv: 1 },
  { company: "Google", accent: "amber", industry: "Big tech", website: "https://google.com", position: "Software Engineer, Frontend", location: "Zurich, CH", locationType: "ONSITE", employmentType: "FULL_TIME", salaryMin: 140000, salaryMax: 180000, source: "LINKEDIN", status: "REJECTED", reached: "SCREENING", daysAgo: 96, priority: "MEDIUM", tags: ["big-tech"], cv: 1 },
  { company: "Microsoft", accent: "sky", industry: "Big tech", website: "https://microsoft.com", position: "Frontend Engineer II", location: "Remote (EU)", locationType: "REMOTE", employmentType: "FULL_TIME", salaryMin: 110000, salaryMax: 140000, source: "RECRUITER", status: "SCREENING", daysAgo: 12, priority: "MEDIUM", tags: ["typescript", "big-tech"], contact: { name: "Tom Vogel", email: "tom.vogel@example.com" }, cv: 0 },
  { company: "Vercel", accent: "slate", industry: "Developer tools", website: "https://vercel.com", position: "Product Engineer", location: "Remote (Global)", locationType: "REMOTE", employmentType: "FULL_TIME", salaryMin: 115000, salaryMax: 150000, source: "LINKEDIN", status: "INTERVIEW", daysAgo: 17, priority: "HIGH", tags: ["nextjs", "remote", "dream-job"], contact: { name: "Dana Whitfield", email: "dana.whitfield@example.com" }, cv: 2 },
  { company: "Linear", accent: "violet", industry: "SaaS", website: "https://linear.app", position: "Frontend Engineer", location: "Remote (EU)", locationType: "REMOTE", employmentType: "FULL_TIME", salaryMin: 110000, salaryMax: 145000, source: "COMPANY_WEBSITE", status: "APPLIED", daysAgo: 4, priority: "HIGH", tags: ["react", "dream-job"], cv: 2 },
  { company: "Figma", accent: "violet", industry: "Design tools", website: "https://figma.com", position: "Senior Web Engineer", location: "Remote (EU)", locationType: "REMOTE", employmentType: "FULL_TIME", salaryMin: 125000, salaryMax: 165000, source: "REFERRAL", status: "SCREENING", daysAgo: 9, priority: "HIGH", tags: ["canvas", "typescript"], contact: { name: "Sofia Lindgren", email: "sofia.lindgren@example.com" }, cv: 0 },
  { company: "Datadog", accent: "teal", industry: "Observability", website: "https://datadoghq.com", position: "Frontend Engineer, Dashboards", location: "Paris, FR", locationType: "HYBRID", employmentType: "FULL_TIME", salaryMin: 90000, salaryMax: 115000, source: "INDEED", status: "APPLIED", daysAgo: 6, priority: "MEDIUM", tags: ["charts", "react"], cv: 1 },
  { company: "Northwind Labs", accent: "emerald", industry: "Climate tech startup", website: "https://example.com/northwind", position: "Full Stack Engineer", location: "Rotterdam, NL", locationType: "HYBRID", employmentType: "FULL_TIME", salaryMin: 75000, salaryMax: 95000, source: "OTHER", status: "ACCEPTED", daysAgo: 118, priority: "LOW", tags: ["startup", "fullstack"], contact: { name: "Jesse Arends", email: "jesse@example.com" }, cv: 2 },
  { company: "Pixelgrove Studio", accent: "amber", industry: "Digital agency", website: "https://example.com/pixelgrove", position: "React Developer", location: "Remote (EU)", locationType: "REMOTE", employmentType: "CONTRACT", salaryMin: 60000, salaryMax: 80000, source: "INDEED", status: "REJECTED", reached: "APPLIED", daysAgo: 53, priority: "LOW", tags: ["agency"], cv: 1 },
  { company: "Helio Health", accent: "rose", industry: "Health tech", website: "https://example.com/helio", position: "Frontend Engineer", location: "Utrecht, NL", locationType: "ONSITE", employmentType: "FULL_TIME", salaryMin: 70000, salaryMax: 88000, source: "LINKEDIN", status: "TECHNICAL_TEST", daysAgo: 28, priority: "MEDIUM", tags: ["healthtech", "a11y"], contact: { name: "Nora Dijkstra", email: "nora.dijkstra@example.com" }, cv: 1 },
  { company: "Cartology", accent: "indigo", industry: "Mapping SaaS", website: "https://example.com/cartology", position: "Senior Frontend Engineer", location: "Remote (Global)", locationType: "REMOTE", employmentType: "FULL_TIME", salaryMin: 100000, salaryMax: 128000, source: "RECRUITER", status: "INTERVIEW", daysAgo: 25, priority: "MEDIUM", tags: ["maps", "typescript"], contact: { name: "Owen Blake", email: "owen.blake@example.com" }, cv: 2 },
  { company: "Kettle & Co", accent: "amber", industry: "Retail", website: "https://example.com/kettle", position: "Frontend Developer", location: "Eindhoven, NL", locationType: "ONSITE", employmentType: "PART_TIME", salaryMin: 45000, salaryMax: 58000, source: "INDEED", status: "REJECTED", reached: "APPLIED", daysAgo: 66, priority: "LOW", tags: ["retail"], cv: 1 },
  { company: "Orbital Systems", accent: "sky", industry: "IoT", website: "https://example.com/orbital", position: "UI Engineer", location: "Remote (EU)", locationType: "REMOTE", employmentType: "FULL_TIME", salaryMin: 85000, salaryMax: 105000, source: "LINKEDIN", status: "APPLIED", daysAgo: 2, priority: "MEDIUM", tags: ["iot"], cv: 2 },
  { company: "Brightloop", accent: "violet", industry: "EdTech", website: "https://example.com/brightloop", position: "Frontend Engineer", location: "Remote (EU)", locationType: "REMOTE", employmentType: "FULL_TIME", salaryMin: 78000, salaryMax: 96000, source: "COMPANY_WEBSITE", status: "SCREENING", daysAgo: 15, priority: "MEDIUM", tags: ["edtech", "react"], contact: { name: "Ana Petrova", email: "ana.petrova@example.com" }, cv: 1 },
  { company: "Ferrous Bank", accent: "slate", industry: "Banking", website: "https://example.com/ferrous", position: "Frontend Engineer (Design Systems)", location: "Frankfurt, DE", locationType: "HYBRID", employmentType: "FULL_TIME", salaryMin: 88000, salaryMax: 110000, source: "RECRUITER", status: "REJECTED", reached: "TECHNICAL_TEST", daysAgo: 88, priority: "MEDIUM", tags: ["design-systems", "banking"], cv: 0 },
  { company: "Maple Analytics", accent: "emerald", industry: "Data", website: "https://example.com/maple", position: "React Engineer", location: "Remote (Global)", locationType: "REMOTE", employmentType: "CONTRACT", salaryMin: 95000, salaryMax: 120000, source: "OTHER", status: "APPLIED", daysAgo: 8, priority: "LOW", tags: ["data-viz"], cv: 2 },
  { company: "Sundial", accent: "amber", industry: "Productivity", website: "https://example.com/sundial", position: "Frontend Engineer", location: "Remote (EU)", locationType: "REMOTE", employmentType: "FULL_TIME", salaryMin: 82000, salaryMax: 104000, source: "LINKEDIN", status: "APPLIED", daysAgo: 11, priority: "MEDIUM", tags: ["startup"], cv: 2 },
  { company: "Wavelength Media", accent: "rose", industry: "Media", website: "https://example.com/wavelength", position: "Senior UI Developer", location: "London, UK", locationType: "HYBRID", employmentType: "FULL_TIME", salaryMin: 90000, salaryMax: 112000, source: "INDEED", status: "REJECTED", reached: "SCREENING", daysAgo: 45, priority: "LOW", tags: ["media"], cv: 1 },
  { company: "Quantly", accent: "teal", industry: "AI tooling", website: "https://example.com/quantly", position: "Product Engineer (Frontend)", location: "Remote (Global)", locationType: "REMOTE", employmentType: "FULL_TIME", salaryMin: 105000, salaryMax: 138000, source: "REFERRAL", status: "OFFER", daysAgo: 40, priority: "HIGH", tags: ["ai", "dream-job"], contact: { name: "Hugo Martens", email: "hugo.martens@example.com" }, cv: 0 },
  { company: "Trailhead Sports", accent: "emerald", industry: "Consumer", website: "https://example.com/trailhead", position: "Frontend Engineer", location: "Barcelona, ES", locationType: "ONSITE", employmentType: "FULL_TIME", salaryMin: 60000, salaryMax: 75000, source: "COMPANY_WEBSITE", status: "APPLIED", daysAgo: 19, priority: "LOW", tags: ["consumer"], cv: 1 },
  { company: "Cobalt Freight", accent: "slate", industry: "Logistics", website: "https://example.com/cobalt", position: "Frontend Engineer", location: "Remote (EU)", locationType: "REMOTE", employmentType: "FULL_TIME", salaryMin: 80000, salaryMax: 98000, source: "LINKEDIN", status: "SCREENING", daysAgo: 22, priority: "MEDIUM", tags: ["logistics"], contact: { name: "Iris Kaminski", email: "iris.k@example.com" }, cv: 2 },
];

const STAGE_ORDER: ApplicationStatus[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "TECHNICAL_TEST",
  "OFFER",
  "ACCEPTED",
];

function buildPath(spec: Spec, random: () => number) {
  const target = spec.status === "REJECTED" ? (spec.reached ?? "APPLIED") : spec.status;
  const targetIndex = STAGE_ORDER.indexOf(target);
  const appliedAt = new Date(Date.now() - spec.daysAgo * 86_400_000);
  appliedAt.setHours(9, 30, 0, 0);
  const path: { status: ApplicationStatus; at: Date }[] = [{ status: "APPLIED", at: appliedAt }];
  let cursor = appliedAt.getTime();
  for (let i = 1; i <= targetIndex; i += 1) {
    cursor += (3 + Math.floor(random() * 8)) * 86_400_000;
    path.push({ status: STAGE_ORDER[i], at: new Date(Math.min(cursor, Date.now() - 3_600_000)) });
  }
  if (spec.status === "REJECTED") {
    cursor += (2 + Math.floor(random() * 6)) * 86_400_000;
    path.push({ status: "REJECTED", at: new Date(Math.min(cursor, Date.now() - 3_600_000)) });
  }
  return path;
}

const CV_DEFS = [
  { name: "CV — Senior Frontend Engineer", version: "2026.1", notes: "Emphasises React, design systems and performance work." },
  { name: "CV — React Developer", version: "2026.1", notes: "Shorter, product-focused version for mid-level roles." },
  { name: "CV — Full Stack Engineer", version: "2025.4", notes: "Highlights Node.js, PostgreSQL and platform work." },
];

export async function resetDemoData(userId: string) {
  await db.delete(applications).where(eq(applications.userId, userId));
  await db.delete(activities).where(eq(activities.userId, userId));
  await db.delete(notifications).where(eq(notifications.userId, userId));
  await db.delete(reminders).where(eq(reminders.userId, userId));
  await db.delete(contacts).where(eq(contacts.userId, userId));
  await db.delete(cvs).where(eq(cvs.userId, userId));
  await db.delete(tagsTable).where(eq(tagsTable.userId, userId));
  await db.delete(companies).where(eq(companies.userId, userId));
  await seedDemoContent(userId);
}

async function seedDemoContent(userId: string) {
  const random = rng(20260214);

  const cvRows = await db
    .insert(cvs)
    .values(
      CV_DEFS.map((cv, index) => ({
        userId,
        name: cv.name,
        version: cv.version,
        notes: cv.notes,
        isDefault: index === 0,
      })),
    )
    .returning();

  const tagLabels = Array.from(new Set(SPECS.flatMap((spec) => spec.tags)));
  const tagRows = await db
    .insert(tagsTable)
    .values(tagLabels.map((label) => ({ userId, label })))
    .returning();
  const tagByLabel = new Map(tagRows.map((tag) => [tag.label, tag.id]));

  const companyNames = Array.from(new Set(SPECS.map((spec) => spec.company)));
  const companyRows = await db
    .insert(companies)
    .values(
      companyNames.map((name) => {
        const spec = SPECS.find((item) => item.company === name)!;
        return { userId, name, accent: spec.accent, industry: spec.industry, website: spec.website };
      }),
    )
    .returning();
  const companyByName = new Map(companyRows.map((company) => [company.name, company.id]));

  for (const spec of SPECS) {
    const path = buildPath(spec, random);
    const appliedDate = path[0].at.toISOString().slice(0, 10);
    const companyId = companyByName.get(spec.company)!;

    let contactId: string | null = null;
    if (spec.contact) {
      const [contact] = await db
        .insert(contacts)
        .values({
          userId,
          companyId,
          name: spec.contact.name,
          email: spec.contact.email,
          linkedinUrl: spec.contact.linkedinUrl ?? null,
          role: "Talent Partner",
        })
        .returning();
      contactId = contact.id;
    }

    const responded = path.length > 1 ? path[1].at : null;
    const followUp =
      spec.status === "APPLIED" || spec.status === "SCREENING"
        ? new Date(Date.now() + (1 + Math.floor(random() * 9)) * 86_400_000).toISOString().slice(0, 10)
        : null;

    const [application] = await db
      .insert(applications)
      .values({
        userId,
        companyId,
        contactId,
        cvId: cvRows[spec.cv].id,
        position: spec.position,
        location: spec.location,
        locationType: spec.locationType,
        employmentType: spec.employmentType,
        jobUrl: `${spec.website}/careers`,
        salaryMin: spec.salaryMin,
        salaryMax: spec.salaryMax,
        currency: "EUR",
        appliedDate,
        status: spec.status,
        priority: spec.priority,
        source: spec.source,
        jobDescription: demoJobDescription(spec),
        notes:
          spec.status === "OFFER"
            ? "Offer received — negotiating start date and equity refresh."
            : null,
        nextFollowUpDate: followUp,
        respondedAt: responded,
        statusChangedAt: path[path.length - 1].at,
        createdAt: path[0].at,
        updatedAt: path[path.length - 1].at,
      })
      .returning();

    const tagIds = spec.tags.map((label) => tagByLabel.get(label)!).filter(Boolean);
    if (tagIds.length) {
      await db
        .insert(applicationTags)
        .values(tagIds.map((tagId) => ({ applicationId: application.id, tagId })));
    }

    const activityValues = path.map((step, index) => {
      if (index === 0) {
        return {
          userId,
          applicationId: application.id,
          type: "APPLICATION_CREATED" as const,
          message: `Created application for ${spec.position} at ${spec.company}`,
          toStatus: "APPLIED" as ApplicationStatus,
          occurredAt: step.at,
          createdAt: step.at,
        };
      }
      const from = path[index - 1].status;
      return {
        userId,
        applicationId: application.id,
        type: "STATUS_CHANGED" as const,
        message: `Moved ${spec.position} at ${spec.company} from ${STATUS_META[from].label} → ${STATUS_META[step.status].label}`,
        fromStatus: from,
        toStatus: step.status,
        occurredAt: step.at,
        createdAt: step.at,
      };
    });
    await db.insert(activities).values(activityValues);

    // Interviews for anything that reached the interview stage.
    const interviewStep = path.find((step) => step.status === "INTERVIEW");
    if (interviewStep) {
      await db.insert(interviews).values({
        userId,
        applicationId: application.id,
        type: "VIDEO",
        scheduledAt: interviewStep.at,
        durationMinutes: 45,
        meetingUrl: "https://meet.example.com/jobflow-demo",
        interviewers: spec.contact?.name ?? "Hiring manager",
        notes: "Intro call: team structure, product roadmap, and my recent work.",
        completed: true,
      });
    }
    const techStep = path.find((step) => step.status === "TECHNICAL_TEST");
    if (techStep) {
      await db.insert(interviews).values({
        userId,
        applicationId: application.id,
        type: "TECHNICAL",
        scheduledAt: techStep.at,
        durationMinutes: 90,
        meetingUrl: "https://meet.example.com/jobflow-demo-tech",
        interviewers: "Staff engineer + engineering manager",
        notes: "Live coding: component architecture and state management.",
        completed: true,
      });
    }
  }

  // Upcoming interviews (future) for a few active applications.
  const activeApps = await db.select().from(applications).where(eq(applications.userId, userId));
  const upcomingTargets = activeApps
    .filter((app) => ["INTERVIEW", "TECHNICAL_TEST", "SCREENING"].includes(app.status))
    .slice(0, 4);
  const offsets = [1, 2, 5, 9];
  for (const [index, app] of upcomingTargets.entries()) {
    const when = new Date();
    when.setDate(when.getDate() + offsets[index]);
    when.setHours(10 + index, index % 2 === 0 ? 0 : 30, 0, 0);
    await db.insert(interviews).values({
      userId,
      applicationId: app.id,
      type: index % 2 === 0 ? "TECHNICAL" : "FINAL",
      scheduledAt: when,
      durationMinutes: index % 2 === 0 ? 90 : 60,
      meetingUrl: "https://meet.example.com/jobflow-demo-upcoming",
      interviewers: "Engineering manager, senior engineer",
      notes: "Prepare: system design of a dashboard UI, accessibility trade-offs.",
      completed: false,
    });
    await db.insert(notifications).values({
      userId,
      type: "INTERVIEW",
      title: `Interview scheduled in ${offsets[index]} day${offsets[index] === 1 ? "" : "s"}`,
      body: `${app.position} — ${when.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
      href: `/app/applications/${app.id}`,
      read: index > 1,
      createdAt: new Date(Date.now() - index * 3_600_000),
    });
  }

  // Reminders: overdue, upcoming and completed.
  const reminderTargets = activeApps.slice(0, 6);
  const reminderPlan = [
    { offsetDays: -3, title: "Follow up with recruiter", completed: false },
    { offsetDays: -1, title: "Send thank-you note after interview", completed: false },
    { offsetDays: 1, title: "Prepare system design answers", completed: false },
    { offsetDays: 3, title: "Follow up on take-home result", completed: false },
    { offsetDays: 6, title: "Check in about the offer deadline", completed: false },
    { offsetDays: -8, title: "Ask about salary band", completed: true },
  ];
  for (const [index, plan] of reminderPlan.entries()) {
    const app = reminderTargets[index % reminderTargets.length];
    const due = new Date();
    due.setDate(due.getDate() + plan.offsetDays);
    due.setHours(9, 0, 0, 0);
    await db.insert(reminders).values({
      userId,
      applicationId: app?.id ?? null,
      title: plan.title,
      notes: plan.completed ? "Answered: band confirmed as advertised." : null,
      dueDate: due,
      completed: plan.completed,
      completedAt: plan.completed ? new Date(due.getTime() + 3_600_000) : null,
    });
  }

  await db.insert(notifications).values([
    {
      userId,
      type: "SYSTEM",
      title: "Welcome to the JobFlow demo account",
      body: "All data here is fictional and seeded for demonstration purposes.",
      href: "/app/dashboard",
      read: false,
    },
    {
      userId,
      type: "REMINDER",
      title: "A follow-up is overdue",
      body: "Follow up with recruiter was due 3 days ago.",
      href: "/app/reminders",
      read: false,
    },
  ]);
}

function demoJobDescription(spec: Spec) {
  return `About the role
${spec.company} is hiring a ${spec.position}. You will work with product designers and backend engineers to ship customer-facing features.

Responsibilities:
Build accessible, performant interfaces with React and TypeScript
Collaborate on our design system and component library
Improve Core Web Vitals and front-end observability
Review code and mentor other engineers

Requirements:
4+ years of experience building production web applications
Strong React, TypeScript and CSS fundamentals
Experience with REST APIs and state management (TanStack Query, Redux or Zustand)
Testing experience with Jest or Playwright
Git based workflows and CI/CD

Nice to have:
Next.js or other SSR frameworks
Docker and AWS familiarity
Design systems or accessibility (WCAG) experience
`;
}

/** Creates the demo user on first use and returns it. */
export async function ensureDemoUser() {
  const [existing] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({
      email: DEMO_EMAIL,
      passwordHash: await hashPassword(DEMO_PASSWORD),
      name: "Alex Morgan",
      headline: "Senior Frontend Engineer · Demo Account",
      isDemo: true,
      defaultCurrency: "EUR",
      theme: "system",
    })
    .returning();

  await seedDemoContent(created.id);
  return created;
}
