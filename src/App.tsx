import { useEffect, useState } from "react";
import type { Role, Student } from "./lib/types";
import { loadStudents, saveStudents, resetStudents } from "./lib/storage";
import { scoreFor, band, bandColor } from "./lib/scoring";
import { StudentView } from "./views/StudentView";
import { StaffView } from "./views/StaffView";

// Inline SVG icons (no icon dependency). 20px, stroke-based.
const I = {
  dash: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  student: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  staff: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  timeline: "M12 8v8M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 12h12",
  cog: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  out: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
};

function Icon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function App() {
  const [role, setRole] = useState<Role>("student");
  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [drill, setDrill] = useState<string | null>(null);

  useEffect(() => {
    saveStudents(students);
  }, [students]);

  const me = students.find((s) => s.id === "me")!;
  const updateMe = (next: Student) =>
    setStudents((prev) => prev.map((s) => (s.id === "me" ? next : s)));

  function switchRole(r: Role) {
    setRole(r);
    setDrill(null);
  }
  function reset() {
    if (confirm("Reset all demo data to its starting state?")) {
      setStudents(resetStudents());
      setDrill(null);
    }
  }

  // Sidebar "me" mini-score, so the shell feels personal like the reference.
  const meScore = scoreFor(me.entries, me.grad).score;
  const meBand = band(meScore);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="side-brand">
          <span className="mark" aria-hidden="true">C</span>
          <span className="side-brandname">Career Catalyst</span>
        </div>

        <nav className="side-nav" aria-label="Main">
          <p className="side-label">Student</p>
          <button className={"navitem" + (role === "student" ? " active" : "")} onClick={() => switchRole("student")} aria-current={role === "student"}>
            <Icon d={I.dash} /> My dashboard
          </button>

          <p className="side-label">Career Center</p>
          <button className={"navitem" + (role === "staff" ? " active" : "")} onClick={() => switchRole("staff")} aria-current={role === "staff"}>
            <Icon d={I.staff} /> Student roster
          </button>

          <p className="side-label">You</p>
          <div className="side-me">
            <div className="side-me-avatar" aria-hidden="true">{me.name.charAt(0)}</div>
            <div className="side-me-text">
              <span className="side-me-name">{me.name}</span>
              <span className="side-me-sub" style={{ color: bandColor(meBand.key) }}>
                {meScore}/100 · {meBand.label}
              </span>
            </div>
          </div>
        </nav>

        <div className="side-foot">
          <p className="side-label">Settings</p>
          <button className="navitem" onClick={reset}>
            <Icon d={I.cog} /> Reset demo data
          </button>
          <button className="navitem danger" onClick={() => switchRole(role === "student" ? "staff" : "student")}>
            <Icon d={I.out} /> Switch to {role === "student" ? "Career Center" : "Student"}
          </button>
        </div>
      </aside>

      <main id="main" className="content">
        {role === "student" ? (
          <StudentView student={me} onChange={updateMe} />
        ) : (
          <StaffView students={students} setStudents={setStudents} drill={drill} setDrill={setDrill} />
        )}
      </main>
    </div>
  );
}

