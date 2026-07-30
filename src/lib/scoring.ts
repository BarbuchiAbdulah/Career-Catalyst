import type { ExperienceCategory, ScoreCategory, Readiness, Band, BandKey, Stage, CareerPath, ContactRelationship, SkillLevel, TimelineItem } from "./types";

// Category metadata, grounded in NACE career-readiness areas.
// `base` is the SENIOR-year target; earlier stages scale down (see STAGE_FACTOR).
export const CATS: Record<
  ScoreCategory,
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

export const ORDER: ScoreCategory[] = ["skill", "experience", "contact"];

// Weighted so no single category can carry the whole score. Must sum to 1.
export const WEIGHT: Record<ScoreCategory, number> = {
  skill: 0.34,
  experience: 0.36,
  contact: 0.3,
};

// L&C's nine real career paths. `key` matches CareerPath in types.ts.
export const PATHS: { key: Exclude<CareerPath, "">; label: string }[] = [
  { key: "comm-marketing-pr", label: "Communication, Marketing & PR" },
  { key: "arts-design-media", label: "Creative Arts, Design & Media" },
  { key: "data-tech-cs", label: "Data Science, Tech & Computer Science" },
  { key: "econ-leadership-innovation", label: "Economics, Organizational Leadership & Innovation" },
  { key: "environment-sustainability-science", label: "Environment, Sustainability & Natural Sciences" },
  { key: "global-diplomacy-languages", label: "Global Engagement, Diplomacy & World Languages" },
  { key: "health-wellness", label: "Human Development, Health & Wellness" },
  { key: "public-service-law-policy", label: "Public Service, Law & Policy" },
  { key: "social-services-nonprofit-education", label: "Social Services, Non-Profit & Education" },
];

export function pathLabel(key: CareerPath): string {
  return PATHS.find((p) => p.key === key)?.label ?? "";
}

// Relationship types a contact entry can carry — lets Profile's Connections list be
// filtered the way a real network actually breaks down.
export const RELATIONSHIPS: ContactRelationship[] = ["mentor", "faculty", "alumni", "recruiter", "friend", "other"];

// Experience-type taxonomy — a separate dimension from CareerPath (see Entry
// in types.ts). Order here is display order for the filter chips.
export const EXPERIENCE_CATEGORIES: ExperienceCategory[] = [
  "internship",
  "research",
  "study-abroad",
  "leadership",
  "volunteer",
  "campus-involvement",
  "project",
  "other",
];

export const EXPERIENCE_CATEGORY_LABEL: Record<ExperienceCategory, string> = {
  internship: "Internship",
  research: "Research",
  "study-abroad": "Study Abroad",
  leadership: "Leadership",
  volunteer: "Volunteer",
  "campus-involvement": "Campus Involvement",
  project: "Project",
  other: "Other",
};

export const RELATIONSHIP_LABEL: Record<ContactRelationship, string> = {
  mentor: "Mentor",
  faculty: "Professor",
  alumni: "Alumni",
  recruiter: "Recruiter",
  friend: "Friend",
  other: "Industry",
};

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

export function targetFor(cat: ScoreCategory, stage: Stage): number {
  return Math.max(1, Math.round(CATS[cat].base * STAGE_FACTOR[stage]));
}

// --- Score -----------------------------------------------------------------

export function scoreFor(
  skills: { length: number },
  entries: { length: number },
  contacts: { length: number },
  grad: string
): Readiness {
  const stage = stageFor(grad);
  const counts: Record<ScoreCategory, number> = {
    skill: skills.length,
    experience: entries.length,
    contact: contacts.length,
  };
  let total = 0;
  const per = {} as Readiness["per"];
  for (const k of ORDER) {
    const n = counts[k];
    const target = targetFor(k, stage);
    const frac = Math.min(1, n / target);
    per[k] = { n, target, frac, pct: Math.round(frac * 100) };
    total += frac * WEIGHT[k];
  }
  return { score: Math.round(total * 100), per, stage };
}

// --- Skill proficiency -------------------------------------------------------
// Derived purely from how much evidence exists, so it can never drift out of
// sync with what's actually logged.

export function levelFor(evidenceCount: number): SkillLevel {
  if (evidenceCount >= 4) return "advanced";
  if (evidenceCount >= 2) return "intermediate";
  return "beginner";
}

export const SKILL_LEVEL_LABEL: Record<SkillLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

// Evidence count that reaches "advanced" — used to size the progress bar.
export const ADVANCED_AT = 4;

export function band(score: number): Band {
  if (score >= 70) return { key: "ok", label: "On track", cls: "ok" };
  if (score >= 40) return { key: "mid", label: "Building", cls: "mid" };
  return { key: "low", label: "Needs outreach", cls: "low" };
}

export function bandColor(k: BandKey): string {
  return k === "ok" ? "var(--good)" : k === "mid" ? "var(--orange)" : "var(--warn)";
}

interface TimelineSkillLike {
  title: string;
  path: CareerPath;
  evidence: { id: string; date: string; description?: string }[];
}
interface TimelineEntryLike {
  id: string;
  title: string;
  meta?: string;
  startDate: string;
  path: CareerPath;
}

// Flattens skills (one row per evidence entry) + experience entries into the
// common shape <Timeline> renders. Contacts are deliberately NOT included —
// a connection isn't a "growth moment" the way a skill or experience is, and
// it would just duplicate Profile's Connections list; see DashboardTab's
// separate "Recent connections" card instead. An ongoing/ranged experience is
// anchored to its start term rather than duplicated across every term it spans.
// Widened to structural types (not concrete Skill[]/Entry[]) so this also
// accepts staff's redacted StaffSkillView[]/StaffEntryView[] — description/
// meta are optional on those, so they fall back to "", which is also the
// correct staff behavior: no free text, same as scoreFor/dominantPath below.
export function toTimelineItems(skills: TimelineSkillLike[], entries: TimelineEntryLike[]): TimelineItem[] {
  const fromSkills: TimelineItem[] = skills.flatMap((s) =>
    s.evidence.map((ev) => ({ id: ev.id, type: "skill" as const, title: s.title, meta: ev.description ?? "", date: ev.date, path: s.path }))
  );
  const fromEntries: TimelineItem[] = entries.map((e) => ({ id: e.id, type: "experience" as const, title: e.title, meta: e.meta ?? "", date: e.startDate, path: e.path }));
  return [...fromSkills, ...fromEntries];
}

// Dominant career path across a student's tagged skills + entries + contacts,
// or null if none. Shows whether their work coheres toward a direction.
// `contacts` is optional: staff's redacted view carries no per-item contact
// path at all (contacts are count-only for staff), so a staff caller omits
// it and dominant path is computed from skills+entries only.
export function dominantPath(
  skills: { path: CareerPath }[],
  entries: { path: CareerPath }[],
  contacts?: { path: CareerPath }[]
): { key: CareerPath; n: number } | null {
  const counts = new Map<CareerPath, number>();
  for (const s of skills) {
    if (s.path) counts.set(s.path, (counts.get(s.path) ?? 0) + 1);
  }
  for (const e of entries) {
    if (e.path) counts.set(e.path, (counts.get(e.path) ?? 0) + 1);
  }
  for (const c of contacts ?? []) {
    if (c.path) counts.set(c.path, (counts.get(c.path) ?? 0) + 1);
  }
  let best: { key: CareerPath; n: number } | null = null;
  for (const [key, n] of counts) {
    if (!best || n > best.n) best = { key, n };
  }
  return best;
}

// Most recent activity date across a student's skill evidence + entries, or ""
// if nothing has been logged yet. Derived, never stored, so it can't drift out
// of sync with the timeline — same rule as score/level/dominant path.
export function lastActivityFor(skills: TimelineSkillLike[], entries: TimelineEntryLike[]): string {
  const dates = toTimelineItems(skills, entries).map((i) => i.date);
  return dates.length ? dates.reduce((max, d) => (d > max ? d : max)) : "";
}

