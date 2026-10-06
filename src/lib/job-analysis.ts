/**
 * Deterministic job-description analyser.
 *
 * Runs entirely offline (no API keys required) so the feature always works.
 * It splits the description into "required" and "nice to have" regions, then
 * matches a curated technology dictionary plus generic keyword statistics.
 */

const TECH_DICTIONARY = [
  "React", "React Native", "Next.js", "Remix", "Vue", "Nuxt", "Angular", "Svelte", "SolidJS",
  "TypeScript", "JavaScript", "Node.js", "Express", "Fastify", "NestJS", "Deno", "Bun",
  "GraphQL", "REST APIs", "tRPC", "gRPC", "WebSockets",
  "Redux", "Zustand", "MobX", "TanStack Query", "React Query", "RxJS",
  "HTML", "CSS", "Sass", "Tailwind CSS", "styled-components", "CSS Modules",
  "Jest", "Vitest", "Cypress", "Playwright", "Testing Library", "Storybook",
  "Webpack", "Vite", "Rollup", "esbuild", "Turborepo", "Nx",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Prisma", "Drizzle", "SQL", "Elasticsearch",
  "Docker", "Kubernetes", "Terraform", "AWS", "GCP", "Azure", "Vercel", "Netlify",
  "CI/CD", "GitHub Actions", "Jenkins", "Git", "Linux",
  "Python", "Java", "Go", "Rust", "PHP", "Ruby", "C#", ".NET", "Kotlin", "Swift",
  "Figma", "Accessibility", "WCAG", "SEO", "Performance optimisation", "Micro-frontends",
  "Agile", "Scrum", "Kanban", "Jira", "Design Systems", "Web Vitals", "PWA", "SSR",
];

const STOP_WORDS = new Set(
  `a about above after again against all am an and any are aren as at be because been before being below between both but by can cannot could couldn did didn do does doesn doing don down during each few for from further had hadn has hasn have haven having he her here hers herself him himself his how i if in into is isn it its itself let me more most mustn my myself no nor not of off on once only or other ought our ours ourselves out over own same shan she should shouldn so some such than that the their theirs them themselves then there these they this those through to too under until up very was wasn we were weren what when where which while who whom why with won would wouldn you your yours yourself yourselves will team teams work working role position company you'll we're join experience years year strong good great new using use used help within across also may must able like well including etc our us
`
    .split(/\s+/)
    .filter(Boolean),
);

const REQUIRED_HEADINGS =
  /(requirements|required|must have|what you.ll need|qualifications|we expect|your profile|skills needed)/i;
const PREFERRED_HEADINGS =
  /(nice to have|preferred|bonus|plus|good to have|desirable|advantage|extra credit)/i;
const RESPONSIBILITY_HEADINGS =
  /(responsibilities|what you.ll do|your role|the role|about the job|day to day|duties)/i;

export type JobAnalysis = {
  requiredSkills: string[];
  preferredSkills: string[];
  technologies: string[];
  yearsOfExperience: number | null;
  responsibilities: string[];
  keywords: { word: string; count: number }[];
  wordCount: number;
};

type Section = "required" | "preferred" | "responsibilities" | "other";

function detectSection(line: string, current: Section): Section {
  if (PREFERRED_HEADINGS.test(line)) return "preferred";
  if (REQUIRED_HEADINGS.test(line)) return "required";
  if (RESPONSIBILITY_HEADINGS.test(line)) return "responsibilities";
  return current;
}

function matchTech(text: string) {
  const found: string[] = [];
  for (const tech of TECH_DICTIONARY) {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(^|[^a-z0-9+#.])${escaped}([^a-z0-9+#]|$)`, "i");
    if (pattern.test(text)) found.push(tech);
  }
  return found;
}

export function analyzeJobDescription(input: string): JobAnalysis {
  const text = (input ?? "").trim();
  if (!text) {
    return {
      requiredSkills: [],
      preferredSkills: [],
      technologies: [],
      yearsOfExperience: null,
      responsibilities: [],
      keywords: [],
      wordCount: 0,
    };
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-*–—·]+/, "").trim())
    .filter(Boolean);

  let section: Section = "other";
  const requiredText: string[] = [];
  const preferredText: string[] = [];
  const responsibilities: string[] = [];

  for (const line of lines) {
    const next = detectSection(line, section);
    const isHeading = next !== section || /:$/.test(line);
    section = next;
    if (isHeading && line.length < 80 && /:$/.test(line)) continue;

    if (section === "preferred") preferredText.push(line);
    else if (section === "required") requiredText.push(line);
    else if (section === "responsibilities") responsibilities.push(line);
    else requiredText.push(line);
  }

  const preferred = Array.from(new Set(matchTech(preferredText.join("\n"))));
  const requiredRaw = Array.from(new Set(matchTech(requiredText.join("\n"))));
  const required = requiredRaw.filter((skill) => !preferred.includes(skill));
  const technologies = Array.from(new Set([...required, ...preferred]));

  const yearsMatches = Array.from(
    text.matchAll(/(\d{1,2})\s*\+?\s*(?:-|to)?\s*(\d{1,2})?\s*(?:\+)?\s*years?/gi),
  )
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value > 0 && value < 25);
  const yearsOfExperience = yearsMatches.length > 0 ? Math.min(...yearsMatches) : null;

  const counts = new Map<string, number>();
  for (const word of text.toLowerCase().match(/[a-z][a-z+#.]{2,}/g) ?? []) {
    const clean = word.replace(/\.$/, "");
    if (STOP_WORDS.has(clean) || clean.length < 3) continue;
    counts.set(clean, (counts.get(clean) ?? 0) + 1);
  }
  const keywords = Array.from(counts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 14);

  return {
    requiredSkills: required.slice(0, 18),
    preferredSkills: preferred.slice(0, 12),
    technologies: technologies.slice(0, 24),
    yearsOfExperience,
    responsibilities: responsibilities.slice(0, 8),
    keywords,
    wordCount: text.split(/\s+/).filter(Boolean).length,
  };
}
