import { useMemo, useRef, useState } from "react";
import type { AppSource, AppStatus, Application, CareerPath, Student } from "../lib/types";
import { CAREER_CENTER, EXTERNAL_BOARDS, JOBS } from "../lib/content";
import { PATHS, pathLabel } from "../lib/scoring";
import { uid } from "../lib/seed";

const STATUS_ORDER: AppStatus[] = ["saved", "applied", "interviewing", "offer", "rejected"];
const STATUS_LABEL: Record<AppStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};
const STATUS_CLASS: Record<AppStatus, string> = {
  saved: "mid",
  applied: "mid",
  interviewing: "ok",
  offer: "ok",
  rejected: "low",
};

const today = () => new Date().toISOString().slice(0, 10);

function daysUntil(iso: string): number | null {
  if (!iso) return null;
  const ms = new Date(iso + "T00:00:00").getTime() - new Date(today() + "T00:00:00").getTime();
  return Math.round(ms / 86400000);
}

// Pulls a bare domain out of whatever URL the student pastes, so a custom
// application gets a real logo lookup automatically — no extra field needed.
function hostnameOf(url: string): string | undefined {
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(withProto).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

// Ink+orange monogram fallback — used whenever there's no real domain to look
// a logo up from (student-added custom applications) or the logo fails to load.
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Real logo when we know the org's domain (a small public favicon-style
// lookup, not something this app hosts), falling back to the monogram the
// instant it 404s — so a missing/broken logo never breaks the card.
function OrgLogo({ name, domain }: { name: string; domain?: string }) {
  const [broken, setBroken] = useState(false);
  if (!domain || broken) return <span className="monogram">{initials(name)}</span>;
  return (
    <span className="monogram monogram-img">
      <img src={`https://logo.clearbit.com/${domain}`} alt="" onError={() => setBroken(true)} />
    </span>
  );
}

function DeadlineChip({ deadline, status }: { deadline: string; status: AppStatus }) {
  if (!deadline) return <span className="m">No deadline</span>;
  const d = daysUntil(deadline);
  if (d === null) return <span className="m">No deadline</span>;
  const cls = status === "rejected" ? "mid" : d < 0 || d <= 7 ? "low" : d <= 30 ? "mid" : "ok";
  const text = d < 0 ? "Past due" : d === 0 ? "Due today" : `Due in ${d}d`;
  return <span className={"pill " + cls} style={{ fontFamily: "var(--font-mono,monospace)", fontSize: 11.5 }}>{text}</span>;
}

type SubTab = "explore" | "mine";

export function ApplicationsTab({
  student,
  onChange,
}: {
  student: Student;
  onChange: (next: Student) => void;
}) {
  const [subTab, setSubTab] = useState<SubTab>("explore");
  const [sourceFilter, setSourceFilter] = useState<AppSource | "all">("all");
  const [pathFilter, setPathFilter] = useState<CareerPath | "all">("all");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [link, setLink] = useState("");
  const [source, setSource] = useState<AppSource>("external");
  const [deadline, setDeadline] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Application | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  function announce(msg: string) {
    if (liveRef.current) liveRef.current.textContent = msg;
  }

  const jobs = JOBS.filter(
    (j) => (sourceFilter === "all" || j.source === sourceFilter) && (pathFilter === "all" || j.path === pathFilter)
  );

  const savedKeys = useMemo(
    () => new Set(student.applications.map((a) => `${a.company}::${a.role}`)),
    [student.applications]
  );

  function saveJob(j: (typeof JOBS)[number]) {
    if (savedKeys.has(`${j.org}::${j.title}`)) return;
    const app: Application = {
      id: uid(),
      company: j.org,
      role: j.title,
      domain: j.domain,
      link: "",
      source: j.source,
      deadline: "",
      status: "saved",
      notes: j.blurb,
      date: today(),
    };
    onChange({ ...student, applications: [app, ...student.applications] });
    announce(`Saved ${j.title} at ${j.org} to your applications.`);
  }

  function addCustom(ev: React.FormEvent) {
    ev.preventDefault();
    const c = company.trim();
    const r = role.trim();
    if (!c || !r) return;
    const app: Application = { id: uid(), company: c, role: r, domain: hostnameOf(link), link: link.trim(), source, deadline, status: "saved", notes: "", date: today() };
    onChange({ ...student, applications: [app, ...student.applications] });
    setCompany("");
    setRole("");
    setLink("");
    setDeadline("");
    announce(`Added ${r} at ${c} to your applications.`);
  }

  function setStatus(id: string, status: AppStatus) {
    onChange({ ...student, applications: student.applications.map((a) => (a.id === id ? { ...a, status } : a)) });
  }
  function del(id: string) {
    const gone = student.applications.find((a) => a.id === id);
    onChange({ ...student, applications: student.applications.filter((a) => a.id !== id) });
    if (gone) announce(`Removed ${gone.role} at ${gone.company}.`);
  }
  function startEdit(a: Application) {
    setEditingId(a.id);
    setEditDraft({ ...a });
  }
  function saveEdit() {
    if (!editDraft) return;
    const updated = { ...editDraft, domain: hostnameOf(editDraft.link) ?? editDraft.domain };
    onChange({ ...student, applications: student.applications.map((a) => (a.id === updated.id ? updated : a)) });
    setEditingId(null);
    setEditDraft(null);
    announce("Application updated.");
  }

  const myApps = [...student.applications].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });

  return (
    <>
      <h1 className="page">Track your opportunities</h1>
      <p className="lede">
        Explore on-campus and external opportunities the Career Center curates, save the ones you
        want to pursue, and keep every deadline in one tracker.
      </p>

      <div className="subtabs" role="tablist" aria-label="Applications sections">
        <button role="tab" aria-selected={subTab === "explore"} className={"subtab" + (subTab === "explore" ? " active" : "")} onClick={() => setSubTab("explore")}>
          Explore
        </button>
        <button role="tab" aria-selected={subTab === "mine"} className={"subtab" + (subTab === "mine" ? " active" : "")} onClick={() => setSubTab("mine")}>
          My applications ({myApps.length})
        </button>
      </div>

      {subTab === "explore" ? (
        <section className="sec" aria-labelledby="explore-h">
          <div className="sec-head">
            <h2 id="explore-h">Explore opportunities</h2>
            <span className="count">{jobs.length} shown</span>
          </div>
          <p className="jobcard-blurb" style={{ marginTop: -4, marginBottom: 12 }}>
            Showing {JOBS.length} curated highlights — browse all current openings on the Career
            Center's live job board{" "}
            <a href={CAREER_CENTER.jobBoardUrl} target="_blank" rel="noreferrer" className="linkbtn">
              (uConnect) →
            </a>
          </p>
          <div className="boardrow" aria-label="More places to look">
            {EXTERNAL_BOARDS.map((b) => (
              <a key={b.id} href={b.url} target="_blank" rel="noreferrer" className="boardlink">
                {b.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
          <div className="filterrow" role="group" aria-label="Filter by source">
            {(["all", "on-campus", "external"] as const).map((s) => (
              <button key={s} className={"filterchip" + (sourceFilter === s ? " active" : "")} aria-pressed={sourceFilter === s} onClick={() => setSourceFilter(s)}>
                {s === "all" ? "All" : s === "on-campus" ? "On-campus" : "External"}
              </button>
            ))}
          </div>
          <div className="field" style={{ maxWidth: 320, marginBottom: 12 }}>
            <label htmlFor="job-path">Filter by career path</label>
            <select id="job-path" value={pathFilter} onChange={(e) => setPathFilter(e.target.value as CareerPath | "all")}>
              <option value="all">All paths</option>
              {PATHS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          <div className="cardgrid">
            {jobs.map((j) => {
              const saved = savedKeys.has(`${j.org}::${j.title}`);
              return (
                <div className="jobcard" key={j.id}>
                  <div className="row-between" style={{ width: "100%" }}>
                    <OrgLogo name={j.org} domain={j.domain} />
                    <span className={"tag " + (j.source === "on-campus" ? "experience" : "skill")}>{j.source === "on-campus" ? "On-campus" : "External"}</span>
                  </div>
                  <h3>{j.title}</h3>
                  <p className="jobcard-org">{j.org} · {j.location}</p>
                  <p className="jobcard-blurb">{j.blurb}</p>
                  {j.path && <span className="pathchip">{pathLabel(j.path)}</span>}
                  <div className="row" style={{ gap: 12, marginTop: "auto" }}>
                    <button className="btn btn-sm" disabled={saved} onClick={() => saveJob(j)}>
                      {saved ? "Saved" : "Save to my applications"}
                    </button>
                    {j.domain && (
                      <a href={`https://${j.domain}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">
                        Read more
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <>
          <section className="sec" aria-labelledby="add-h">
            <div className="sec-head"><h2 id="add-h">Add an application you found elsewhere</h2></div>
            <form className="logbar" onSubmit={addCustom}>
              <div className="field grow">
                <label htmlFor="a-company">Company/org</label>
                <input id="a-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Nike" />
              </div>
              <div className="field grow">
                <label htmlFor="a-role">Role</label>
                <input id="a-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Marketing Intern" />
              </div>
              <div className="field grow">
                <label htmlFor="a-link">Link <span style={{ fontWeight: 400 }}>(optional)</span></label>
                <input id="a-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Job posting URL" />
              </div>
              <div className="field">
                <label htmlFor="a-source">Source</label>
                <select id="a-source" value={source} onChange={(e) => setSource(e.target.value as AppSource)}>
                  <option value="external">External</option>
                  <option value="on-campus">On-campus</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="a-deadline">Deadline <span style={{ fontWeight: 400 }}>(optional)</span></label>
                <input id="a-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <button className="btn" type="submit">Add</button>
            </form>
          </section>

          <section className="sec" aria-labelledby="mine-h">
            <div className="sec-head">
              <h2 id="mine-h">My applications</h2>
              <span className="count">{myApps.length} tracked</span>
            </div>
            {myApps.length === 0 ? (
              <div className="empty">Nothing tracked yet — save an opportunity from Explore, or add one you found elsewhere.</div>
            ) : (
              <ul className="entries applist">
                {myApps.map((a) =>
                  editingId === a.id && editDraft ? (
                    <li key={a.id} className="editrow">
                      <input value={editDraft.company} onChange={(ev) => setEditDraft({ ...editDraft, company: ev.target.value })} placeholder="Company" />
                      <input value={editDraft.role} onChange={(ev) => setEditDraft({ ...editDraft, role: ev.target.value })} placeholder="Role" />
                      <input value={editDraft.link} onChange={(ev) => setEditDraft({ ...editDraft, link: ev.target.value })} placeholder="Link" />
                      <input type="date" value={editDraft.deadline} onChange={(ev) => setEditDraft({ ...editDraft, deadline: ev.target.value })} />
                      <input value={editDraft.notes} onChange={(ev) => setEditDraft({ ...editDraft, notes: ev.target.value })} placeholder="Notes" />
                      <button className="btn btn-sm" onClick={saveEdit}>Save</button>
                      <button className="btn btn-sm btn-outline" onClick={() => { setEditingId(null); setEditDraft(null); }}>Cancel</button>
                    </li>
                  ) : (
                    <li key={a.id} className="approw">
                      <OrgLogo name={a.company} domain={a.domain} />
                      <span className="entry-main">
                        <span className="t">{a.role}</span>
                        <span className="m">{a.company} · {a.source === "on-campus" ? "On-campus" : "External"}</span>
                      </span>
                      <span className="approw-deadline"><DeadlineChip deadline={a.deadline} status={a.status} /></span>
                      <span className={"statusdot " + STATUS_CLASS[a.status]} aria-hidden="true" />
                      <select className="editrow-select" style={{ flex: "none", width: 130 }} aria-label={`Status for ${a.role} at ${a.company}`} value={a.status} onChange={(e) => setStatus(a.id, e.target.value as AppStatus)}>
                        {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                      <span className="approw-actions">
                        {a.link && (
                          <a href={a.link.startsWith("http") ? a.link : `https://${a.link}`} target="_blank" rel="noopener noreferrer" className="linkicon" aria-label={`Open posting for ${a.role} at ${a.company}`}>
                            ↗
                          </a>
                        )}
                        <button className="badge-sm-btn" onClick={() => startEdit(a)}>Edit</button>
                        <button className="del" onClick={() => del(a.id)} aria-label={`Remove ${a.role} at ${a.company}`}>Remove</button>
                      </span>
                    </li>
                  )
                )}
              </ul>
            )}
          </section>
        </>
      )}

      <div ref={liveRef} className="sr-only" aria-live="polite"></div>
    </>
  );
}
