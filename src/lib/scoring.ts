import type { Entry, EntryType, Readiness, Band, BandKey, Stage, CareerPath } from "./types";

// Category metadata, grounded in NACE career-readiness areas.
// `base` is the SENIOR-year target; earlier stages scale down (see STAGE_FACTOR).
export const CATS: Record<
  EntryType,
  { label: string; help: string; base: number; ex: string }
> = {
  skill: {
    label: "Skills",
    help: "Competencies you can name and show — grounded in NACE career-readiness areas.",
    base: 8,
    ex: "e.g. Data analysis · Public speaking",
  },
  experience: {
    label: "Experience",
    help: "Anything outside class: jobs, internships, research, job shadows, projects.",
    base: 5,
    ex: "e.g. Summer internship · Research assistant",
  },
  contact: {
    label: "Network",
    help: "Real professional connections — advisors, alumni, recruiters, mentors.",
    base: 6,
    ex: "e.g. Alum in your field · Career advisor",
  },
};

export const ORDER: EntryType[] = ["skill", "experience", "contact"];

// Weighted so no single category can carry the whole score. Must sum to 1.
export const WEIGHT: Record<EntryType, number> = {
  skill: 0.34,
  experience: 0.36,
  contact: 0.3,
};

// L&C's nine real career paths. `key` matches CareerPath in types.ts.
export const PATHS: { key: Exclude<CareerPath, "">; label: string }[] = [
  { key: "comm-marketing-pr", label: "Communication, Marketing & PR" },
  { key: "arts-design-media", label: "Creative Arts, Design & Media" },
  { key: "data-tech-cs", label: "Data Science, Tech & Computer Science" },
  { key: "econ-leadership-innovation", label: "Economics, Leadership & Innovation" },
  { key: "environment-sustainability-science", label: "Environment, Sustainability & Natural Sciences" },
  { key: "global-diplomacy-languages", label: "Global Engagement, Diplomacy & World Languages" },
  { key: "health-wellness", label: "Human Development, Health & Wellness" },
  { key: "public-service-law-policy", label: "Public Service, Law & Policy" },
  { key: "social-services-nonprofit-education", label: "Social Services, Non-Profit & Education" },
];

export function pathLabel(key: CareerPath): string {
  return PATHS.find((p) => p.key === key)?.label ?? "";
}

// --- Stage / four-year arc -------------------------------------------------

// Current academic year used to derive a student's stage from their grad year.
// Kept as a constant so scoring is deterministic and testable. Bump each fall.
export const ACADEMIC_YEAR = 2026;

export function stageFor(grad: string): Stage {
  const yearsOut = Number(grad) - ACADEMIC_YEAR; // 0 = graduating this year
  if (yearsOut <= 0) return "senior";
  if (yearsOut === 1) return "junior";
  if (yearsOut === 2) return "sophomore";
  return "first-year";
}

export const STAGE_LABEL: Record<Stage, string> = {
  "first-year": "First-year",
  sophomore: "Sophomore",
  junior: "Junior",
  senior: "Senior",
};

// Fraction of the senior-year target expected BY each stage. This is what makes
// the score stage-aware: the same entries read as "ahead" for a first-year and
// "behind" for a senior, because the denominator grows over four years.
export const STAGE_FACTOR: Record<Stage, number> = {
  "first-year": 0.35,
  sophomore: 0.6,
  junior: 0.8,
  senior: 1,
};

export function targetFor(type: EntryType, stage: Stage): number {
  return Math.max(1, Math.round(CATS[type].base * STAGE_FACTOR[stage]));
}

// --- Score -----------------------------------------------------------------

export function scoreFor(entries: Entry[], grad: string): Readiness {
  const stage = stageFor(grad);
  let total = 0;
  const per = {} as Readiness["per"];
  for (const k of ORDER) {
    const n = entries.filter((e) => e.type === k).length;
    const target = targetFor(k, stage);
    const frac = Math.min(1, n / target);
    per[k] = { n, target, frac, pct: Math.round(frac * 100) };
    total += frac * WEIGHT[k];
  }
  return { score: Math.round(total * 100), per, stage };
}

export function band(score: number): Band {
  if (score >= 70) return { key: "ok", label: "On track", cls: "ok" };
  if (score >= 40) return { key: "mid", label: "Building", cls: "mid" };
  return { key: "low", label: "Needs outreach", cls: "low" };
}

export function bandColor(k: BandKey): string {
  return k === "ok" ? "var(--good)" : k === "mid" ? "var(--orange)" : "var(--warn)";
}

// Dominant career path across a student's tagged entries, or null if none.
// Shows whether their work coheres toward a direction.
export function dominantPath(entries: Entry[]): { key: CareerPath; n: number } | null {
  const counts = new Map<CareerPath, number>();
  for (const e of entries) {
    if (e.path) counts.set(e.path, (counts.get(e.path) ?? 0) + 1);
  }
  let best: { key: CareerPath; n: number } | null = null;
  for (const [key, n] of counts) {
    if (!best || n > best.n) best = { key, n };
  }
  return best;
}

