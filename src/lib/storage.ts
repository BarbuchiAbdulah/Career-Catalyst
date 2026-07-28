import { supabase } from "./supabaseClient";
import type { Student } from "./types";

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
  flagged: boolean;
  skills: Student["skills"];
  entries: Student["entries"];
  applications: Student["applications"];
  events_attended: string[];
  advising_notes: Student["advisingNotes"];
  todos: Student["todos"];
  dismissed_suggestions: string[];
}

function fromRow(row: StudentRow): Student {
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
    flagged: row.flagged,
    skills: row.skills,
    entries: row.entries,
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
    flagged: s.flagged,
    skills: s.skills,
    entries: s.entries,
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
    flagged: false,
    skills: [],
    entries: [],
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
