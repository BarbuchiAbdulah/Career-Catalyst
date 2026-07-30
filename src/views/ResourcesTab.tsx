import { useRef, useState } from "react";
import type { CareerPath, Student } from "../lib/types";
import {
  ARTICLES,
  CAREER_CENTER,
  CAREER_SERVICES,
  EVENTS,
  PATH_INFO,
  RESUME_TEMPLATES,
} from "../lib/content";
import { PATHS, pathLabel } from "../lib/scoring";

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// A horizontally scrolling row with keyboard-operable prev/next buttons, so
// browsing events/alumni doesn't depend on touch-scroll or drag alone.
// Exported — NetworkTab's "Explore alumni" subtab reuses this for the same
// browsing pattern, same as it already reuses MailIcon/LinkedinIcon below.
export function CarouselRow({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  function scroll(dir: 1 | -1) {
    ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  }
  return (
    <div className="carousel-wrap">
      <button className="carousel-nav" aria-label={`Scroll ${label} left`} onClick={() => scroll(-1)}>‹</button>
      <div className="carousel" ref={ref} role="group" aria-label={label}>
        {children}
      </div>
      <button className="carousel-nav" aria-label={`Scroll ${label} right`} onClick={() => scroll(1)}>›</button>
    </div>
  );
}

export function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

export function LinkedinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path
        fill="#fff"
        d="M7.12 9.6H4.4V19h2.72V9.6ZM5.76 8.4a1.58 1.58 0 1 0 0-3.16 1.58 1.58 0 0 0 0 3.16ZM19.6 19h-2.72v-4.85c0-1.16-.42-1.95-1.46-1.95-.8 0-1.27.53-1.48 1.05-.08.19-.1.45-.1.71V19h-2.72s.04-8.53 0-9.4h2.72v1.33c.36-.56 1.01-1.35 2.46-1.35 1.79 0 3.3 1.17 3.3 3.68V19Z"
      />
    </svg>
  );
}

type SubTab = "news" | "events" | "resources";

export function ResourcesTab({
  student,
  onChange,
}: {
  student: Student;
  onChange: (next: Student) => void;
}) {
  const [subTab, setSubTab] = useState<SubTab>("news");
  const [eventPathFilter, setEventPathFilter] = useState<CareerPath | "all">("all");
  const [eventPage, setEventPage] = useState(0);
  const EVENTS_PER_PAGE = 10;
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

  const sortedEvents = [...EVENTS]
    .filter((e) => eventPathFilter === "all" || e.path === eventPathFilter)
    .sort((a, b) => a.date.localeCompare(b.date));
  const eventPaths = [...new Set(EVENTS.map((e) => e.path).filter(Boolean))] as Exclude<CareerPath, "">[];
  const eventPageCount = Math.max(1, Math.ceil(sortedEvents.length / EVENTS_PER_PAGE));
  const pagedEvents = sortedEvents.slice(eventPage * EVENTS_PER_PAGE, (eventPage + 1) * EVENTS_PER_PAGE);

  return (
    <>
      <h1 className="page">Everything the Career Center has for you</h1>
      <p className="lede">
        Templates, career-path explainers, upcoming events, and a direct line to the Career Center
        itself. Looking for alumni to connect with? That's moved to the Network tab.
      </p>

      {/* Career Center services — highest-intent action, always visible, no tab click needed */}
      <section className="sec" aria-labelledby="svc-h">
        <div className="sec-head"><h2 id="svc-h">Career Center services</h2></div>
        <div className="cardgrid">
          {CAREER_SERVICES.map((s) => (
            <div className="resourcecard" key={s.id}>
              <h3>{s.title}</h3>
              <p className="jobcard-blurb">{s.description}</p>
              <a href={CAREER_CENTER.siteUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">{s.cta}</a>
            </div>
          ))}
        </div>
        <p className="jobcard-blurb" style={{ marginTop: 12 }}>
          {CAREER_CENTER.location} · {CAREER_CENTER.hours} · {CAREER_CENTER.phone} ·{" "}
          <a href={`mailto:${CAREER_CENTER.email}`}>{CAREER_CENTER.email}</a> ·{" "}
          <a href={CAREER_CENTER.siteUrl} target="_blank" rel="noreferrer" className="linkbtn">
            careercenter.lclark.edu →
          </a>
        </p>
      </section>

      {student.advisingNotes.length > 0 && (
        <section className="sec" aria-labelledby="adv-h">
          <div className="sec-head">
            <h2 id="adv-h">Notes from your Career Center advisor</h2>
            <span className="count">{student.advisingNotes.length}</span>
          </div>
          <ul className="entries">
            {[...student.advisingNotes]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((n) => (
                <li key={n.id}>
                  <span className="tag" style={{ background: "var(--paper-2)", color: "var(--ink-soft)" }}>{fmtDate(n.date)}</span>
                  <span className="entry-main">
                    <span className="t">{n.note}</span>
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}

      <div className="subtabs" role="tablist" aria-label="Resources sections">
        <button role="tab" aria-selected={subTab === "news"} className={"subtab" + (subTab === "news" ? " active" : "")} onClick={() => setSubTab("news")}>News</button>
        <button role="tab" aria-selected={subTab === "events"} className={"subtab" + (subTab === "events" ? " active" : "")} onClick={() => setSubTab("events")}>Events</button>
        <button role="tab" aria-selected={subTab === "resources"} className={"subtab" + (subTab === "resources" ? " active" : "")} onClick={() => setSubTab("resources")}>Resources</button>
      </div>

      {subTab === "news" && (
        <section className="sec" aria-labelledby="art-h">
          <div className="sec-head"><h2 id="art-h">From the Career Center</h2></div>
          <div className="cardgrid">
            {ARTICLES.map((a) => (
              <div className="resourcecard" key={a.id}>
                <h3>{a.title}</h3>
                <p className="jobcard-blurb">{a.excerpt}</p>
                {a.tag && <span className="pathchip">{pathLabel(a.tag)}</span>}
                <a href={a.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline" style={{ marginTop: 8 }}>
                  Read more
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {subTab === "resources" && (
        <>
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
                  <a href={t.link} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline" style={{ marginTop: 8 }}>
                    Browse real templates
                  </a>
                </details>
              ))}
            </div>
          </section>

          <section className="sec" aria-labelledby="path-h">
            <div className="sec-head"><h2 id="path-h">Explore career paths</h2></div>
            <div className="cardgrid">
              {PATHS.map((p) => (
                <div className="resourcecard" key={p.key}>
                  <h3>{p.label}</h3>
                  <p className="jobcard-blurb">{PATH_INFO[p.key].blurb}</p>
                  <p className="jobcard-blurb" style={{ fontStyle: "italic" }}>{PATH_INFO[p.key].insight}</p>
                  <a href={PATH_INFO[p.key].learnMoreUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline" style={{ marginTop: 8 }}>
                    Learn more
                  </a>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {subTab === "events" && (
        <section className="sec" aria-labelledby="evt-h">
          <div className="sec-head">
            <h2 id="evt-h">Upcoming events</h2>
            <span className="count">{attended.size} attended</span>
          </div>
          <div className="field" style={{ maxWidth: 320, marginBottom: 12 }}>
            <label htmlFor="evt-path">Filter by career path</label>
            <select id="evt-path" value={eventPathFilter} onChange={(e) => { setEventPathFilter(e.target.value as CareerPath | "all"); setEventPage(0); }}>
              <option value="all">All paths</option>
              {eventPaths.map((p) => <option key={p} value={p}>{pathLabel(p)}</option>)}
            </select>
          </div>
          {sortedEvents.length === 0 ? (
            <div className="empty">No events match this filter.</div>
          ) : (
            <>
              <div className="cardgrid">
                {pagedEvents.map((e) => (
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
              {eventPageCount > 1 && (
                <div className="row-between" style={{ marginTop: 16 }}>
                  <button className="btn btn-sm btn-outline" disabled={eventPage === 0} onClick={() => setEventPage((p) => p - 1)}>
                    ← Previous
                  </button>
                  <span className="count">Page {eventPage + 1} of {eventPageCount}</span>
                  <button className="btn btn-sm btn-outline" disabled={eventPage >= eventPageCount - 1} onClick={() => setEventPage((p) => p + 1)}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
          <p style={{ marginTop: 14 }}>
            <a href={CAREER_CENTER.newsAndEventsUrl} target="_blank" rel="noreferrer" className="linkbtn">
              See all events on the Career Center site →
            </a>
          </p>
        </section>
      )}

      <div ref={liveRef} className="sr-only" aria-live="polite"></div>
    </>
  );
}
