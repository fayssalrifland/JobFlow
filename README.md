# JobFlow — Job Application Tracker & Career Analytics

JobFlow is a production-quality, full-stack job-search management platform: a Kanban pipeline for
applications, interview and reminder management, CV versioning, an in-app notification centre and an
analytics suite where **every number is calculated from real database records**.

> Built as a portfolio project. The demo account is clearly labelled and contains fictional data.

---

## 1. Overview

| | |
|---|---|
| **Problem** | Job seekers lose track of applications, interviews, follow-ups and outcomes. |
| **Solution** | One centralised platform for the entire job search, with analytics that explain what is working. |
| **Audience** | Active job seekers, career coaches, bootcamp graduates. |

Read the long-form write-up (problem, technical challenges, trade-offs) at **`/case-study`**.

---

## 2. Features

**Pipeline**
- Kanban board: `APPLIED → SCREENING → INTERVIEW → TECHNICAL TEST → OFFER → ACCEPTED` plus `REJECTED`
- Drag-and-drop with optimistic updates, rollback on failure, toast feedback and **Undo**
- Keyboard-accessible alternative on every card (`Move to…` select) and dnd-kit keyboard sensor
- Table/list view with the same filters; the preferred view is remembered

**Applications**
- Full record: company, position, location, work setup, employment type, job URL, salary range,
  currency, applied date, status, priority, source, contact, CV used, cover letter, notes, tags,
  next follow-up, interviews, timestamps
- Detail page: information panel + activity timeline (auto-recorded and manual events)
- Multi-section create/edit form with React Hook Form + Zod validation

**Search, filter, sort**
- Debounced search across company, position, location and contact (name/email)
- Filters: status, priority, work setup, employment type, date range, salary, tag
- Sorting: newest, oldest, company A–Z, salary, priority, recently updated + “Reset filters”

**Interviews & reminders**
- Phone / video / technical / HR / final interviews with duration, meeting URL, interviewers, notes
- 7-day agenda view, upcoming & past lists, completion state
- Reminders grouped into overdue / upcoming / completed with optimistic toggling

**Analytics**
- KPIs: total, active, interviews, offers, rejections, response rate
- Funnel conversion, applications over time (weekly), applications per month
- Response / interview / offer rates, average time to first response, average time in each stage
- Breakdowns by source, status, location, employment type and work setup
- Ranges: 7 days, 30 days, 90 days, 6 months, 1 year, all time

**Extras**
- Job description analysis (required vs. nice-to-have skills, technologies, years of experience,
  responsibilities, keywords) — deterministic, no AI key required
- CV/document management with optional PDF upload, preview, download and delete
- Notification centre with unread badge, mark as read / mark all as read
- Settings: profile, email, password, theme (light/dark/system), default currency, default view,
  notification preferences
- Loading skeletons, empty states, error states, confirmation dialogs, toasts — no `alert()`

---

## 3. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript strict) |
| Styling | Tailwind CSS v4 + a small headless component layer (`components/ui`) |
| Data fetching | TanStack Query (caching, optimistic updates) |
| Client state | Zustand (theme + preferred view, persisted) |
| Forms | React Hook Form + Zod (schemas shared with the API) |
| Drag & drop | dnd-kit (pointer + keyboard sensors, drag overlay) |
| Charts | Recharts |
| Icons | lucide-react |
| Toasts | sonner |
| Database | PostgreSQL + Drizzle ORM |
| Auth | bcrypt password hashing + signed JWT session cookie (jose) |

> The brief suggested Vite + Express + Prisma. This implementation uses the equivalent Next.js
> App Router + Drizzle stack so the client and API share one TypeScript codebase and the same Zod
> schemas; the reasoning and trade-offs are documented in `/case-study`.

---

## 4. Architecture

```
src/
├── app/                       # Routes (App Router)
│   ├── page.tsx               # Public landing page
│   ├── login/ register/       # Auth screens
│   ├── case-study/            # Portfolio write-up
│   ├── app/                   # Authenticated application shell
│   │   ├── dashboard/ board/ applications/ interviews/
│   │   ├── reminders/ analytics/ documents/ settings/
│   └── api/                   # REST API route handlers
├── components/
│   ├── ui/                    # Button, Card, Badge, Dialog, form controls, feedback states
│   ├── layout/                # App shell, page header, notification centre, theme toggle
│   ├── applications/          # Cards, Kanban board, table, filters, form, timeline, JD analysis
│   ├── dashboard/             # KPI cards, charts, panels
│   ├── analytics/             # Lazy-loaded analytics view
│   ├── interviews/ reminders/ marketing/
├── hooks/                     # Query/mutation hooks, debounce, filter state
├── services/                  # Typed fetch client
├── server/                    # Domain layer: applications, analytics, activity log, demo seed
├── db/                        # Drizzle client + schema
├── lib/                       # auth, http helpers, validation, constants, utils, job analysis
├── stores/                    # Zustand UI store
└── types/                     # Shared DTO types
```

**Data model** (all rows scoped to a user, cascade deletes):

```
User ──┬── Application ──┬── Company
       │                 ├── Contact
       │                 ├── Cv (selected per application)
       │                 ├── Interview[]
       │                 ├── Reminder[]
       │                 ├── Activity[]
       │                 └── Tag[] (via application_tags)
       ├── Interview[] ├── Reminder[] ├── Activity[] ├── Notification[] ├── Cv[] └── Tag[]
```

---

## 5. Installation

```bash
git clone <repo-url> jobflow
cd jobflow
npm install
cp .env.example .env     # then edit the values
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `SESSION_SECRET` | yes in production | Secret used to sign session JWTs (`openssl rand -hex 32`) |
| `RESEND_API_KEY` | no | Optional email provider for reminder emails |

Secrets are only read server-side (route handlers / server components). Nothing sensitive is ever
exposed to the browser bundle.

### Database setup

```bash
# Create the database (example)
createdb app_db

# Apply the schema
npx drizzle-kit push
```

### Seed data

Demo data is seeded automatically the first time anyone opens the demo account
(`POST /api/auth/demo`, or the “View Demo” button). It creates ~24 realistic applications across
fictional and well-known company names, with stage histories, interviews, reminders, notifications,
tags and three CV versions. Signed-in demo users can re-seed with **Reset demo**
(`POST /api/demo/reset`).

**Demo credentials:** `demo@jobflow.app` / `demo1234`

### Running locally

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run typecheck
npm run lint
```

---

## 6. API documentation

All endpoints return JSON and use conventional status codes
(`200/201`, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict,
`422` validation error, `429` rate limited, `500` unexpected). Validation errors include a
`details` array of `{ path, message }`.

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account and start a session |
| POST | `/api/auth/login` | Email/password sign-in (rate limited) |
| POST | `/api/auth/logout` | Clear the session cookie |
| POST | `/api/auth/demo` | Sign in to the seeded demo account |
| GET / PATCH | `/api/me` | Current user; update profile + preferences |
| PATCH | `/api/me/password` | Change password (verifies the current one) |

### Applications
| Method | Path | Description |
|---|---|---|
| GET | `/api/applications` | List with `search, status, priority, locationType, employmentType, tags, from, to, salaryMin, salaryMax, sort, page, pageSize` |
| POST | `/api/applications` | Create (also upserts company, contact and tags) |
| GET | `/api/applications/:id` | Detail incl. interviews, activities, reminders |
| PATCH | `/api/applications/:id` | Full update; logs a status change or an update activity |
| DELETE | `/api/applications/:id` | Delete with cascade |
| PATCH | `/api/applications/:id/status` | Move stage; logs activity + notification |
| POST | `/api/applications/:id/activities` | Add a manual timeline event |

### Interviews, reminders, documents
| Method | Path | Description |
|---|---|---|
| GET / POST | `/api/interviews` | List (`?upcoming=1`) / schedule |
| PATCH / DELETE | `/api/interviews/:id` | Update (incl. completion) / delete |
| GET / POST | `/api/reminders` | List / create |
| PATCH / DELETE | `/api/reminders/:id` | Toggle completion, edit / delete |
| GET / POST | `/api/cvs` | List CV versions / create (optional base64 PDF) |
| GET / DELETE | `/api/cvs/:id` | Stream the PDF (`?download=1`) / delete |

### Insights & misc
| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard` | KPIs, funnel, weekly trend, time in stage, activity, interviews, reminders |
| GET | `/api/analytics?range=7d\|30d\|90d\|6m\|1y\|all` | Full analytics payload |
| GET / POST | `/api/companies` | Company list with counts / create |
| GET | `/api/tags` | Tags for filter suggestions |
| GET / PATCH | `/api/notifications` | List + unread count / mark all read |
| PATCH | `/api/notifications/:id` | Mark one read/unread |
| POST | `/api/analyze-job` | Analyse a pasted job description |
| POST | `/api/demo/reset` | Re-seed the demo account (demo user only) |
| GET | `/api/health` | Health check |

---

## 7. Security

- bcrypt password hashing (cost 10); password hashes never leave the server
- Signed JWT session cookies: `httpOnly`, `sameSite=lax`, `secure` in production, 14-day expiry
- Edge middleware guards `/app/*` **and** every handler re-checks ownership (`userId` scoping)
- Zod validation on every request body and query string
- Fixed-window rate limiting on auth, demo and analysis endpoints
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`); same-origin API means no permissive CORS is required
- All secrets come from environment variables

---

## 8. Accessibility & responsiveness

- Semantic landmarks, skip link, visible focus rings, `aria-current` navigation state
- Focus-trapped dialogs with Escape-to-close and focus restoration
- Labelled inputs, inline error messages with `role="alert"`, error summaries on forms
- Drag-and-drop announcements plus a non-pointer alternative for every move
- Desktop: 7-column board · Tablet: horizontally scrollable board · Mobile: stage switcher,
  vertical cards and bottom navigation

---

## 9. Performance

- Route-level code splitting; the analytics bundle is lazy-loaded with `next/dynamic`
- TanStack Query caching, `placeholderData` for instant filter feedback, targeted invalidation
- Debounced (300 ms) search, paginated API, memoised grouping for the board
- Optimistic mutations keep interactions instant

---

## 10. Deployment

1. Provision PostgreSQL (Neon, Supabase, RDS, …) and set `DATABASE_URL`.
2. Set `SESSION_SECRET` to a long random value.
3. Apply the schema: `npx drizzle-kit push`.
4. Build and start: `npm run build && npm run start` (or deploy to Vercel — the App Router,
   middleware and route handlers deploy as-is).
5. Point the platform health check at `/api/health`.

For containerised local development, any standard Node 20 image plus a `postgres:16` service works;
the app only needs `DATABASE_URL` and `SESSION_SECRET`.
