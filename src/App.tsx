import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Student } from "./lib/types";
import { supabase, supabaseConfigured } from "./lib/supabaseClient";
import { fetchMe, fetchRoster, upsertMe, resetMe, loadDemoData } from "./lib/storage";
import { scoreFor, band, bandColor } from "./lib/scoring";
import { DashboardTab } from "./views/DashboardTab";
import { ExperiencesTab } from "./views/ExperiencesTab";
import { NetworkTab } from "./views/NetworkTab";
import { ApplicationsTab } from "./views/ApplicationsTab";
import { ResourcesTab } from "./views/ResourcesTab";
import { StaffView } from "./views/StaffView";
import { InsightsTab } from "./views/InsightsTab";
import { SettingsView } from "./views/SettingsView";
import { LoginView } from "./views/LoginView";

// Inline SVG icons (no icon dependency). 20px, stroke-based.
const I = {
  dash: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  applications: "M9 3h6a1 1 0 0 1 1 1v1h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2V4a1 1 0 0 1 1-1zM9 3v3h6V3M9 12h6M9 16h6",
  resources: "M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2zM20 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 0 2-2z",
  staff: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  network: "M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 8v3m-4.5 5.5L11 13m5.5 3.5L13 13",
  experiences: "M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18",
  insights: "M3 3v18h18M7 16v-6M12 16V7M17 16v-3",
  cog: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
};

function Icon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export type StudentPage = "dashboard" | "experiences" | "network" | "applications" | "resources";
export type StaffPage = "roster" | "insights";

const STUDENT_NAV: { key: StudentPage; label: string; icon: string }[] = [
  { key: "dashboard", label: "My dashboard", icon: I.dash },
  { key: "experiences", label: "Experiences", icon: I.experiences },
  { key: "network", label: "Network", icon: I.network },
  { key: "applications", label: "Applications", icon: I.applications },
  { key: "resources", label: "Resources & Events", icon: I.resources },
];

const STAFF_NAV: { key: StaffPage; label: string; icon: string }[] = [
  { key: "roster", label: "Student roster", icon: I.staff },
  { key: "insights", label: "Insights", icon: I.insights },
];

export default function App() {
  // undefined = still checking for an existing session; null = signed out.
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [me, setMe] = useState<Student | null>(null);
  const [roster, setRoster] = useState<Student[]>([]);
  const [loadError, setLoadError] = useState("");

  const [studentPage, setStudentPage] = useState<StudentPage>("dashboard");
  const [staffPage, setStaffPage] = useState<StaffPage>("roster");
  const [showSettings, setShowSettings] = useState(false);
  const [drill, setDrill] = useState<string | null>(null);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabaseConfigured || !session) {
      setMe(null);
      setRoster([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const mine = await fetchMe(session.user.id);
        if (cancelled) return;
        setMe(mine);
        if (mine?.role === "staff") {
          const all = await fetchRoster();
          if (!cancelled) setRoster(all);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Couldn't load your profile.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  function updateMe(next: Student) {
    setMe(next);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      upsertMe(next).catch((err) => console.error("Failed to save:", err));
    }, 500);
  }

  function goToPage(p: StudentPage) {
    setStudentPage(p);
    setShowSettings(false);
  }
  function goToStaffPage(p: StaffPage) {
    setStaffPage(p);
    setShowSettings(false);
    setDrill(null);
  }
  function openSettings() {
    setShowSettings(true);
  }
  async function signOut() {
    await supabase.auth.signOut();
    setStudentPage("dashboard");
    setDrill(null);
    setShowSettings(false);
  }
  async function reset() {
    if (!me || !confirm("Reset your data to blank? This can't be undone.")) return;
    const blank = await resetMe(me.id);
    setMe(blank);
  }
  async function loadDemo() {
    if (!me || !confirm("Load demo data? This will overwrite your current profile.")) return;
    const demo = await loadDemoData(me.id);
    setMe(demo);
  }

  if (!supabaseConfigured) {
    return (
      <div className="authwrap">
        <div className="authcard">
          <p className="eyebrow">Setup needed</p>
          <h1 className="page" style={{ fontSize: 22, marginBottom: 8 }}>Supabase isn't configured yet</h1>
          <p className="lede">
            Copy <code>.env.example</code> to <code>.env.local</code>, fill in your Supabase
            project's URL and anon key, then restart <code>npm run dev</code>.
          </p>
        </div>
      </div>
    );
  }

  if (session === undefined || (session && !me && !loadError)) {
    return (
      <div className="authwrap">
        <p className="lede">Loading…</p>
      </div>
    );
  }

  if (!session) return <LoginView />;

  if (loadError || !me) {
    return (
      <div className="authwrap">
        <div className="authcard">
          <p className="autherror" role="alert">{loadError || "Couldn't load your profile."}</p>
          <button className="btn btn-outline" onClick={signOut}>Sign out and try again</button>
        </div>
      </div>
    );
  }

  const role = me.role;

  // Sidebar "me" mini-score, so the shell feels personal like the reference.
  const meScore = scoreFor(me.skills, me.entries, me.contacts, me.grad).score;
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
              <button type="button" className="side-me" onClick={openSettings} aria-label="Open your profile in Settings">
                <div className="side-me-avatar" aria-hidden="true">
                  {me.avatarUrl ? <img src={me.avatarUrl} alt="" /> : me.name.charAt(0) || "?"}
                </div>
                <div className="side-me-text">
                  <span className="side-me-name">{me.name || "You"}</span>
                  <span className="side-me-sub" style={{ color: bandColor(meBand.key) }}>
                    {meScore}/100 · {meBand.label}
                  </span>
                </div>
              </button>
            </>
          ) : (
            <>
              <p className="side-label">Career Center</p>
              {STAFF_NAV.map((item) => (
                <button
                  key={item.key}
                  className={"navitem" + (!showSettings && staffPage === item.key ? " active" : "")}
                  onClick={() => goToStaffPage(item.key)}
                  aria-current={!showSettings && staffPage === item.key}
                >
                  <Icon d={item.icon} /> {item.label}
                </button>
              ))}
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

      <nav className="bottomnav" aria-label="Main mobile">
        {role === "student" ? (
          STUDENT_NAV.map((item) => (
            <button
              key={item.key}
              className={"bottomnav-tab" + (!showSettings && studentPage === item.key ? " active" : "")}
              onClick={() => goToPage(item.key)}
              aria-current={!showSettings && studentPage === item.key}
            >
              <Icon d={item.icon} />
              <span>{item.label === "My dashboard" ? "Dashboard" : item.label === "Resources & Events" ? "Resources" : item.label}</span>
            </button>
          ))
        ) : (
          STAFF_NAV.map((item) => (
            <button
              key={item.key}
              className={"bottomnav-tab" + (!showSettings && staffPage === item.key ? " active" : "")}
              onClick={() => goToStaffPage(item.key)}
              aria-current={!showSettings && staffPage === item.key}
            >
              <Icon d={item.icon} />
              <span>{item.label === "Student roster" ? "Roster" : item.label}</span>
            </button>
          ))
        )}
        <button className={"bottomnav-tab" + (showSettings ? " active" : "")} onClick={openSettings} aria-current={showSettings}>
          <Icon d={I.cog} />
          <span>Settings</span>
        </button>
      </nav>

      <main id="main" className="content">
        {showSettings ? (
          <SettingsView email={session.user.email ?? ""} onSignOut={signOut} onReset={reset} onLoadDemo={loadDemo} student={me} onChange={updateMe} />
        ) : role === "student" ? (
          studentPage === "dashboard" ? (
            <DashboardTab student={me} onChange={updateMe} onNavigate={goToPage} />
          ) : studentPage === "experiences" ? (
            <ExperiencesTab student={me} onChange={updateMe} />
          ) : studentPage === "network" ? (
            <NetworkTab student={me} onChange={updateMe} />
          ) : studentPage === "applications" ? (
            <ApplicationsTab student={me} onChange={updateMe} />
          ) : (
            <ResourcesTab student={me} onChange={updateMe} />
          )
        ) : staffPage === "insights" ? (
          <InsightsTab students={roster} />
        ) : (
          <StaffView students={roster} setStudents={setRoster} drill={drill} setDrill={setDrill} />
        )}
      </main>
    </div>
  );
}
