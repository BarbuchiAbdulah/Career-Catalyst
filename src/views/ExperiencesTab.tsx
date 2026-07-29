import { useMemo, useRef, useState } from "react";
import type { CareerPath, Entry, ExperienceCategory, Student } from "../lib/types";
import { EXPERIENCE_CATEGORIES, EXPERIENCE_CATEGORY_LABEL, PATHS, pathLabel } from "../lib/scoring";
import { uid } from "../lib/seed";

const today = () => new Date().toISOString().slice(0, 10);

function fmt(iso: string): string {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function dateRange(e: { startDate: string; endDate?: string; ongoing: boolean }): string {
  const start = fmt(e.startDate);
  if (e.ongoing) return `${start} – Present`;
  if (e.endDate) return `${start} – ${fmt(e.endDate)}`;
  return start;
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s7-7.58 7-12A7 7 0 0 0 5 9c0 4.42 7 12 7 12z" /><circle cx="12" cy="9" r="2" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2v3M16 2v3M3 9h18" /><rect x="3" y="5" width="18" height="16" rx="2" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transition: "transform .15s" }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
    </svg>
  );
}

const CATEGORY_ICON: Record<ExperienceCategory, string> = {
  internship: "M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18",
  research: "M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2zM20 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 0 2-2z",
  "study-abroad": "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c2.5 2.5 4 6 4 10s-1.5 7.5-4 10c-2.5-2.5-4-6-4-10s1.5-7.5 4-10z",
  leadership: "M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z",
  volunteer: "M12 21s-7-4.5-9.5-9C1 8 2 4 6 4c2 0 3.5 1 6 3.5C14.5 5 16 4 18 4c4 0 5 4 3.5 8-2.5 4.5-9.5 9-9.5 9z",
  "campus-involvement": "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  other: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0",
};

function CategoryIcon({ category }: { category: ExperienceCategory }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={CATEGORY_ICON[category]} />
    </svg>
  );
}

const emptyDraft = (): Omit<Entry, "id"> => ({
  title: "",
  category: "internship",
  organization: "",
  location: "",
  meta: "",
  startDate: today(),
  endDate: undefined,
  ongoing: false,
  path: "",
  tools: undefined,
  hoursLogged: undefined,
});

export function ExperiencesTab({
  student,
  onChange,
}: {
  student: Student;
  onChange: (next: Student) => void;
}) {
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<ExperienceCategory | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<Entry, "id">>(emptyDraft());
  const [toolsText, setToolsText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  function announce(msg: string) {
    if (liveRef.current) liveRef.current.textContent = msg;
  }

  const catCounts = useMemo(() => {
    const m = new Map<ExperienceCategory, number>();
    for (const e of student.entries) {
      const c = e.category ?? "other";
      m.set(c, (m.get(c) ?? 0) + 1);
    }
    return m;
  }, [student.entries]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return student.entries
      .filter((e) => catFilter === "all" || (e.category ?? "other") === catFilter)
      .filter((e) => {
        if (!term) return true;
        return (
          e.title.toLowerCase().includes(term) ||
          (e.organization ?? "").toLowerCase().includes(term) ||
          (e.tools ?? []).some((t) => t.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [student.entries, q, catFilter]);

  function openAdd() {
    setEditingId(null);
    setDraft(emptyDraft());
    setToolsText("");
    setFormOpen(true);
  }
  function openEdit(e: Entry) {
    setEditingId(e.id);
    setDraft({ ...e });
    setToolsText((e.tools ?? []).join(", "));
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }
  function submitForm(ev: React.FormEvent) {
    ev.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    const tools = toolsText.split(",").map((s) => s.trim()).filter(Boolean);
    const next: Entry = {
      ...draft,
      id: editingId ?? uid(),
      title,
      endDate: draft.ongoing ? undefined : draft.endDate || undefined,
      tools: tools.length ? tools : undefined,
    };
    if (editingId) {
      onChange({ ...student, entries: student.entries.map((e) => (e.id === editingId ? next : e)) });
      announce(`Updated ${title}.`);
    } else {
      onChange({ ...student, entries: [next, ...student.entries] });
      announce(`Added experience: ${title}.`);
    }
    closeForm();
  }
  function delExperience(e: Entry) {
    onChange({ ...student, entries: student.entries.filter((x) => x.id !== e.id) });
    announce(`Removed ${e.title}.`);
    if (expandedId === e.id) setExpandedId(null);
  }
  function toggleExpand(id: string) {
    setExpandedId((cur) => (cur === id ? null : id));
  }

  return (
    <>
      <div className="topbar">
        <div className="searchbox">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, organization, or skill…"
            aria-label="Search experiences by title, organization, or skill"
          />
        </div>
      </div>

      <div className="row-between" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p className="eyebrow">Experiences</p>
          <h1 className="page">Experiences</h1>
          <p className="lede">Track internships, research, leadership, and more.</p>
        </div>
        <button className="btn" onClick={openAdd}>+ Add Experience</button>
      </div>

      <div className="filterrow" role="group" aria-label="Filter experiences by category">
        <button className={"filterchip" + (catFilter === "all" ? " active" : "")} aria-pressed={catFilter === "all"} onClick={() => setCatFilter("all")}>
          All ({student.entries.length})
        </button>
        {EXPERIENCE_CATEGORIES.filter((c) => catCounts.has(c)).map((c) => (
          <button key={c} className={"filterchip" + (catFilter === c ? " active" : "")} aria-pressed={catFilter === c} onClick={() => setCatFilter(c)}>
            {EXPERIENCE_CATEGORY_LABEL[c]} ({catCounts.get(c)})
          </button>
        ))}
      </div>

      {formOpen && (
        <section className="sec" aria-labelledby="exp-form-h">
          <div className="sec-head"><h2 id="exp-form-h">{editingId ? "Edit experience" : "Add an experience"}</h2></div>
          <form className="logbar" onSubmit={submitForm}>
            <div className="field grow">
              <label htmlFor="e-title">Title</label>
              <input id="e-title" value={draft.title} onChange={(ev) => setDraft({ ...draft, title: ev.target.value })} placeholder="e.g. Marketing Intern" autoFocus />
            </div>
            <div className="field">
              <label htmlFor="e-cat">Category</label>
              <select id="e-cat" value={draft.category ?? "other"} onChange={(ev) => setDraft({ ...draft, category: ev.target.value as ExperienceCategory })}>
                {EXPERIENCE_CATEGORIES.map((c) => <option key={c} value={c}>{EXPERIENCE_CATEGORY_LABEL[c]}</option>)}
              </select>
            </div>
            <div className="field grow">
              <label htmlFor="e-org">Organization <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input id="e-org" value={draft.organization ?? ""} onChange={(ev) => setDraft({ ...draft, organization: ev.target.value })} placeholder="e.g. Patagonia Portland" />
            </div>
            <div className="field grow">
              <label htmlFor="e-loc">Location <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input id="e-loc" value={draft.location ?? ""} onChange={(ev) => setDraft({ ...draft, location: ev.target.value })} placeholder="e.g. Portland, OR" />
            </div>
            <div className="field grow">
              <label htmlFor="e-start" className="row-between">
                <span>Started – Ended</span>
                <span className="inline-check">
                  <input type="checkbox" checked={draft.ongoing} onChange={(ev) => setDraft({ ...draft, ongoing: ev.target.checked })} />
                  Present
                </span>
              </label>
              <div className="daterange-row">
                <input id="e-start" type="date" value={draft.startDate} onChange={(ev) => setDraft({ ...draft, startDate: ev.target.value })} max={today()} />
                <span aria-hidden="true">–</span>
                <input type="date" value={draft.endDate ?? ""} onChange={(ev) => setDraft({ ...draft, endDate: ev.target.value })} disabled={draft.ongoing} aria-label="Ended" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="e-hours">Hours logged <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input
                id="e-hours"
                type="number"
                min={0}
                value={draft.hoursLogged ?? ""}
                onChange={(ev) => setDraft({ ...draft, hoursLogged: ev.target.value ? Number(ev.target.value) : undefined })}
                placeholder="e.g. 45"
              />
            </div>
            <div className="field">
              <label htmlFor="e-path">Career path <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <select id="e-path" value={draft.path} onChange={(ev) => setDraft({ ...draft, path: ev.target.value as CareerPath })}>
                <option value="">— none —</option>
                {PATHS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
            <div className="field grow">
              <label htmlFor="e-tools">Skills/tools used <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input id="e-tools" value={toolsText} onChange={(ev) => setToolsText(ev.target.value)} placeholder="e.g. Data Analysis, Python" />
            </div>
            <div className="field grow">
              <label htmlFor="e-meta">Detail <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input id="e-meta" value={draft.meta} onChange={(ev) => setDraft({ ...draft, meta: ev.target.value })} placeholder="Extra context or a short description" />
            </div>
            <button className="btn" type="submit">{editingId ? "Save" : "Add Experience"}</button>
            <button className="btn btn-outline" type="button" onClick={closeForm}>Cancel</button>
          </form>
        </section>
      )}

      {shown.length === 0 ? (
        <div className="empty">
          {student.entries.length === 0 ? "No experiences logged yet — add one above." : "No experiences match this search or filter."}
        </div>
      ) : (
        <div className="cardgrid">
          {shown.map((e) => {
            const cat = e.category ?? "other";
            const open = expandedId === e.id;
            return (
              <div className="resourcecard" key={e.id}>
                <div className="expcard-top">
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span className={"expicon " + cat} aria-hidden="true"><CategoryIcon category={cat} /></span>
                    <div>
                      <h3 className="expcard-name">
                        {e.title}
                        {e.ongoing && <span className="pill ok">Current</span>}
                      </h3>
                      {e.organization && <p className="expcard-org">{e.organization}</p>}
                    </div>
                  </div>
                  <div className="expcard-actions">
                    <button className="expcard-iconbtn" onClick={() => delExperience(e)} aria-label={`Remove ${e.title}`}>
                      <TrashIcon />
                    </button>
                    <button
                      className={"expcard-iconbtn chevron" + (open ? " open" : "")}
                      onClick={() => toggleExpand(e.id)}
                      aria-expanded={open}
                      aria-label={open ? `Collapse ${e.title} details` : `Expand ${e.title} details`}
                    >
                      <ChevronIcon />
                    </button>
                  </div>
                </div>
                <div className="expcard-meta">
                  {e.location && <span><PinIcon />{e.location}</span>}
                  <span><CalendarIcon />{dateRange(e)}</span>
                  {typeof e.hoursLogged === "number" && <span>{e.hoursLogged}h logged</span>}
                </div>
                {e.tools && e.tools.length > 0 && (
                  <div className="chiprow">
                    {e.tools.slice(0, 3).map((t) => <span key={t} className="pill chip-tool">{t}</span>)}
                    {e.tools.length > 3 && <span className="pill chip-tool">+{e.tools.length - 3}</span>}
                  </div>
                )}
                {open && (
                  <div style={{ marginTop: 10 }}>
                    {e.meta && <p className="jobcard-blurb">{e.meta}</p>}
                    {e.path && (
                      <p style={{ marginTop: 8 }}>
                        <span className="pathchip">{pathLabel(e.path)}</span>
                      </p>
                    )}
                    <button className="badge-sm-btn" style={{ marginTop: 10 }} onClick={() => openEdit(e)}>Edit</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div ref={liveRef} className="sr-only" aria-live="polite"></div>
    </>
  );
}
