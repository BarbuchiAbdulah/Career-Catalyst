import { useMemo, useRef, useState } from "react";
import type { Student } from "../lib/types";
import {
  CATS,
  ORDER,
  RELATIONSHIP_LABEL,
  STAGE_LABEL,
  band,
  bandColor,
  dominantPath,
  pathLabel,
  scoreFor,
  toTimelineItems,
} from "../lib/scoring";
import { StageBar } from "../components/Readiness";
import { Timeline } from "../components/Timeline";
import { uid } from "../lib/seed";
import { EVENTS } from "../lib/content";
import type { StudentPage } from "../App";
import type { SubTab as ExperiencesSubTab } from "./ExperiencesTab";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const today = () => new Date().toISOString().slice(0, 10);

function daysUntil(iso: string): number | null {
  if (!iso) return null;
  return Math.round((new Date(iso + "T00:00:00").getTime() - new Date(today() + "T00:00:00").getTime()) / 86400000);
}

function fmtShort(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Small pictorial icons for the dashboard stat cards — same paths as the
// sidebar nav icons where they overlap (experience/network/applications),
// so the same concept reads as the same glyph in both places.
type StatIconKind = "skill" | "experience" | "contact" | "applications" | "events";
function StatIcon({ kind }: { kind: StatIconKind }) {
  const d: Record<StatIconKind, string> = {
    skill: "M12 2l2.4 7.2H22l-6 4.4 2.3 7.1L12 16.3 5.7 20.7 8 13.6l-6-4.4h7.6z",
    experience: "M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18",
    contact: "M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 8v3m-4.5 5.5L11 13m5.5 3.5L13 13",
    applications: "M9 3h6a1 1 0 0 1 1 1v1h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2V4a1 1 0 0 1 1-1zM9 3v3h6V3M9 12h6M9 16h6",
    events: "M8 2v3M16 2v3M3 9h18M3 5h18v16H3z",
  };
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d[kind]} />
    </svg>
  );
}

// The signature element: readiness ring wrapping the student's avatar.
function RingAvatar({ score, initial, avatarUrl, size = 128 }: { score: number; initial: string; avatarUrl?: string; size?: number }) {
  const b = band(score);
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);
  return (
    <div className="ringavatar" style={{ width: size, height: size }} role="img" aria-label={`Readiness ${score} of 100, ${b.label}`}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--paper-2)" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bandColor(b.key)} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(.2,.7,.2,1)" }} />
      </svg>
      <div className="ringavatar-face" aria-hidden="true">
        {avatarUrl ? <img src={avatarUrl} alt="" /> : initial}
      </div>
      <span className="ringavatar-badge" style={{ background: bandColor(b.key) }}>{score}%</span>
    </div>
  );
}

interface Suggestion {
  key: string;
  text: string;
}

export function DashboardTab({
  student,
  onChange,
  onNavigate,
}: {
  student: Student;
  onChange: (next: Student) => void;
  onNavigate: (page: StudentPage, experiencesSubTab?: ExperiencesSubTab) => void;
}) {
  const [q, setQ] = useState("");
  const [todoText, setTodoText] = useState("");
  const liveRef = useRef<HTMLDivElement>(null);

  function announce(msg: string) {
    if (liveRef.current) liveRef.current.textContent = msg;
  }

  const { score, per, stage } = useMemo(
    () => scoreFor(student.skills, student.entries, student.contacts, student.grad),
    [student.skills, student.entries, student.contacts, student.grad]
  );
  const b = band(score);
  const dom = useMemo(
    () => dominantPath(student.skills, student.entries, student.contacts),
    [student.skills, student.entries, student.contacts]
  );
  const recentContacts = useMemo(
    () => [...student.contacts].sort((a, c) => c.date.localeCompare(a.date)).slice(0, 3),
    [student.contacts]
  );
  const firstName = student.name.split(" ")[0];

  const isEmpty =
    student.skills.length === 0 &&
    student.entries.length === 0 &&
    student.contacts.length === 0 &&
    student.applications.length === 0;

  const upcomingDeadlines = useMemo(
    () =>
      student.applications
        .filter((a) => a.deadline && a.status !== "rejected")
        .map((a) => ({ a, d: daysUntil(a.deadline) }))
        .filter((x): x is { a: (typeof student.applications)[number]; d: number } => x.d !== null && x.d >= 0 && x.d <= 30)
        .sort((x, y) => x.d - y.d)
        .slice(0, 4),
    [student.applications]
  );
  const upcomingEvents = useMemo(() => {
    const attended = new Set(student.eventsAttended);
    return EVENTS.filter((e) => !attended.has(e.id) && e.date >= today())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
  }, [student.eventsAttended]);

  const gap = ORDER.map((k) => ({ k, need: per[k].target - per[k].n }))
    .filter((g) => g.need > 0)
    .sort((a, b2) => b2.need - a.need)[0];

  const timelineItems = useMemo(() => toTimelineItems(student.skills, student.entries), [student.skills, student.entries]);
  const shown = q.trim()
    ? timelineItems.filter((e) =>
        (e.title + " " + e.meta + " " + pathLabel(e.path)).toLowerCase().includes(q.toLowerCase())
      )
    : timelineItems;

  // Computed, dismissible nudges — alongside the student's own manual to-dos.
  const suggestions: Suggestion[] = useMemo(() => {
    const list: Suggestion[] = [];
    if (gap) {
      list.push({
        key: `gap:${gap.k}`,
        text: `Log ${gap.need} more ${CATS[gap.k].label.toLowerCase()} ${gap.need === 1 ? "entry" : "entries"} to hit your ${STAGE_LABEL[stage].toLowerCase()} target`,
      });
    }
    if (student.eventsAttended.length === 0) {
      list.push({ key: "no-events", text: "You haven't attended an event yet — check Resources & Events" });
    }
    return list.filter((s) => !student.dismissedSuggestions.includes(s.key));
  }, [gap, stage, student.applications, student.eventsAttended, student.dismissedSuggestions]);

  function dismiss(key: string) {
    onChange({ ...student, dismissedSuggestions: [...student.dismissedSuggestions, key] });
  }
  function addTodo(ev: React.FormEvent) {
    ev.preventDefault();
    const t = todoText.trim();
    if (!t) return;
    onChange({ ...student, todos: [{ id: uid(), text: t, done: false, date: today() }, ...student.todos] });
    setTodoText("");
    announce(`Added to-do: ${t}.`);
  }
  function toggleTodo(id: string) {
    onChange({ ...student, todos: student.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) });
  }
  function delTodo(id: string) {
    onChange({ ...student, todos: student.todos.filter((t) => t.id !== id) });
  }

  return (
    <>
      {/* Greeting banner — the hero, orange, with the ring-avatar as signature */}
      <section className="greet" aria-labelledby="greet-h">
        <div className="greet-copy">
          <p className="greet-eyebrow">Class of {student.grad} · {STAGE_LABEL[stage]}</p>
          <h1 id="greet-h">{greeting()}, {firstName} <span aria-hidden="true">👋</span></h1>
          <p className="greet-sub">{student.headline || "Keep logging as you go — your résumé writes itself."}</p>
          {student.interests.length > 0 && (
            <div className="chiprow" style={{ margin: "2px 0 12px" }}>
              {student.interests.map((i) => (
                <span className="pill chip-accent" key={i}>{i}</span>
              ))}
            </div>
          )}
          <p className="greet-line">
            {gap ? (
              <>Your biggest gap right now is <strong>{CATS[gap.k].label.toLowerCase()}</strong> — {gap.need} more {gap.need === 1 ? "entry" : "entries"} moves the needle most.</>
            ) : (
              <>Strong for your stage. Keep entries fresh and specific.</>
            )}
          </p>
        </div>
        <div className="greet-ring">
          <RingAvatar score={score} initial={student.name.charAt(0)} avatarUrl={student.avatarUrl} />
          <span className={"pill " + b.cls} style={{ marginTop: 12 }}>
            <span className="dot" style={{ background: bandColor(b.key) }} />
            {b.label}
          </span>
        </div>
      </section>

      {isEmpty && (
        <section className="sec" aria-labelledby="start-h">
          <div className="sec-head"><h2 id="start-h">Get started</h2></div>
          <div className="cardgrid">
            <div className="resourcecard">
              <h3>1. Add a skill</h3>
              <p className="jobcard-blurb">Something you already have — it counts.</p>
              <button className="btn btn-sm" onClick={() => onNavigate("experiences")}>Go to Experiences</button>
            </div>
            <div className="resourcecard">
              <h3>2. Log an experience</h3>
              <p className="jobcard-blurb">A job, class project, or volunteer role.</p>
              <button className="btn btn-sm" onClick={() => onNavigate("experiences")}>Go to Experiences</button>
            </div>
            <div className="resourcecard">
              <h3>3. Add a connection</h3>
              <p className="jobcard-blurb">A mentor, professor, or alum you know.</p>
              <button className="btn btn-sm" onClick={() => onNavigate("network")}>Go to Network</button>
            </div>
          </div>
        </section>
      )}

      {/* Unified stat grid — one card language for all five metrics, each a
          clickable shortcut to where you'd go to act on it. */}
      <div className="statgrid">
        {ORDER.map((k) => {
          const p = per[k];
          return (
            <button
              key={k}
              className="statcard2"
              onClick={() => {
                if (k === "skill") onNavigate("experiences", "skills");
                else if (k === "experience") onNavigate("experiences", "experiences");
                else onNavigate("network");
              }}
            >
              <div className="statcard2-top">
                <span className={"statcard-ic " + k}><StatIcon kind={k} /></span>
                <span className="statcard2-arrow" aria-hidden="true">→</span>
              </div>
              <span className="statcard2-label">{CATS[k].label}</span>
              <span className="statcard2-value">{p.frac >= 1 ? `${p.n} · goal met` : `${p.n} of ${p.target}`}</span>
              <div className="track"><i style={{ width: p.pct + "%" }} /></div>
            </button>
          );
        })}
        <button className="statcard2" onClick={() => onNavigate("applications")}>
          <div className="statcard2-top">
            <span className="tile-ic"><StatIcon kind="applications" /></span>
            <span className="statcard2-arrow" aria-hidden="true">→</span>
          </div>
          <span className="statcard2-label">Applications</span>
          <span className="statcard2-value">{student.applications.length} tracked</span>
        </button>
        <button className="statcard2" onClick={() => onNavigate("resources")}>
          <div className="statcard2-top">
            <span className="tile-ic"><StatIcon kind="events" /></span>
            <span className="statcard2-arrow" aria-hidden="true">→</span>
          </div>
          <span className="statcard2-label">Events</span>
          <span className="statcard2-value">{student.eventsAttended.length} attended</span>
        </button>
      </div>

      {dom && dom.key && (
        <p className="pathnote">
          Your work leans toward <strong>{pathLabel(dom.key)}</strong> ({dom.n} tagged) — a sign it's cohering toward a direction.
        </p>
      )}

      <StageBar stage={stage} />

      <div className="dashsplit">
        {/* Upcoming: application deadlines + not-yet-attended events */}
        <section className="sec upcoming-block" aria-labelledby="up-h">
          <div className="sec-head"><h2 id="up-h">Upcoming</h2></div>
          {upcomingDeadlines.length === 0 && upcomingEvents.length === 0 ? (
            <div className="empty">Nothing coming up in the next 30 days.</div>
          ) : (
            <div className="upcomingbox">
              {upcomingDeadlines.map(({ a, d }) => (
                <button key={`dl-${a.id}`} className="upcomingrow" onClick={() => onNavigate("applications")}>
                  <span className="upcomingtag deadline">Deadline</span>
                  <span className="upcomingmain">
                    <span className="upcomingtitle">{a.role}</span>
                    <span className="upcomingsub">{a.company}</span>
                  </span>
                  <span className="upcomingwhen">{d <= 0 ? (d === 0 ? "Today" : "Past due") : `${d}d left`}</span>
                </button>
              ))}
              {upcomingEvents.map((e) => (
                <button key={`ev-${e.id}`} className="upcomingrow" onClick={() => onNavigate("resources")}>
                  <span className="upcomingtag event">Event</span>
                  <span className="upcomingmain">
                    <span className="upcomingtitle">{e.title}</span>
                    <span className="upcomingsub">{e.location}</span>
                  </span>
                  <span className="upcomingwhen">{fmtShort(e.date)}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* To-do: computed suggestions + the student's own items */}
        <section className="sec todo-block" aria-labelledby="todo-h">
          <div className="sec-head"><h2 id="todo-h">To-do</h2></div>
          <form className="todoaddrow" onSubmit={addTodo} style={{ marginBottom: 12 }}>
            <div className="field">
              <label htmlFor="todo-text">Add something to keep track of</label>
              <input id="todo-text" value={todoText} onChange={(e) => setTodoText(e.target.value)} placeholder="e.g. Update resume link before the career fair" />
            </div>
            <button className="btn" type="submit">Add</button>
          </form>
          {suggestions.length === 0 && student.todos.length === 0 ? (
            <div className="empty">Nothing on your list — you're caught up.</div>
          ) : (
            <ul className="todolist">
              {suggestions.map((s) => (
                <li key={s.key} className="todo-suggested">
                  <span className="badge-suggested">Suggested</span>
                  <span className="todo-text">{s.text}</span>
                  <button className="del" onClick={() => dismiss(s.key)}>Dismiss</button>
                </li>
              ))}
              {student.todos.map((t) => (
                <li key={t.id}>
                  <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t.id)} aria-label={`Mark "${t.text}" ${t.done ? "not done" : "done"}`} />
                  <span className={"todo-text" + (t.done ? " done" : "")}>{t.text}</span>
                  <button className="del" onClick={() => delTodo(t.id)} aria-label={`Remove ${t.text}`}>Remove</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Connections get their own quiet spot rather than crowding the growth timeline */}
      <section className="sec" aria-labelledby="conn-h">
        <div className="sec-head">
          <h2 id="conn-h">Recent connections</h2>
          <button className="linkbtn" onClick={() => onNavigate("network")}>See all in Network →</button>
        </div>
        {recentContacts.length === 0 ? (
          <div className="empty">No connections logged yet.</div>
        ) : (
          <ul className="entries">
            {recentContacts.map((c) => (
              <li key={c.id}>
                <span className="tag contact">{RELATIONSHIP_LABEL[c.relationship]}</span>
                <span className="entry-main">
                  <span className="t">{c.name}</span>
                  {c.note && <span className="m">{c.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Timeline */}
      <section className="sec" aria-labelledby="tl-h">
        <div className="sec-head">
          <h2 id="tl-h">Your four-year timeline</h2>
          <div className="row" style={{ gap: 14, alignItems: "center" }}>
            <label className="sec-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" />
              </svg>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search timeline…"
                aria-label="Search your timeline"
              />
            </label>
            <span className="count">{q.trim() ? `${shown.length} of ${timelineItems.length}` : `${timelineItems.length} entries`}</span>
          </div>
        </div>
        <Timeline entries={shown} />
      </section>

      <div ref={liveRef} className="sr-only" aria-live="polite"></div>
    </>
  );
}
