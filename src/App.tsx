import { useEffect, useState } from "react";
import type { Role, Student } from "./lib/types";
import { loadStudents, saveStudents, resetStudents } from "./lib/storage";
import { scoreFor, band, bandColor } from "./lib/scoring";
import { DashboardTab } from "./views/DashboardTab";
import { ProfileTab } from "./views/ProfileTab";
import { ApplicationsTab } from "./views/ApplicationsTab";
import { ResourcesTab } from "./views/ResourcesTab";
import { StaffView } from "./views/StaffView";
import { SettingsView } from "./views/SettingsView";

// Inline SVG icons (no icon dependency). 20px, stroke-based.
const I = {
  dash: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  applications: "M9 3h6a1 1 0 0 1 1 1v1h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2V4a1 1 0 0 1 1-1zM9 3v3h6V3M9 12h6M9 16h6",
  resources: "M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2zM20 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 0 2-2z",
  staff: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  cog: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
};

function Icon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export type StudentPage = "dashboard" | "profile" | "applications" | "resources";

const STUDENT_NAV: { key: StudentPage; label: string; icon: string }[] = [
  { key: "dashboard", label: "My dashboard", icon: I.dash },
  { key: "profile", label: "Profile", icon: I.profile },
  { key: "applications", label: "Applications", icon: I.applications },
  { key: "resources", label: "Resources & Events", icon: I.resources },
];

export default function App() {
  const [role, setRole] = useState<Role>("student");
  const [studentPage, setStudentPage] = useState<StudentPage>("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [drill, setDrill] = useState<string | null>(null);

  useEffect(() => {
    saveStudents(students);
  }, [students]);

  const me = students.find((s) => s.id === "me")!;
  const updateMe = (next: Student) =>
    setStudents((prev) => prev.map((s) => (s.id === "me" ? next : s)));

  function goToPage(p: StudentPage) {
    setStudentPage(p);
    setShowSettings(false);
  }
  function openSettings() {
    setShowSettings(true);
  }
  function changeRole(r: Role) {
    setRole(r);
    setStudentPage("dashboard");
    setDrill(null);
    setShowSettings(false);
  }
  function reset() {
    if (confirm("Reset all demo data to its starting state?")) {
      setStudents(resetStudents());
      setDrill(null);
    }
  }

  // Sidebar "me" mini-score, so the shell feels personal like the reference.
  const meScore = scoreFor(me.skills, me.entries, me.grad).score;
  const meBand = band(meScore);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="side-brand">
          <span className="mark" aria-hidden="true">C</span>
          <span className="side-brandname">Career Catalyst</span>
        </div>

        <nav className="side-nav" aria-label="Main">
          {role === "student" ? (
            <>
              <p className="side-label">Student</p>
              {STUDENT_NAV.map((item) => (
                <button
                  key={item.key}
                  className={"navitem" + (!showSettings && studentPage === item.key ? " active" : "")}
                  onClick={() => goToPage(item.key)}
                  aria-current={!showSettings && studentPage === item.key}
                >
                  <Icon d={item.icon} /> {item.label}
                </button>
              ))}
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
            </>
          ) : (
            <>
              <p className="side-label">Career Center</p>
              <button className={"navitem" + (!showSettings ? " active" : "")} onClick={() => setShowSettings(false)} aria-current={!showSettings}>
                <Icon d={I.staff} /> Student roster
              </button>
            </>
          )}
        </nav>

        <div className="side-foot">
          <p className="side-label">Settings</p>
          <button className={"navitem" + (showSettings ? " active" : "")} onClick={openSettings} aria-current={showSettings}>
            <Icon d={I.cog} /> Settings
          </button>
        </div>
      </aside>

      <main id="main" className="content">
        {showSettings ? (
          <SettingsView role={role} onRoleChange={changeRole} onReset={reset} />
        ) : role === "student" ? (
          studentPage === "dashboard" ? (
            <DashboardTab student={me} onChange={updateMe} onNavigate={goToPage} />
          ) : studentPage === "profile" ? (
            <ProfileTab student={me} onChange={updateMe} />
          ) : studentPage === "applications" ? (
            <ApplicationsTab student={me} onChange={updateMe} />
          ) : (
            <ResourcesTab student={me} onChange={updateMe} />
          )
        ) : (
          <StaffView students={students} setStudents={setStudents} drill={drill} setDrill={setDrill} />
        )}
      </main>
    </div>
  );
}
