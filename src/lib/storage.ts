import { supabase } from "./supabaseClient";
import type { AdvisingNote, Contact, Entry, Student } from "./types";

const today = () => new Date().toISOString().slice(0, 10);

// Row shape as it lives in Postgres (see supabase/schema.sql) — snake_case,
// jsonb collections typed loosely since no generated DB types are wired up.
interface StudentRow {
  id: string;
  role: Student["role"];
  name: string;
  grad: string;
  majors: string[];
  minors: string[];
  interests: string[];
  headline: string;
  resume_url: string;
  linkedin: string;
  avatar_url: string;
  flagged: boolean;
  skills: Student["skills"];
  entries: unknown[];
  contacts: Student["contacts"];
  applications: Student["applications"];
  events_attended: string[];
  advising_notes: Student["advisingNotes"];
  todos: Student["todos"];
  dismissed_suggestions: string[];
}

// `entries` shape changed twice across earlier rounds (skill|experience|contact
// with a single `date`, then experience|contact, then experience-only with
// startDate/endDate/ongoing). Real accounts created before this round's
// migration still have rows in the old shape. Normalize on read so nothing
// crashes on a missing `startDate` — any legacy "contact"-typed entries get
// folded into `contacts` (deduped against what's already there), and the
// fix persists itself the next time this student's data is saved.
function migrateEntries(raw: unknown[], existingContacts: Contact[]): { entries: Entry[]; contacts: Contact[] } {
  const entries: Entry[] = [];
  const contacts: Contact[] = [...existingContacts];
  const knownNames = new Set(existingContacts.map((c) => c.name));
  for (const item of raw ?? []) {
    const e = item as Record<string, unknown>;
    if (e.type === "contact") {
      const name = (e.title as string) ?? (e.name as string) ?? "Unknown";
      if (knownNames.has(name)) continue; // already migrated in a prior load
      knownNames.add(name);
      contacts.push({
        id: (e.id as string) ?? crypto.randomUUID(),
        name,
        relationship: (e.relationship as Contact["relationship"]) ?? "other",
        path: (e.path as Contact["path"]) ?? "",
        note: (e.meta as string) ?? "",
        date: (e.date as string) ?? (e.startDate as string) ?? today(),
      });
      continue;
    }
    if (e.type === "skill") continue; // shouldn't occur in practice — skills moved out earlier; drop defensively
    entries.push({
      id: (e.id as string) ?? crypto.randomUUID(),
      title: (e.title as string) ?? "",
      meta: (e.meta as string) ?? "",
      startDate: (e.startDate as string) ?? (e.date as string) ?? today(),
      endDate: e.endDate as string | undefined,
      ongoing: (e.ongoing as boolean) ?? false,
      path: (e.path as Entry["path"]) ?? "",
      tools: e.tools as string[] | undefined,
    });
  }
  return { entries, contacts };
}

function fromRow(row: StudentRow): Student {
  const { entries, contacts } = migrateEntries(row.entries, row.contacts ?? []);
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    grad: row.grad,
    majors: row.majors,
    minors: row.minors,
    interests: row.interests,
    headline: row.headline,
    resumeUrl: row.resume_url,
    linkedin: row.linkedin,
    avatarUrl: row.avatar_url,
    flagged: row.flagged,
    skills: row.skills,
    entries,
    contacts,
    applications: row.applications,
    eventsAttended: row.events_attended,
    advisingNotes: row.advising_notes,
    todos: row.todos,
    dismissedSuggestions: row.dismissed_suggestions,
  };
}

// Everything but id/role/created_at — those are server-assigned and never
// touched by a client update.
function toRow(s: Student) {
  return {
    name: s.name,
    grad: s.grad,
    majors: s.majors,
    minors: s.minors,
    interests: s.interests,
    headline: s.headline,
    resume_url: s.resumeUrl,
    linkedin: s.linkedin,
    avatar_url: s.avatarUrl,
    flagged: s.flagged,
    skills: s.skills,
    entries: s.entries,
    contacts: s.contacts,
    applications: s.applications,
    events_attended: s.eventsAttended,
    advising_notes: s.advisingNotes,
    todos: s.todos,
    dismissed_suggestions: s.dismissedSuggestions,
  };
}

// The signed-in user's own row. RLS guarantees this is either their row or
// nothing — never someone else's.
export async function fetchMe(userId: string): Promise<Student | null> {
  const { data, error } = await supabase.from("students").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as StudentRow) : null;
}

// Every student row — only actually returns more than one's own row when the
// caller is staff (enforced by the students_select RLS policy, not by this
// function).
export async function fetchRoster(): Promise<Student[]> {
  const { data, error } = await supabase.from("students").select("*").order("name");
  if (error) throw error;
  return (data as StudentRow[]).map(fromRow);
}

export async function upsertMe(next: Student): Promise<void> {
  const { error } = await supabase.from("students").update(toRow(next)).eq("id", next.id);
  if (error) throw error;
}

// Staff-only — goes through the set_student_flag RPC (security definer) so a
// staff account never gets a blanket UPDATE grant on other students' rows.
export async function setFlag(studentId: string, flagged: boolean): Promise<void> {
  const { error } = await supabase.rpc("set_student_flag", { target_id: studentId, is_flagged: flagged });
  if (error) throw error;
}

// Staff-only — goes through the add_advising_note RPC (security definer) for
// the same reason setFlag does: no blanket UPDATE grant on other students' rows.
export async function addAdvisingNote(studentId: string, note: AdvisingNote): Promise<void> {
  const { error } = await supabase.rpc("add_advising_note", {
    target_id: studentId,
    note_id: note.id,
    note_date: note.date,
    note_text: note.note,
  });
  if (error) throw error;
}

// Resets the current user's own data back to blank. There's no shared seed
// data to reset to anymore — every account's data is its own.
export async function resetMe(userId: string): Promise<Student> {
  const blank = {
    name: "",
    grad: "",
    majors: [],
    minors: [],
    interests: [],
    headline: "",
    resume_url: "",
    linkedin: "",
    avatar_url: "",
    flagged: false,
    skills: [],
    entries: [],
    contacts: [],
    applications: [],
    events_attended: [],
    advising_notes: [],
    todos: [],
    dismissed_suggestions: [],
  };
  const { data, error } = await supabase.from("students").update(blank).eq("id", userId).select().single();
  if (error) throw error;
  return fromRow(data as StudentRow);
}
