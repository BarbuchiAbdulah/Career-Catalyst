import type { Student } from "./types";
import { SKILL_LEVEL_LABEL, dominantPath, levelFor, pathLabel } from "./scoring";

function fmtMonth(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function dateRange(e: { startDate: string; endDate?: string; ongoing: boolean }): string {
  const start = fmtMonth(e.startDate);
  if (e.ongoing) return `${start} – Present`;
  if (e.endDate) return `${start} – ${fmtMonth(e.endDate)}`;
  return start;
}

// Plain-text resume bullets drafted entirely from what's already logged —
// nothing here is stored; it's regenerated live so it can never go stale.
export function resumeBullets(student: Student): string {
  const lines: string[] = [];
  if (student.name) lines.push(student.name);
  if (student.headline) lines.push(student.headline);
  lines.push("");

  if (student.majors.length || student.minors.length || student.grad) {
    lines.push("EDUCATION");
    lines.push(`Lewis & Clark College${student.grad ? `, Class of ${student.grad}` : ""}`);
    if (student.majors.length) lines.push(`Major${student.majors.length > 1 ? "s" : ""}: ${student.majors.join(", ")}`);
    if (student.minors.length) lines.push(`Minor${student.minors.length > 1 ? "s" : ""}: ${student.minors.join(", ")}`);
    lines.push("");
  }

  const sortedEntries = [...student.entries].sort((a, b) => b.startDate.localeCompare(a.startDate));
  if (sortedEntries.length) {
    lines.push("EXPERIENCE");
    for (const e of sortedEntries) {
      const org = e.organization ? `, ${e.organization}` : "";
      lines.push(`${e.title}${org} (${dateRange(e)})`);
      if (e.meta) lines.push(`- ${e.meta}`);
      if (e.tools && e.tools.length) lines.push(`- Tools/skills used: ${e.tools.join(", ")}`);
      lines.push("");
    }
  }

  if (student.skills.length) {
    lines.push("SKILLS");
    lines.push(student.skills.map((s) => `${s.title} (${SKILL_LEVEL_LABEL[levelFor(s.evidence.length)]})`).join(" · "));
  }

  return lines.join("\n").trim();
}

// A short LinkedIn "About" paragraph, same reuse-only-logged-data rule.
export function linkedinBlurb(student: Student): string {
  const dom = dominantPath(student.skills, student.entries, student.contacts);
  const topSkills = [...student.skills]
    .sort((a, b) => b.evidence.length - a.evidence.length)
    .slice(0, 3)
    .map((s) => s.title);
  const major = student.majors[0];

  const parts: string[] = [];
  parts.push(`${major ? `${major} student` : "Student"} at Lewis & Clark College${student.grad ? `, Class of ${student.grad}` : ""}.`);
  if (student.headline) parts.push(`${student.headline}.`);
  if (dom && dom.key) parts.push(`Focused on ${pathLabel(dom.key)}.`);
  if (topSkills.length) parts.push(`Building skills in ${topSkills.join(", ")}.`);
  if (student.entries.length) {
    const latest = [...student.entries].sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
    parts.push(`Recently: ${latest.title}${latest.organization ? ` at ${latest.organization}` : ""}.`);
  }
  return parts.join(" ");
}
