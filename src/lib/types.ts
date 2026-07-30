// Entry is experience-only now — Skills and Contacts each grew into their own
// entity (see below) because they need fields/behavior a flat title/date row
// doesn't fit: skills accumulate evidence, contacts need email/phone/LinkedIn
// and are edited after the fact. ScoreCategory is the 3-way readiness split.
export type ScoreCategory = "skill" | "experience" | "contact";

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

// Relationship a contact represents — lets the Profile connections list be
// filtered the way a real network is: not everyone is the same kind of contact.
export type ContactRelationship = "friend" | "mentor" | "recruiter" | "alumni" | "faculty" | "other";

// Type of experience (Internship, Research, ...) — a separate dimension from
// CareerPath: category describes the FORM of the experience, path describes
// its career DIRECTION. "other" is the catch-all for anything that doesn't fit.
export type ExperienceCategory =
  | "internship"
  | "research"
  | "study-abroad"
  | "leadership"
  | "volunteer"
  | "campus-involvement"
  | "project"
  | "other";

export interface Entry {
  id: string;
  title: string; // what you did
  category?: ExperienceCategory; // undefined for legacy entries logged before this field existed
  organization?: string; // where — e.g. "Patagonia Portland"
  location?: string; // e.g. "Portland, OR"
  meta: string; // optional freeform context/detail
  startDate: string; // ISO date "YYYY-MM-DD" — drives the timeline (anchored to start term)
  endDate?: string; // ISO date; absent + ongoing=true reads as "Present"
  ongoing: boolean;
  path: CareerPath; // optional L&C career-path tag
  tools?: string[]; // skills/tools/tech used
  hoursLogged?: number; // optional — e.g. volunteer hours
  link?: string; // optional — GitHub/portfolio/repo link, most useful for "project" entries
}

// --- Contacts: their own entity, not a repurposed Entry ----------------------
// A contact needs fields an experience doesn't (email/phone/LinkedIn) and,
// like skills, should be editable after the fact rather than log-only.

export interface Contact {
  id: string;
  name: string;
  relationship: ContactRelationship;
  path: CareerPath; // industry
  company?: string;
  role?: string; // their job title
  grad?: string; // their class year, if applicable — distinct from the logged-in student's own grad
  strength?: 1 | 2 | 3; // manually-rated relationship strength; undefined (legacy contacts) reads as 1
  email?: string;
  phone?: string;
  linkedin?: string;
  note: string;
  date: string; // ISO date — doubles as "last contact," editable whenever you reconnect
}

// --- Skills: a growing entity, not a one-off log row --------------------------
// A skill is logged once ("Python") and then built up over time by adding
// evidence ("took a CS class", "personal project", "used on the job"). The
// proficiency label is derived from how much evidence exists — see
// levelFor() in scoring.ts — never stored directly, so it can't drift out of
// sync with the evidence list.

export interface SkillEvidence {
  id: string;
  date: string; // ISO date
  description: string;
}

export type SkillLevel = "beginner" | "intermediate" | "advanced";

export interface Skill {
  id: string;
  title: string;
  path: CareerPath; // optional L&C career-path tag
  evidence: SkillEvidence[];
}

export type Role = "student" | "staff";

// --- Applications ------------------------------------------------------------

export type AppSource = "on-campus" | "external";
export type AppStatus = "saved" | "applied" | "interviewing" | "offer" | "rejected";

export interface Application {
  id: string;
  company: string;
  role: string;
  domain?: string; // real employer domain, for a logo lookup — set only when saved from a curated Job
  link: string; // optional URL
  source: AppSource;
  deadline: string; // ISO date, optional ("" if none)
  status: AppStatus;
  notes: string;
  date: string; // ISO date — when this was added/logged
}

// --- Guidance (not a scored pillar — see CLAUDE.md) ---------------------------

export interface AdvisingNote {
  id: string;
  date: string; // ISO date
  note: string;
}

// --- To-do: manual items, alongside computed/dismissible suggestions ---------

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  date: string; // ISO date — when added
}

// Class stage derived from graduation year vs. the current academic year.
export type Stage = "first-year" | "sophomore" | "junior" | "senior";

export interface Student {
  id: string; // equals the Supabase Auth user's id
  role: Role;
  name: string;
  grad: string; // graduation year, e.g. "2027"
  majors: string[]; // double majors supported
  minors: string[];
  interests: string[];
  headline: string; // the student's own goal/aspiration — makes the space theirs
  resumeUrl: string; // link, not a file — there's no backend to host a binary
  linkedin: string;
  avatarUrl: string; // Supabase Storage public URL; "" falls back to initials
  flagged: boolean; // staff outreach flag
  skills: Skill[];
  entries: Entry[]; // experience only — see Skill/Contact above
  contacts: Contact[];
  applications: Application[];
  eventsAttended: string[]; // ids into content.ts EVENTS
  advisingNotes: AdvisingNote[];
  todos: Todo[];
  dismissedSuggestions: string[]; // keys of computed dashboard suggestions the student closed
  onboarded: boolean; // has this account dismissed the first-login WelcomeModal
}

// --- Staff-redacted roster/detail view ---------------------------------------
// Postgres (redact_skills/redact_entries/staff_roster() in supabase/schema.sql)
// strips free-text/PII fields before these ever reach the client. These types
// encode that redaction at compile time: StaffEntryView has no .meta,
// StaffSkillEvidenceView has no .description, and StaffStudent has no
// .contacts array at all — referencing a stripped field is a type error, not
// a silent blank render. scoring.ts's scoreFor/dominantPath/toTimelineItems
// accept these directly (their param types only need what's below), so
// staff's score/stage/dominant-path/timeline are computed by the exact same
// functions as a student's own — see CLAUDE.md's "never stored, single
// source of truth" rule.

export interface StaffSkillEvidenceView {
  id: string;
  date: string; // no description — see redact_skills()
}

export interface StaffSkillView {
  id: string;
  title: string;
  path: CareerPath;
  evidence: StaffSkillEvidenceView[];
}

export interface StaffEntryView {
  id: string;
  title: string;
  category?: ExperienceCategory;
  startDate: string;
  endDate?: string;
  ongoing: boolean;
  path: CareerPath; // no meta/organization/location/tools/hoursLogged/link — see redact_entries()
}

export interface StaffStudent {
  id: string;
  role: Role;
  name: string;
  grad: string;
  majors: string[];
  minors: string[];
  interests: string[];
  headline: string;
  avatarUrl: string;
  flagged: boolean;
  skills: StaffSkillView[];
  entries: StaffEntryView[];
  contactsCount: number; // NOT an array — see staff_roster(), contacts are count-only
  advisingNotes: AdvisingNote[]; // staff-authored, unaffected by redaction
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
  per: Record<ScoreCategory, CategoryScore>;
  stage: Stage;
}

// Common shape the Timeline component renders — skill evidence and Entry rows
// are different shapes, so callers flatten both into this via toTimelineItems()
// in scoring.ts before handing them to <Timeline>.
export interface TimelineItem {
  id: string;
  type: ScoreCategory;
  title: string;
  meta: string;
  date: string;
  path: CareerPath;
}

export type BandKey = "ok" | "mid" | "low";

export interface Band {
  key: BandKey;
  label: string;
  cls: string;
}

