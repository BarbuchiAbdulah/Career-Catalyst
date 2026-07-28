import { useMemo, useRef, useState } from "react";
import type { Student } from "../lib/types";
import {
  CATS,
  ORDER,
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
import type { StudentPage } from "../App";

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

// The signature element: readiness ring wrapping the student's avatar.
function RingAvatar({ score, initial, size = 128 }: { score: number; initial: string; size?: number }) {
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
      <div className="ringavatar-face" aria-hidden="true">{initial}</div>
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
  onNavigate: (page: StudentPage) => void;
}) {
  const [q, setQ] = useState("");
  const [todoText, setTodoText] = useState("");
  const liveRef = useRef<HTMLDivElement>(null);

  function announce(msg: string) {
    if (liveRef.current) liveRef.current.textContent = msg;
  }

  const { score, per, stage } = useMemo(
    () => scoreFor(student.skills, student.entries, student.grad),
    [student.skills, student.entries, student.grad]
  );
  const b = band(score);
  const dom = useMemo(() => dominantPath(student.skills, student.entries), [student.skills, student.entries]);
  const firstName = student.name.split(" ")[0];

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
    const soonest = student.applications
      .filter((a) => a.deadline && a.status !== "rejected")
      .map((a) => ({ a, d: daysUntil(a.deadline) }))
      .filter((x): x is { a: (typeof student.applications)[number]; d: number } => x.d !== null && x.d >= 0 && x.d <= 14)
      .sort((x, y) => x.d - y.d)[0];
    if (soonest) {
      list.push({
        key: `deadline:${soonest.a.id}`,
        text: `${soonest.a.role} at ${soonest.a.company} is due in ${soonest.d}d`,
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
      {/* Top bar: search + identity, matching the reference */}
      <div className="topbar">
        <div className="searchbox">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your timeline…"
            aria-label="Search your timeline"
          />
        </div>
        <div className="topbar-id">
          <span className="topbar-avatar" aria-hidden="true">{student.name.charAt(0)}</span>
          <span className="topbar-name">{firstName}</span>
        </div>
      </div>

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
          <RingAvatar score={score} initial={student.name.charAt(0)} />
          <span className={"pill " + b.cls} style={{ marginTop: 12 }}>
            <span className="dot" style={{ background: bandColor(b.key) }} />
            {b.label}
          </span>
        </div>
      </section>

      {/* Three category stat cards, styled like the reference's "watched" cards */}
      <div className="statcards">
        {ORDER.map((k) => {
          const p = per[k];
          return (
            <div className="statcard" key={k}>
              <span className={"statcard-ic " + k} aria-hidden="true">{CATS[k].label.charAt(0)}</span>
              <div className="statcard-body">
                <span className="statcard-count">{p.n}/{p.target} logged</span>
                <span className="statcard-label">{CATS[k].label}</span>
                <div className="track"><i style={{ width: p.pct + "%" }} /></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick tallies — now clickable, jumping straight to the tab they summarize. */}
      <div className="statcards tally">
        <button className="tile" onClick={() => onNavigate("applications")}>
          <span className="tile-ic" aria-hidden="true">A</span>
          <span className="tile-body">
            <span className="tile-count">{student.applications.length}</span>
            <span className="tile-label">Jobs/internships tracked</span>
          </span>
          <span className="tile-arrow" aria-hidden="true">→</span>
        </button>
        <button className="tile" onClick={() => onNavigate("resources")}>
          <span className="tile-ic" aria-hidden="true">E</span>
          <span className="tile-body">
            <span className="tile-count">{student.eventsAttended.length}</span>
            <span className="tile-label">Events attended</span>
          </span>
          <span className="tile-arrow" aria-hidden="true">→</span>
        </button>
      </div>

      {dom && dom.key && (
        <p className="pathnote">
          Your work leans toward <strong>{pathLabel(dom.key)}</strong> ({dom.n} tagged) — a sign it's cohering toward a direction.
        </p>
      )}

      <StageBar stage={stage} />

      {/* To-do: computed suggestions + the student's own items */}
      <section className="sec" aria-labelledby="todo-h">
        <div className="sec-head"><h2 id="todo-h">To-do</h2></div>
        <form className="logbar" onSubmit={addTodo} style={{ marginBottom: 12 }}>
          <div className="field grow">
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

      {/* Timeline */}
      <section className="sec" aria-labelledby="tl-h">
        <div className="sec-head">
          <h2 id="tl-h">Your four-year timeline</h2>
          <span className="count">{q.trim() ? `${shown.length} of ${timelineItems.length}` : `${timelineItems.length} entries`}</span>
        </div>
        <Timeline entries={shown} />
      </section>

      <div ref={liveRef} className="sr-only" aria-live="polite"></div>
    </>
  );
}
