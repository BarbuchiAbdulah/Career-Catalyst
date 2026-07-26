import { useMemo, useRef, useState } from "react";
import type { CareerPath, EntryType, Student } from "../lib/types";
import {
  CATS,
  ORDER,
  PATHS,
  STAGE_LABEL,
  band,
  bandColor,
  dominantPath,
  pathLabel,
  scoreFor,
} from "../lib/scoring";
import { uid } from "../lib/seed";
import { StageBar } from "../components/Readiness";
import { Timeline } from "../components/Timeline";

const today = () => new Date().toISOString().slice(0, 10);

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
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

export function StudentView({
  student,
  onChange,
}: {
  student: Student;
  onChange: (next: Student) => void;
}) {
  const [type, setType] = useState<EntryType>("skill");
  const [title, setTitle] = useState("");
  const [meta, setMeta] = useState("");
  const [date, setDate] = useState(today());
  const [path, setPath] = useState<CareerPath>("");
  const [q, setQ] = useState("");
  const liveRef = useRef<HTMLDivElement>(null);

  const { score, per, stage } = useMemo(
    () => scoreFor(student.entries, student.grad),
    [student.entries, student.grad]
  );
  const b = band(score);
  const dom = useMemo(() => dominantPath(student.entries), [student.entries]);
  const firstName = student.name.split(" ")[0];

  function announce(msg: string) {
    if (liveRef.current) liveRef.current.textContent = msg;
  }

  function add(ev: React.FormEvent) {
    ev.preventDefault();
    const t = title.trim();
    if (!t) return;
    onChange({
      ...student,
      entries: [
        { id: uid(), type, title: t, meta: meta.trim(), date: date || today(), path: type === "contact" ? "" : path },
        ...student.entries,
      ],
    });
    setTitle("");
    setMeta("");
    announce(`Added ${CATS[type].label.toLowerCase()} entry: ${t}.`);
  }
  function del(id: string) {
    const gone = student.entries.find((x) => x.id === id);
    onChange({ ...student, entries: student.entries.filter((x) => x.id !== id) });
    if (gone) announce(`Removed ${gone.title}.`);
  }

  const gap = ORDER.map((k) => ({ k, need: per[k].target - per[k].n }))
    .filter((g) => g.need > 0)
    .sort((a, b2) => b2.need - a.need)[0];

  const shown = q.trim()
    ? student.entries.filter((e) =>
        (e.title + " " + e.meta + " " + pathLabel(e.path)).toLowerCase().includes(q.toLowerCase())
      )
    : student.entries;

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
            placeholder="Search your entries…"
            aria-label="Search your entries"
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

      {dom && dom.key && (
        <p className="pathnote">
          Your entries lean toward <strong>{pathLabel(dom.key)}</strong> ({dom.n} tagged) — a sign your work is cohering toward a direction.
        </p>
      )}

      <StageBar stage={stage} />

      {/* Log an entry */}
      <section className="sec" aria-labelledby="log-h">
        <div className="sec-head"><h2 id="log-h">Log an entry</h2></div>
        <form className="logbar" onSubmit={add}>
          <div className="field">
            <label htmlFor="etype">Type</label>
            <select id="etype" value={type} onChange={(e) => setType(e.target.value as EntryType)}>
              {ORDER.map((k) => <option key={k} value={k}>{CATS[k].label}</option>)}
            </select>
          </div>
          <div className="field grow">
            <label htmlFor="etitle">{type === "contact" ? "Who" : "What"}</label>
            <input id="etitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={CATS[type].ex} aria-describedby="ehelp" />
          </div>
          <div className="field grow">
            <label htmlFor="emeta">Detail <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input id="emeta" value={meta} onChange={(e) => setMeta(e.target.value)} placeholder="Where, when, or context" />
          </div>
          <div className="field">
            <label htmlFor="edate">When</label>
            <input id="edate" type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today()} />
          </div>
          {type !== "contact" && (
            <div className="field">
              <label htmlFor="epath">Career path <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <select id="epath" value={path} onChange={(e) => setPath(e.target.value as CareerPath)}>
                <option value="">— none —</option>
                {PATHS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
          )}
          <button className="btn" type="submit">Add entry</button>
        </form>
        <p id="ehelp" className="sr-only">{CATS[type].help}</p>
      </section>

      {/* Timeline */}
      <section className="sec" aria-labelledby="tl-h">
        <div className="sec-head">
          <h2 id="tl-h">Your four-year timeline</h2>
          <span className="count">{q.trim() ? `${shown.length} of ${student.entries.length}` : `${student.entries.length} entries`}</span>
        </div>
        <Timeline entries={shown} />
      </section>

      {/* Manage */}
      <section className="sec" aria-labelledby="list-h">
        <div className="sec-head"><h2 id="list-h">Manage entries</h2></div>
        {shown.length === 0 ? (
          <div className="empty">{q.trim() ? "No entries match your search." : "Nothing logged yet. Start with one skill you already have — it counts."}</div>
        ) : (
          <ul className="entries">
            {shown.map((e) => (
              <li key={e.id}>
                <span className={"tag " + e.type}>{CATS[e.type].label}</span>
                <span className="entry-main">
                  <span className="t">{e.title}</span>
                  {e.meta && <span className="m">{e.meta}</span>}
                </span>
                <button className="del" onClick={() => del(e.id)} aria-label={`Remove ${e.title}`}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div ref={liveRef} className="sr-only" aria-live="polite"></div>
    </>
  );
}

