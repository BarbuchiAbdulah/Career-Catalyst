// One unified data model. Every readiness signal is an Entry.
// Deliberately NOT three separate models — see CLAUDE.md for the rationale.

export type EntryType = "skill" | "experience" | "contact";

// Lewis & Clark's real career-path taxonomy (from careercenter.lclark.edu).
// Used as an optional tag on skills/experiences to show whether a student's
// entries cohere toward a direction. "" = untagged.
export type CareerPath =
  | ""
  | "comm-marketing-pr"
  | "arts-design-media"
  | "data-tech-cs"
  | "econ-leadership-innovation"
  | "environment-sustainability-science"
  | "global-diplomacy-languages"
  | "health-wellness"
  | "public-service-law-policy"
  | "social-services-nonprofit-education";

export interface Entry {
  id: string;
  type: EntryType;
  title: string; // "what" for skill/experience, "who" for contact
  meta: string; // optional context: where, when, detail
  date: string; // ISO date "YYYY-MM-DD" — when it happened; drives the timeline
  path: CareerPath; // optional L&C career-path tag (contacts usually "")
}

export type Role = "student" | "staff";

// Class stage derived from graduation year vs. the current academic year.
export type Stage = "first-year" | "sophomore" | "junior" | "senior";

export interface Student {
  id: string;
  name: string;
  grad: string; // graduation year, e.g. "2027"
  major: string;
  headline: string; // the student's own goal/aspiration — makes the space theirs
  flagged: boolean; // staff outreach flag
  entries: Entry[];
}

// Derived, never stored.
export interface CategoryScore {
  n: number; // entries logged in this category
  target: number; // stage-adjusted target for this category
  frac: number; // 0..1 progress toward target
  pct: number; // frac * 100, rounded
}

export interface Readiness {
  score: number; // 0..100, stage-aware
  per: Record<EntryType, CategoryScore>;
  stage: Stage;
}

export type BandKey = "ok" | "mid" | "low";

export interface Band {
  key: BandKey;
  label: string;
  cls: string;
}

