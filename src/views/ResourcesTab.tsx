import { useRef, useState } from "react";
import type { AdvisingNote, Student } from "../lib/types";
import {
  ALUMNI_DIRECTORY,
  ARTICLES,
  CAREER_SERVICES,
  EVENTS,
  PATH_INFO,
  RESUME_TEMPLATES,
} from "../lib/content";
import { PATHS, pathLabel } from "../lib/scoring";
import { uid } from "../lib/seed";

const today = () => new Date().toISOString().slice(0, 10);

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ResourcesTab({
  student,
  onChange,
}: {
  student: Student;
  onChange: (next: Student) => void;
}) {
  const [note, setNote] = useState("");
  const liveRef = useRef<HTMLDivElement>(null);

  function announce(msg: string) {
    if (liveRef.current) liveRef.current.textContent = msg;
  }

  const attended = new Set(student.eventsAttended);
  function toggleEvent(id: string, title: string) {
    const next = attended.has(id) ? student.eventsAttended.filter((x) => x !== id) : [...student.eventsAttended, id];
    onChange({ ...student, eventsAttended: next });
    announce(attended.has(id) ? `Unmarked ${title} as attended.` : `Marked ${title} as attended.`);
  }

  const savedNames = new Set(student.entries.filter((e) => e.type === "contact").map((e) => e.title));
  function saveAlumni(a: (typeof ALUMNI_DIRECTORY)[number]) {
    if (savedNames.has(a.name)) return;
    onChange({
      ...student,
      entries: [
        {
          id: uid(),
          type: "contact",
          title: a.name,
          meta: `${a.role} · Class of ${a.grad}`,
          date: today(),
          path: a.path,
          relationship: "alumni",
        },
        ...student.entries,
      ],
    });
    announce(`Saved ${a.name} to your connections.`);
  }

  function addNote(ev: React.FormEvent) {
    ev.preventDefault();
    const n = note.trim();
    if (!n) return;
    const entry: AdvisingNote = { id: uid(), date: today(), note: n };
    onChange({ ...student, advisingNotes: [entry, ...student.advisingNotes] });
    setNote("");
    announce("Advising note added.");
  }
  function delNote(id: string) {
    onChange({ ...student, advisingNotes: student.advisingNotes.filter((n) => n.id !== id) });
  }

  const sortedEvents = [...EVENTS].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <p className="eyebrow">Resources &amp; Events</p>
      <h1 className="page">Everything the Career Center has for you</h1>
      <p className="lede">
        Templates, career-path explainers, upcoming events, alumni to connect with, and a direct
        line to the Career Center itself.
      </p>

      {/* Career Center services — highest-intent action, so it leads the tab */}
      <section className="sec" aria-labelledby="svc-h">
        <div className="sec-head"><h2 id="svc-h">Career Center services</h2></div>
        <div className="cardgrid">
          {CAREER_SERVICES.map((s) => (
            <div className="resourcecard" key={s.id}>
              <h3>{s.title}</h3>
              <p className="jobcard-blurb">{s.description}</p>
              <button className="btn btn-sm btn-outline" type="button">{s.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* Resume templates */}
      <section className="sec" aria-labelledby="tmpl-h">
        <div className="sec-head"><h2 id="tmpl-h">Resume templates</h2></div>
        <div className="cardgrid">
          {RESUME_TEMPLATES.map((t) => (
            <details className="resourcecard" key={t.id}>
              <summary>
                <h3>{t.title}</h3>
                <p className="jobcard-blurb">{t.summary}</p>
              </summary>
              <ul className="tmpl-bullets">
                {t.bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </details>
          ))}
        </div>
      </section>

      {/* Articles */}
      <section className="sec" aria-labelledby="art-h">
        <div className="sec-head"><h2 id="art-h">From the Career Center</h2></div>
        <div className="cardgrid">
          {ARTICLES.map((a) => (
            <div className="resourcecard" key={a.id}>
              <h3>{a.title}</h3>
              <p className="jobcard-blurb">{a.excerpt}</p>
              {a.tag && <span className="pathchip">{pathLabel(a.tag)}</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Explore paths */}
      <section className="sec" aria-labelledby="path-h">
        <div className="sec-head"><h2 id="path-h">Explore career paths</h2></div>
        <div className="cardgrid">
          {PATHS.map((p) => (
            <div className="resourcecard" key={p.key}>
              <h3>{p.label}</h3>
              <p className="jobcard-blurb">{PATH_INFO[p.key].blurb}</p>
              <p className="jobcard-blurb" style={{ fontStyle: "italic" }}>{PATH_INFO[p.key].insight}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Events */}
      <section className="sec" aria-labelledby="evt-h">
        <div className="sec-head">
          <h2 id="evt-h">Upcoming events</h2>
          <span className="count">{attended.size} attended</span>
        </div>
        <div className="cardgrid">
          {sortedEvents.map((e) => (
            <div className="eventcard" key={e.id}>
              <div className="eventbanner">{e.path ? pathLabel(e.path) : "General"}</div>
              <div className="eventbody">
                <p className="jobcard-org" style={{ marginBottom: 4 }}>{fmtDate(e.date)} · {e.location}</p>
                <h3>{e.title}</h3>
                {e.blurb && <p className="jobcard-blurb">{e.blurb}</p>}
                <button
                  className={"filterchip" + (attended.has(e.id) ? " active" : "")}
                  aria-pressed={attended.has(e.id)}
                  onClick={() => toggleEvent(e.id, e.title)}
                  style={{ marginTop: 8 }}
                >
                  {attended.has(e.id) ? "✓ Attended" : "Mark attended"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Alumni / student directory */}
      <section className="sec" aria-labelledby="alum-h">
        <div className="sec-head"><h2 id="alum-h">Alumni to connect with</h2></div>
        <div className="cardgrid">
          {ALUMNI_DIRECTORY.map((a) => {
            const saved = savedNames.has(a.name);
            return (
              <div className="resourcecard" key={a.id}>
                <span className="avatarring" aria-hidden="true">{a.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                <h3>{a.name}</h3>
                <p className="jobcard-org">{a.role} · Class of {a.grad}</p>
                <p className="jobcard-blurb">{a.blurb}</p>
                <span className="pathchip">{pathLabel(a.path)}</span>
                <button className="btn btn-sm" disabled={saved} onClick={() => saveAlumni(a)}>
                  {saved ? "Saved" : "Save as connection"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Advising notes — Guidance, from the real logbook, without becoming a scored pillar */}
      <section className="sec" aria-labelledby="adv-h">
        <div className="sec-head"><h2 id="adv-h">Your advising notes</h2></div>
        <p className="lede" style={{ marginBottom: 12 }}>
          Action items and insights from meetings with your advisor, faculty, or a peer mentor.
        </p>
        <form className="logbar" onSubmit={addNote}>
          <div className="field grow">
            <label htmlFor="adv-note">New note</label>
            <input id="adv-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Action item from meeting with advisor" />
          </div>
          <button className="btn" type="submit">Add note</button>
        </form>
        {student.advisingNotes.length === 0 ? (
          <div className="empty">No advising notes yet.</div>
        ) : (
          <ul className="entries">
            {student.advisingNotes.map((n) => (
              <li key={n.id}>
                <span className="tag contact">{fmtDate(n.date)}</span>
                <span className="entry-main">
                  <span className="t">{n.note}</span>
                </span>
                <button className="del" onClick={() => delNote(n.id)} aria-label="Remove note">Remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div ref={liveRef} className="sr-only" aria-live="polite"></div>
    </>
  );
}
