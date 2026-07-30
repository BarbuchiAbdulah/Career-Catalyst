import { useEffect, useMemo, useRef, useState } from "react";
import type { CareerPath, Entry, ExperienceCategory, Student } from "../lib/types";
import {
  ADVANCED_AT,
  EXPERIENCE_CATEGORIES,
  EXPERIENCE_CATEGORY_LABEL,
  PATHS,
  SKILL_LEVEL_LABEL,
  levelFor,
  pathLabel,
} from "../lib/scoring";
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
const CATEGORY_ICON: Record<ExperienceCategory, string> = {
  internship: "M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18",
  research: "M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2zM20 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 0 2-2z",
  "study-abroad": "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c2.5 2.5 4 6 4 10s-1.5 7.5-4 10c-2.5-2.5-4-6-4-10s1.5-7.5 4-10z",
  leadership: "M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z",
  volunteer: "M12 21s-7-4.5-9.5-9C1 8 2 4 6 4c2 0 3.5 1 6 3.5C14.5 5 16 4 18 4c4 0 5 4 3.5 8-2.5 4.5-9.5 9-9.5 9z",
  "campus-involvement": "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  project: "M8 3L2 12l6 9M16 3l6 9-6 9",
  other: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0",
};

// Falls back to the "other" glyph for any stored category value that isn't
// one of the known keys — otherwise the <path> gets an undefined `d` and
// silently renders nothing while its colored box stays put.
function CategoryIcon({ category }: { category: ExperienceCategory }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={CATEGORY_ICON[category] ?? CATEGORY_ICON.other} />
    </svg>
  );
}

// Category chips/select for the Experiences subtab only — Projects has its
// own subtab now, so it isn't offered here as just another filter.
const EXP_FORM_CATEGORIES = EXPERIENCE_CATEGORIES.filter((c) => c !== "project");

const emptyDraft = (category: ExperienceCategory): Omit<Entry, "id"> => ({
  title: "",
  category,
  organization: "",
  location: "",
  meta: "",
  startDate: today(),
  endDate: undefined,
  ongoing: false,
  path: "",
  tools: undefined,
  hoursLogged: undefined,
  link: undefined,
});

export type SubTab = "experiences" | "projects" | "skills";
type SortMode = "earliest" | "newest" | "az" | "level";

function sortSkillsFirstDate(a: Student["skills"][number]) {
  return a.evidence.reduce((min, e) => (e.date < min ? e.date : min), a.evidence[0]?.date ?? "9999");
}
function sortSkillsLastDate(a: Student["skills"][number]) {
  return a.evidence.reduce((max, e) => (e.date > max ? e.date : max), a.evidence[0]?.date ?? "");
}

export function ExperiencesTab({
  student,
  onChange,
  initialSubTab,
}: {
  student: Student;
  onChange: (next: Student) => void;
  initialSubTab?: SubTab;
}) {
  const [subTab, setSubTab] = useState<SubTab>(initialSubTab ?? "experiences");

  // Lets Dashboard's stat cards deep-link straight to a specific subtab
  // (e.g. Skills) instead of always landing on the default.
  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
  }, [initialSubTab]);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<ExperienceCategory | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<Entry, "id">>(emptyDraft("internship"));
  const [toolsText, setToolsText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // --- Skills state (moved here from Profile) ---
  const [skillSort, setSkillSort] = useState<SortMode>("earliest");
  const [openEvidenceFor, setOpenEvidenceFor] = useState<string | null>(null);
  const [evDate, setEvDate] = useState(today());
  const [evDesc, setEvDesc] = useState("");
  const [evEntryId, setEvEntryId] = useState("");
  const [newSkillTitle, setNewSkillTitle] = useState("");
  const [newSkillPath, setNewSkillPath] = useState<CareerPath>("");

  const liveRef = useRef<HTMLDivElement>(null);

  function announce(msg: string) {
    if (liveRef.current) liveRef.current.textContent = msg;
  }

  function selectSubTab(next: SubTab) {
    setSubTab(next);
    setQ("");
    setCatFilter("all");
    closeForm();
  }

  const expEntries = useMemo(() => student.entries.filter((e) => (e.category ?? "other") !== "project"), [student.entries]);
  const projEntries = useMemo(() => student.entries.filter((e) => e.category === "project"), [student.entries]);
  const baseEntries = subTab === "projects" ? projEntries : expEntries;

  // Skill evidence can optionally reference the Entry it came from — these
  // two maps drive that link in both directions without storing it twice.
  const entryTitleById = useMemo(() => {
    const m = new Map<string, string>();
    for (const en of student.entries) m.set(en.id, en.title);
    return m;
  }, [student.entries]);
  const skillsByEntryId = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const s of student.skills) {
      for (const ev of s.evidence) {
        if (!ev.entryId) continue;
        const arr = m.get(ev.entryId) ?? [];
        if (!arr.includes(s.title)) arr.push(s.title);
        m.set(ev.entryId, arr);
      }
    }
    return m;
  }, [student.skills]);

  const catCounts = useMemo(() => {
    const m = new Map<ExperienceCategory, number>();
    for (const e of expEntries) {
      const c = e.category ?? "other";
      m.set(c, (m.get(c) ?? 0) + 1);
    }
    return m;
  }, [expEntries]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return baseEntries
      .filter((e) => subTab !== "experiences" || catFilter === "all" || (e.category ?? "other") === catFilter)
      .filter((e) => {
        if (!term) return true;
        return (
          e.title.toLowerCase().includes(term) ||
          (e.organization ?? "").toLowerCase().includes(term) ||
          (e.tools ?? []).some((t) => t.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [baseEntries, q, catFilter, subTab]);

  function openAdd(category: ExperienceCategory) {
    setEditingId(null);
    setDraft(emptyDraft(category));
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
      link: draft.link?.trim() || undefined,
    };
    if (editingId) {
      onChange({ ...student, entries: student.entries.map((e) => (e.id === editingId ? next : e)) });
      announce(`Updated ${title}.`);
    } else {
      onChange({ ...student, entries: [next, ...student.entries] });
      announce(`Added ${subTab === "projects" ? "project" : "experience"}: ${title}.`);
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

  // --- Skills ---------------------------------------------------------------

  const sortedSkills = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = student.skills.filter(
      (s) => !term || s.title.toLowerCase().includes(term) || pathLabel(s.path).toLowerCase().includes(term)
    );
    if (skillSort === "earliest") list.sort((a, b) => sortSkillsFirstDate(a).localeCompare(sortSkillsFirstDate(b)));
    else if (skillSort === "newest") list.sort((a, b) => sortSkillsLastDate(b).localeCompare(sortSkillsLastDate(a)));
    else if (skillSort === "az") list.sort((a, b) => a.title.localeCompare(b.title));
    else list.sort((a, b) => b.evidence.length - a.evidence.length);
    return list;
  }, [student.skills, skillSort, q]);

  function addSkill(ev: React.FormEvent) {
    ev.preventDefault();
    const t = newSkillTitle.trim();
    if (!t) return;
    onChange({
      ...student,
      skills: [{ id: uid(), title: t, path: newSkillPath, evidence: [{ id: uid(), date: today(), description: "" }] }, ...student.skills],
    });
    setNewSkillTitle("");
    setNewSkillPath("");
    announce(`Added skill: ${t}.`);
  }
  function delSkill(id: string) {
    const gone = student.skills.find((s) => s.id === id);
    onChange({ ...student, skills: student.skills.filter((s) => s.id !== id) });
    if (gone) announce(`Removed skill: ${gone.title}.`);
  }
  function addEvidence(skillId: string, ev: React.FormEvent) {
    ev.preventDefault();
    const d = evDesc.trim();
    if (!d) return;
    onChange({
      ...student,
      skills: student.skills.map((s) =>
        s.id === skillId
          ? { ...s, evidence: [...s.evidence, { id: uid(), date: evDate, description: d, entryId: evEntryId || undefined }] }
          : s
      ),
    });
    setEvDesc("");
    setEvDate(today());
    setEvEntryId("");
    setOpenEvidenceFor(null);
    announce("Evidence added.");
  }
  function delEvidence(skillId: string, evId: string) {
    onChange({
      ...student,
      skills: student.skills.map((s) => (s.id === skillId ? { ...s, evidence: s.evidence.filter((e) => e.id !== evId) } : s)),
    });
  }

  return (
    <>
      <div>
        <h1 className="page">Experiences</h1>
        <p className="lede">Track internships, research, leadership, projects, and the skills you're building.</p>
      </div>

      <div className="subtabs" role="tablist" aria-label="Experience sections">
        <button role="tab" aria-selected={subTab === "experiences"} className={"subtab" + (subTab === "experiences" ? " active" : "")} onClick={() => selectSubTab("experiences")}>
          Experiences ({expEntries.length})
        </button>
        <button role="tab" aria-selected={subTab === "projects"} className={"subtab" + (subTab === "projects" ? " active" : "")} onClick={() => selectSubTab("projects")}>
          Projects ({projEntries.length})
        </button>
        <button role="tab" aria-selected={subTab === "skills"} className={"subtab" + (subTab === "skills" ? " active" : "")} onClick={() => selectSubTab("skills")}>
          Skills ({student.skills.length})
        </button>
      </div>

      <div className="topbar">
        <div className="searchbox">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              subTab === "projects"
                ? "Search projects by title, organization, or skill…"
                : subTab === "skills"
                ? "Search skills by title or career path…"
                : "Search by title, organization, or skill…"
            }
            aria-label={subTab === "skills" ? "Search skills by title or career path" : "Search by title, organization, or skill"}
          />
        </div>
        {subTab !== "skills" && (
          <button className="btn" onClick={() => openAdd(subTab === "projects" ? "project" : "internship")}>
            + Add {subTab === "projects" ? "Project" : "Experience"}
          </button>
        )}
      </div>

      {subTab === "skills" ? (
        <section className="sec" aria-labelledby="skills-h">
          <div className="sec-head">
            <h2 id="skills-h">Skills</h2>
            <label className="sr-only" htmlFor="skill-sort">Sort skills</label>
            <select id="skill-sort" className="sortselect" value={skillSort} onChange={(e) => setSkillSort(e.target.value as SortMode)}>
              <option value="earliest">Earliest first</option>
              <option value="newest">Newest first</option>
              <option value="az">A–Z</option>
              <option value="level">Proficiency</option>
            </select>
          </div>
          <form className="logbar" onSubmit={addSkill} style={{ marginBottom: 14 }}>
            <div className="field grow">
              <label htmlFor="s-title">New skill</label>
              <input id="s-title" value={newSkillTitle} onChange={(e) => setNewSkillTitle(e.target.value)} placeholder="e.g. Python, Public speaking" />
            </div>
            <div className="field">
              <label htmlFor="s-path">Career path <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <select id="s-path" value={newSkillPath} onChange={(e) => setNewSkillPath(e.target.value as CareerPath)}>
                <option value="">— none —</option>
                {PATHS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
            <button className="btn" type="submit">Add skill</button>
          </form>
          {sortedSkills.length === 0 ? (
            <div className="empty">
              {student.skills.length === 0 ? "Nothing logged yet. Start with one skill you already have — it counts." : "No skills match this search."}
            </div>
          ) : (
            <div className="skillcards">
              {sortedSkills.map((s) => {
                const level = levelFor(s.evidence.length);
                const pct = Math.min(100, Math.round((s.evidence.length / ADVANCED_AT) * 100));
                const evOrdered = [...s.evidence].sort((a, b) => a.date.localeCompare(b.date));
                return (
                  <div className="skillcard" key={s.id}>
                    <div className="row-between">
                      <h3>{s.title}{s.path && <span className="pathchip">{pathLabel(s.path)}</span>}</h3>
                      <span className="proflevel">{SKILL_LEVEL_LABEL[level]}</span>
                    </div>
                    <div className="track"><i style={{ width: pct + "%" }} /></div>
                    <ul className="evidencelist">
                      {evOrdered.map((e) => (
                        <li key={e.id}>
                          <span className="ev-date">{fmt(e.date)}</span>
                          <span className="ev-desc">
                            {e.description || "—"}
                            {e.entryId && entryTitleById.has(e.entryId) && (
                              <span className="ev-linked">↳ {entryTitleById.get(e.entryId)}</span>
                            )}
                          </span>
                          <button className="del" onClick={() => delEvidence(s.id, e.id)} aria-label={`Remove evidence: ${e.description}`}>Remove</button>
                        </li>
                      ))}
                    </ul>
                    {openEvidenceFor === s.id ? (
                      <form className="logbar" style={{ marginTop: 8 }} onSubmit={(ev) => addEvidence(s.id, ev)}>
                        <div className="field">
                          <label htmlFor={`ev-date-${s.id}`}>When</label>
                          <input id={`ev-date-${s.id}`} type="date" value={evDate} onChange={(e) => setEvDate(e.target.value)} max={today()} />
                        </div>
                        <div className="field grow">
                          <label htmlFor={`ev-desc-${s.id}`}>What happened</label>
                          <input id={`ev-desc-${s.id}`} value={evDesc} onChange={(e) => setEvDesc(e.target.value)} placeholder="e.g. Took an online course, used it on a project" autoFocus />
                        </div>
                        <div className="field">
                          <label htmlFor={`ev-entry-${s.id}`}>Used in <span style={{ fontWeight: 400 }}>(optional)</span></label>
                          <select id={`ev-entry-${s.id}`} value={evEntryId} onChange={(e) => setEvEntryId(e.target.value)}>
                            <option value="">— none —</option>
                            {student.entries.map((en) => <option key={en.id} value={en.id}>{en.title}</option>)}
                          </select>
                        </div>
                        <button className="btn btn-sm" type="submit">Save</button>
                        <button className="btn btn-sm btn-outline" type="button" onClick={() => setOpenEvidenceFor(null)}>Cancel</button>
                      </form>
                    ) : (
                      <div className="row" style={{ marginTop: 8, gap: 8 }}>
                        <button className="badge-sm-btn" onClick={() => { setOpenEvidenceFor(s.id); setEvDesc(""); setEvDate(today()); setEvEntryId(""); }}>+ Add evidence</button>
                        <button className="del" onClick={() => delSkill(s.id)} aria-label={`Remove skill ${s.title}`}>Remove skill</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <>
          {subTab === "experiences" && (
            <div className="filterrow" role="group" aria-label="Filter experiences by category">
              <button className={"filterchip" + (catFilter === "all" ? " active" : "")} aria-pressed={catFilter === "all"} onClick={() => setCatFilter("all")}>
                All ({expEntries.length})
              </button>
              {EXP_FORM_CATEGORIES.filter((c) => catCounts.has(c)).map((c) => (
                <button key={c} className={"filterchip" + (catFilter === c ? " active" : "")} aria-pressed={catFilter === c} onClick={() => setCatFilter(c)}>
                  {EXPERIENCE_CATEGORY_LABEL[c]} ({catCounts.get(c)})
                </button>
              ))}
            </div>
          )}

          {formOpen && (
            <section className="sec" aria-labelledby="exp-form-h">
              <div className="sec-head">
                <h2 id="exp-form-h">
                  {editingId ? `Edit ${subTab === "projects" ? "project" : "experience"}` : `Add ${subTab === "projects" ? "a project" : "an experience"}`}
                </h2>
              </div>
              <form className="expform" onSubmit={submitForm}>
                <div className="field full">
                  <label htmlFor="e-title">Title</label>
                  <input id="e-title" value={draft.title} onChange={(ev) => setDraft({ ...draft, title: ev.target.value })} placeholder={subTab === "projects" ? "e.g. Data Viz Dashboard" : "e.g. Marketing Intern"} autoFocus />
                </div>
                <div className="field full">
                  <span className="field-label">Category</span>
                  <div className="chipselect" role="group" aria-label="Category">
                    {EXPERIENCE_CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={"filterchip" + ((draft.category ?? "other") === c ? " active" : "")}
                        aria-pressed={(draft.category ?? "other") === c}
                        onClick={() => setDraft({ ...draft, category: c })}
                      >
                        {EXPERIENCE_CATEGORY_LABEL[c]}
                      </button>
                    ))}
                  </div>
                  <span className="field-hint">Changing this moves it between the Experiences and Projects tabs.</span>
                </div>
                <div className="field">
                  <label htmlFor="e-org">Organization <span style={{ fontWeight: 400 }}>(optional)</span></label>
                  <input id="e-org" value={draft.organization ?? ""} onChange={(ev) => setDraft({ ...draft, organization: ev.target.value })} placeholder="e.g. Patagonia Portland" />
                </div>
                <div className="field">
                  <label htmlFor="e-loc">Location <span style={{ fontWeight: 400 }}>(optional)</span></label>
                  <input id="e-loc" value={draft.location ?? ""} onChange={(ev) => setDraft({ ...draft, location: ev.target.value })} placeholder="e.g. Portland, OR" />
                </div>
                <div className="field full">
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
                <div className="field">
                  <label htmlFor="e-tools">Skills/tools used <span style={{ fontWeight: 400 }}>(optional)</span></label>
                  <input id="e-tools" value={toolsText} onChange={(ev) => setToolsText(ev.target.value)} placeholder="e.g. Data Analysis, Python" />
                </div>
                <div className="field">
                  <label htmlFor="e-link">Link <span style={{ fontWeight: 400 }}>(optional — GitHub, portfolio, etc.)</span></label>
                  <input id="e-link" value={draft.link ?? ""} onChange={(ev) => setDraft({ ...draft, link: ev.target.value })} placeholder="e.g. github.com/you/project" />
                </div>
                <div className="field full">
                  <label htmlFor="e-meta">Detail <span style={{ fontWeight: 400 }}>(optional)</span></label>
                  <input id="e-meta" value={draft.meta} onChange={(ev) => setDraft({ ...draft, meta: ev.target.value })} placeholder="Extra context or a short description" />
                </div>
                <div className="field full" style={{ flexDirection: "row", gap: 10 }}>
                  <button className="btn" type="submit">{editingId ? "Save" : subTab === "projects" ? "Add Project" : "Add Experience"}</button>
                  <button className="btn btn-outline" type="button" onClick={closeForm}>Cancel</button>
                </div>
              </form>
            </section>
          )}

          {shown.length === 0 ? (
            <div className="empty">
              {baseEntries.length === 0
                ? `No ${subTab === "projects" ? "projects" : "experiences"} logged yet — add one above.`
                : `No ${subTab === "projects" ? "projects" : "experiences"} match this search or filter.`}
            </div>
          ) : (
            <div className="cardgrid">
              {shown.map((e) => {
                const cat = e.category ?? "other";
                const open = expandedId === e.id;
                return (
                  <div className="resourcecard" key={e.id}>
                    <div className="expcard-top">
                      <span className={"expicon " + cat} aria-hidden="true"><CategoryIcon category={cat} /></span>
                      <div className="expcard-titleblock">
                        <h3 className="expcard-name">
                          <span>{e.title}</span>
                          {e.ongoing && <span className="pill ok">Current</span>}
                        </h3>
                        {e.organization && <p className="expcard-org">{e.organization}</p>}
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
                    <button
                      className={"expcard-more" + (open ? " open" : "")}
                      onClick={() => toggleExpand(e.id)}
                      aria-expanded={open}
                      aria-label={open ? `Collapse ${e.title} details` : `Expand ${e.title} details`}
                    >
                      {open ? "Show less" : "Show more"} <ChevronIcon />
                    </button>
                    {open && (
                      <div style={{ marginTop: 10 }}>
                        {e.meta && <p className="jobcard-blurb">{e.meta}</p>}
                        {e.path && (
                          <p style={{ marginTop: 8 }}>
                            <span className="pathchip">{pathLabel(e.path)}</span>
                          </p>
                        )}
                        {skillsByEntryId.has(e.id) && (
                          <p className="jobcard-blurb" style={{ marginTop: 8 }}>
                            Skills built here: {skillsByEntryId.get(e.id)!.join(", ")}
                          </p>
                        )}
                        <div className="row" style={{ gap: 8, marginTop: 10 }}>
                          <button className="badge-sm-btn" onClick={() => openEdit(e)}>Edit</button>
                          {e.link && (
                            <a
                              href={e.link.startsWith("http") ? e.link : `https://${e.link}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-outline"
                            >
                              View project
                            </a>
                          )}
                          <button className="del" onClick={() => delExperience(e)} aria-label={`Remove ${e.title}`} style={{ marginLeft: "auto" }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <div ref={liveRef} className="sr-only" aria-live="polite"></div>
    </>
  );
}
