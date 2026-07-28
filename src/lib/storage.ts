import type { Student } from "./types";
import { SEED_STUDENTS } from "./seed";

const KEY = "career-catalyst:students:v5";

// Load students from localStorage, falling back to seed data on first run
// or if the stored payload is missing/corrupt.
export function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEED_STUDENTS;
    const parsed = JSON.parse(raw) as Student[];
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_STUDENTS;
    return parsed;
  } catch {
    return SEED_STUDENTS;
  }
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(students));
  } catch {
    // Storage full or unavailable (e.g. private mode) — fail silently;
    // the app still works in-memory for the session.
  }
}

export function resetStudents(): Student[] {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return SEED_STUDENTS;
}

