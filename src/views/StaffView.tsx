import { useMemo, useRef, useState } from "react";
import type { AdvisingNote, CareerPath, StaffStudent, Stage } from "../lib/types";
import { CATS, EXPERIENCE_CATEGORY_LABEL, ORDER, OUTREACH_STATUSES, OUTREACH_STATUS_LABEL, PATHS, STAGE_LABEL, SKILL_LEVEL_LABEL, band, bandColor, dominantPath, lastActivityFor, levelFor, pathLabel, scoreFor, toTimelineItems } from "../lib/scoring";
import { addAdvisingNote, setOutreachStatus } from "../lib/storage";
import { uid } from "../lib/seed";
import { Dial, CatBars, StageBar } from "../components/Readiness";
import { Timeline } from "../components/Timeline";

type SortKey = "score" | "name" | "grad" | "activity";
type Dir = "asc" | "desc";

const today = () => new Date().toISOString().slice(0, 10);
function fmtNoteDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function fmtEntryDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
// Same shape/idiom as ExperiencesTab.tsx's dateRange() — duplicated locally
// since it's a small, file-scoped formatting helper there too.
function dateRange(e: { startDate: string; endDate?: string; ongoing: boolean }): string {
  const start = fmtEntryDate(e.startDate);
  if (e.ongoing) return `${start} – Present`;
  if (e.endDate) return `${start} – ${fmtEntryDate(e.endDate)}`;
  return start;
}

const DAY = 86400000;
function fmtActivity(iso: string): string {
  if (!iso) return "No activity yet";
  const days = Math.round((Date.now() - new Date(iso + "T00:00:00").getTime()) / DAY);
  if (days < 1) return "Today";
  if (days < 14) return `${days}d ago`;
  if (days < 60) return `${Math.round(days / 7)}w ago`;
  return `${Math.round(days / 30)}mo ago`;
}
// Same traffic-light idiom as the Status column: recent → good, aging → orange, stale/never → warn.
function activityColor(iso: string): string {
  if (!iso) return "var(--warn)";
  const days = Math.round((Date.now() - new Date(iso + "T00:00:00").getTime()) / DAY);
  if (days <= 30) return "var(--good)";
  if (days <= 90) return "var(--orange)";
  return "var(--warn)";
}

function SortMark({ active, dir }: { active: boolean; dir: Dir }) {
  return (
    <span
      aria-hidden="true"
      style={{ opacity: active ? 1 : 0.3, fontFamily: "'JetBrains Mono',monospace" }}
    >
      {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );
}

export function StaffView({
  students,
  setStudents,
  drill,
  setDrill,
  staffAuthor,
}: {
  students: StaffStudent[];
  setStudents: React.Dispatch<React.SetStateAction<StaffStudent[]>>;
  drill: string | null;
  setDrill: (id: string | null) => void;
  staffAuthor: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [dir, setDir] = useState<Dir>("asc"); // asc = lowest score first (needs help on top)
  const [q, setQ] = useState("");
  const [pathFilter, setPathFilter] = useState<CareerPath | "all">("all");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const liveRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => {
    const withScore = students.map((s) => ({
      ...s,
      ...scoreFor(s.skills, s.entries, { length: s.contactsCount }, s.grad),
      activity: lastActivityFor(s.skills, s.entries),
      dominant: dominantPath(s.skills, s.entries),
    }));
    const cmp: Record<SortKey, (a: (typeof withScore)[0], b: (typeof withScore)[0]) => number> = {
      score: (a, b) => a.score - b.score,
      name: (a, b) => a.name.localeCompare(b.name),
      grad: (a, b) => a.grad.localeCompare(b.grad),
      activity: (a, b) => a.activity.localeCompare(b.activity),
    };
    withScore.sort(cmp[sortKey]);
    if (dir === "desc") withScore.reverse();
    return withScore;
  }, [students, sortKey, dir]);

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows
      .filter((r) => !term || r.name.toLowerCase().includes(term) || r.majors.some((m) => m.toLowerCase().includes(term)))
      .filter((r) => pathFilter === "all" || r.dominant?.key === pathFilter)
      .filter((r) => stageFilter === "all" || r.stage === stageFilter);
  }, [rows, q, pathFilter, stageFilter]);

  function sortBy(k: SortKey) {
    if (k === sortKey) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setDir("asc");
    }
  }
  const ariaSort = (k: SortKey): "none" | "ascending" | "descending" =>
    sortKey !== k ? "none" : dir === "asc" ? "ascending" : "descending";

  function updateOutreach(id: string, status: (typeof OUTREACH_STATUSES)[number]) {
    const s = students.find((x) => x.id === id);
    if (!s) return;
    setStudents((prev) => prev.map((x) => (x.id === id ? { ...x, outreachStatus: status } : x)));
    if (liveRef.current) liveRef.current.textContent = `${s.name}: ${OUTREACH_STATUS_LABEL[status]}.`;
    setOutreachStatus(id, status).catch((err) => console.error("Failed to update outreach status:", err));
  }

  function addNote(id: string, text: string) {
    const note: AdvisingNote = { id: uid(), date: today(), note: text, author: staffAuthor };
    setStudents((prev) => prev.map((x) => (x.id === id ? { ...x, advisingNotes: [note, ...x.advisingNotes] } : x)));
    addAdvisingNote(id, note).catch((err) => console.error("Failed to add advising note:", err));
  }

  if (drill) {
    const s = students.find((x) => x.id === drill);
    if (s)
      return (
        <StaffDrill
          student={s}
          onBack={() => setDrill(null)}
          onOutreachChange={(status) => updateOutreach(s.id, status)}
          onAddNote={(text) => addNote(s.id, text)}
        />
      );
  }

  const needing = filteredRows.filter((r) => band(r.score).key !== "ok").length;

  return (
    <>
      <div className="topbar">
        <div className="searchbox">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search students by name or major…"
            aria-label="Search students by name or major"
          />
        </div>
        <div className="topbar-id">
          <span className="topbar-avatar" aria-hidden="true">CC</span>
          <span className="topbar-name">Career Center</span>
        </div>
      </div>

      <p className="eyebrow">Career Center · roster</p>
      <h1 className="page">Who needs outreach</h1>
      <p className="lede">
        Students sorted by readiness so the ones falling behind surface first. Track outreach status
        on anyone you want on your follow-up list, or open a student to see the detail.
      </p>

      <div className="row" style={{ gap: 14, flexWrap: "wrap", marginBottom: 4 }}>
        <div className="field">
          <label htmlFor="roster-path">Career path</label>
          <select id="roster-path" value={pathFilter} onChange={(e) => setPathFilter(e.target.value as CareerPath | "all")}>
            <option value="all">All paths</option>
            {PATHS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="roster-stage">Stage</label>
          <select id="roster-stage" value={stageFilter} onChange={(e) => setStageFilter(e.target.value as Stage | "all")}>
            <option value="all">All stages</option>
            {(["first-year", "sophomore", "junior", "senior"] as Stage[]).map((s) => (
              <option key={s} value={s}>{STAGE_LABEL[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <section className="sec" aria-labelledby="roster-h">
        <div className="sec-head">
          <h2 id="roster-h">Student roster</h2>
          <span className="count">
            {needing} of {filteredRows.length} below “on track”
          </span>
        </div>
        <table className="roster">
          <caption>
            Tip: click a column to sort, search by name or major, or click a row to open the
            student. Lowest scores show first.
          </caption>
          <thead>
            <tr>
              <th scope="col" aria-sort={ariaSort("name")}>
                <button className="sortbtn" onClick={() => sortBy("name")}>
                  Student <SortMark active={sortKey === "name"} dir={dir} />
                </button>
              </th>
              <th scope="col" aria-sort={ariaSort("grad")}>
                <button className="sortbtn" onClick={() => sortBy("grad")}>
                  Class <SortMark active={sortKey === "grad"} dir={dir} />
                </button>
              </th>
              <th scope="col">Stage</th>
              <th scope="col" aria-sort={ariaSort("score")}>
                <button className="sortbtn" onClick={() => sortBy("score")}>
                  Readiness <SortMark active={sortKey === "score"} dir={dir} />
                </button>
              </th>
              <th scope="col">Status</th>
              <th scope="col" aria-sort={ariaSort("activity")}>
                <button className="sortbtn" onClick={() => sortBy("activity")}>
                  Last active <SortMark active={sortKey === "activity"} dir={dir} />
                </button>
              </th>
              <th scope="col">Outreach</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty">No students match &ldquo;{q}&rdquo;.</div>
                </td>
              </tr>
            )}
            {filteredRows.map((r) => {
              const b = band(r.score);
              return (
                <tr
                  key={r.id}
                  onClick={() => setDrill(r.id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setDrill(r.id);
                  }}
                  aria-label={`Open ${r.name}, readiness ${r.score} of 100, ${b.label}`}
                >
                  <td>
                    <span className="who">
                      {r.name}
                      <small>{r.majors.join(", ")}</small>
                    </span>
                  </td>
                  <td>’{r.grad.slice(2)}</td>
                  <td><span className="stagetag">{STAGE_LABEL[r.stage]}</span></td>
                  <td>
                    <span className="score-cell" style={{ color: bandColor(b.key) }}>
                      {r.score}
                    </span>
                    <span className="mini" aria-hidden="true">
                      <i style={{ width: r.score + "%", background: bandColor(b.key) }} />
                    </span>
                  </td>
                  <td>
                    <span className="status">
                      <span className="dot" style={{ background: bandColor(b.key) }} />
                      {b.label}
                    </span>
                  </td>
                  <td>
                    <span className="status">
                      <span className="dot" style={{ background: activityColor(r.activity) }} />
                      {fmtActivity(r.activity)}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      className="editrow-select"
                      value={r.outreachStatus}
                      onChange={(e) => updateOutreach(r.id, e.target.value as (typeof OUTREACH_STATUSES)[number])}
                      aria-label={`Outreach status for ${r.name}`}
                    >
                      {OUTREACH_STATUSES.map((s) => <option key={s} value={s}>{OUTREACH_STATUS_LABEL[s]}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div ref={liveRef} className="sr-only" aria-live="polite"></div>
    </>
  );
}

function StaffDrill({
  student,
  onBack,
  onOutreachChange,
  onAddNote,
}: {
  student: StaffStudent;
  onBack: () => void;
  onOutreachChange: (status: (typeof OUTREACH_STATUSES)[number]) => void;
  onAddNote: (text: string) => void;
}) {
  const { score, per, stage } = scoreFor(student.skills, student.entries, { length: student.contactsCount }, student.grad);
  const dom = dominantPath(student.skills, student.entries);
  const activity = lastActivityFor(student.skills, student.entries);
  const b = band(score);
  const gaps = ORDER.map((k) => ({ k, need: per[k].target - per[k].n })).filter((g) => g.need > 0);
  const timelineItems = toTimelineItems(student.skills, student.entries);
  const sortedNotes = [...student.advisingNotes].sort((a, c) => c.date.localeCompare(a.date));
  const [noteText, setNoteText] = useState("");
  const noteLiveRef = useRef<HTMLDivElement>(null);

  function submitNote(ev: React.FormEvent) {
    ev.preventDefault();
    const t = noteText.trim();
    if (!t) return;
    onAddNote(t);
    setNoteText("");
    if (noteLiveRef.current) noteLiveRef.current.textContent = `Added advising note for ${student.name}.`;
  }

  return (
    <>
      <button className="backlink" onClick={onBack}>
        ← Back to roster
      </button>
      <p className="eyebrow">
        {student.majors.join(", ")} · Class of {student.grad}
      </p>
      <h1 className="page">{student.name}</h1>
      {student.headline && <p className="lede">{student.headline}</p>}

      <StageBar stage={stage} />

      <section className="hero" aria-labelledby="d-score">
        <Dial score={score} />
        <div className="hero-copy">
          <span className={"pill " + b.cls}>
            <span className="dot" style={{ background: bandColor(b.key) }} />
            {b.label} · {STAGE_LABEL[stage]}
          </span>
          <h2 id="d-score">Readiness score: {score}/100</h2>
          <p>
            {gaps.length ? (
              <span>
                Gaps to raise in a meeting:{" "}
                {gaps.map((g) => CATS[g.k].label.toLowerCase()).join(", ")}.
              </span>
            ) : (
              <span>Well-rounded — a good candidate to mentor peers or present at a workshop.</span>
            )}
          </p>
          {dom && dom.key && (
            <p style={{ marginTop: -4 }}>
              Leaning toward <strong>{pathLabel(dom.key)}</strong> ({dom.n} tagged).
            </p>
          )}
          <p style={{ marginTop: -4 }}>
            <span className="status">
              <span className="dot" style={{ background: activityColor(activity) }} />
              Last active: {fmtActivity(activity)}
            </span>
          </p>
          <div className="field" style={{ maxWidth: 220 }}>
            <label htmlFor="d-outreach">Outreach status</label>
            <select
              id="d-outreach"
              value={student.outreachStatus}
              onChange={(e) => onOutreachChange(e.target.value as (typeof OUTREACH_STATUSES)[number])}
            >
              {OUTREACH_STATUSES.map((s) => <option key={s} value={s}>{OUTREACH_STATUS_LABEL[s]}</option>)}
            </select>
          </div>
        </div>
      </section>

      <CatBars per={per} />

      <div className="drill-grid">
        {ORDER.map((k) => {
          const count = k === "skill" ? student.skills.length : k === "experience" ? student.entries.length : student.contactsCount;
          return (
            <section key={k} aria-labelledby={"d-" + k}>
              <div className="sec-head">
                <h2 id={"d-" + k} style={{ fontSize: 17 }}>
                  {CATS[k].label}
                </h2>
                <span className="count">
                  {count}/{per[k].target}
                </span>
              </div>
              {count === 0 ? (
                <div className="empty">Nothing logged — a concrete next step to suggest.</div>
              ) : k === "skill" ? (
                <ul className="entries">
                  {student.skills.map((s) => (
                    <li key={s.id}>
                      <span className="tag skill">{SKILL_LEVEL_LABEL[levelFor(s.evidence.length)]}</span>
                      <span className="entry-main">
                        <span className="t">{s.title}</span>
                        <span className="m">{s.evidence.length} {s.evidence.length === 1 ? "entry" : "entries"} logged</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : k === "experience" ? (
                <ul className="entries">
                  {student.entries.map((e) => (
                    <li key={e.id}>
                      <span className="tag experience">{e.category ? EXPERIENCE_CATEGORY_LABEL[e.category] : CATS.experience.label}</span>
                      <span className="entry-main">
                        <span className="t">{e.title}</span>
                        <span className="m">{dateRange(e)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="entries-summary">
                  {student.contactsCount} connection{student.contactsCount === 1 ? "" : "s"} logged. Names,
                  relationships, and notes are private to the student.
                </p>
              )}
            </section>
          );
        })}
      </div>

      <section className="sec" aria-labelledby="d-tl">
        <div className="sec-head">
          <h2 id="d-tl">Four-year timeline</h2>
          <span className="count">{timelineItems.length} entries</span>
        </div>
        <Timeline entries={timelineItems} />
      </section>

      <section className="sec" aria-labelledby="d-notes">
        <div className="sec-head">
          <h2 id="d-notes">Advising notes</h2>
          <span className="count">{sortedNotes.length} logged</span>
        </div>
        <form className="logbar" onSubmit={submitNote} style={{ marginBottom: 12 }}>
          <div className="field grow">
            <label htmlFor="note-text">Add a note for {student.name}</label>
            <input
              id="note-text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Discussed internship search strategy, follow up in 2 weeks"
            />
          </div>
          <button className="btn" type="submit">Add</button>
        </form>
        {sortedNotes.length === 0 ? (
          <div className="empty">No advising notes yet.</div>
        ) : (
          <ul className="entries">
            {sortedNotes.map((n) => (
              <li key={n.id}>
                <span className="tag" style={{ background: "var(--paper-2)", color: "var(--ink-soft)" }}>{fmtNoteDate(n.date)}</span>
                <span className="entry-main">
                  <span className="t">{n.note}</span>
                  {n.author && <span className="m">— {n.author}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div ref={noteLiveRef} className="sr-only" aria-live="polite"></div>
    </>
  );
}

