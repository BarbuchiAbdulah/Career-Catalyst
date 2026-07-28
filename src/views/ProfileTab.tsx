import { useMemo, useRef, useState } from "react";
import type { CareerPath, ContactRelationship, Entry, EntryType, Student } from "../lib/types";
import {
  ADVANCED_AT,
  CATS,
  PATHS,
  RELATIONSHIPS,
  RELATIONSHIP_LABEL,
  SKILL_LEVEL_LABEL,
  levelFor,
  pathLabel,
} from "../lib/scoring";
import { MAJORS, MINORS, uid } from "../lib/seed";

const today = () => new Date().toISOString().slice(0, 10);

function fmt(iso: string): string {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// A search-and-check multi-select with removable chips — used for majors and
// minors, both of which can have more than one selection and a long real list.
function MultiSelect({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = q.trim() ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase())) : options;
  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink-soft)", marginBottom: 8 }}>{label}</div>
      {selected.length > 0 && (
        <div className="chiprow" style={{ marginBottom: 10 }}>
          {selected.map((s) => (
            <button type="button" className="pill chip-accent" key={s} onClick={() => onToggle(s)} aria-label={`Remove ${s}`}>
              {s} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={`Search ${label.toLowerCase()}…`}
        aria-label={`Search ${label.toLowerCase()}`}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <div className="multiselect-list">
        {filtered.map((o) => (
          <label key={o} className="multiselect-opt">
            <input type="checkbox" checked={selected.includes(o)} onChange={() => onToggle(o)} />
            {o}
          </label>
        ))}
        {filtered.length === 0 && <p className="m" style={{ padding: "6px 2px" }}>No matches.</p>}
      </div>
    </div>
  );
}

type SortMode = "earliest" | "newest" | "az" | "level";

function sortSkillsFirstDate(a: Student["skills"][number]) {
  return a.evidence.reduce((min, e) => (e.date < min ? e.date : min), a.evidence[0]?.date ?? "9999");
}
function sortSkillsLastDate(a: Student["skills"][number]) {
  return a.evidence.reduce((max, e) => (e.date > max ? e.date : max), a.evidence[0]?.date ?? "");
}

export function ProfileTab({
  student,
  onChange,
}: {
  student: Student;
  onChange: (next: Student) => void;
}) {
  const [interestsText, setInterestsText] = useState(student.interests.join(", "));
  const [relFilter, setRelFilter] = useState<ContactRelationship | "all">("all");
  const [pathFilter, setPathFilter] = useState<CareerPath | "all">("all");

  const [skillSort, setSkillSort] = useState<SortMode>("earliest");
  const [openEvidenceFor, setOpenEvidenceFor] = useState<string | null>(null);
  const [evDate, setEvDate] = useState(today());
  const [evDesc, setEvDesc] = useState("");
  const [newSkillTitle, setNewSkillTitle] = useState("");
  const [newSkillPath, setNewSkillPath] = useState<CareerPath>("");

  const [expSort, setExpSort] = useState<SortMode>("earliest");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Entry | null>(null);

  const [type, setType] = useState<EntryType>("experience");
  const [title, setTitle] = useState("");
  const [meta, setMeta] = useState("");
  const [toolsText, setToolsText] = useState("");
  const [date, setDate] = useState(today());
  const [path, setPath] = useState<CareerPath>("");
  const [relationship, setRelationship] = useState<ContactRelationship>("mentor");

  const liveRef = useRef<HTMLDivElement>(null);
  function announce(msg: string) {
    if (liveRef.current) liveRef.current.textContent = msg;
  }

  function field<K extends keyof Student>(key: K, value: Student[K]) {
    onChange({ ...student, [key]: value });
  }
  function toggleMajor(m: string) {
    field("majors", student.majors.includes(m) ? student.majors.filter((x) => x !== m) : [...student.majors, m]);
  }
  function toggleMinor(m: string) {
    field("minors", student.minors.includes(m) ? student.minors.filter((x) => x !== m) : [...student.minors, m]);
  }
  function commitInterests(text: string) {
    setInterestsText(text);
    field("interests", text.split(",").map((s) => s.trim()).filter(Boolean));
  }

  // --- Skills -----------------------------------------------------------

  const sortedSkills = useMemo(() => {
    const list = [...student.skills];
    if (skillSort === "earliest") list.sort((a, b) => sortSkillsFirstDate(a).localeCompare(sortSkillsFirstDate(b)));
    else if (skillSort === "newest") list.sort((a, b) => sortSkillsLastDate(b).localeCompare(sortSkillsLastDate(a)));
    else if (skillSort === "az") list.sort((a, b) => a.title.localeCompare(b.title));
    else list.sort((a, b) => b.evidence.length - a.evidence.length);
    return list;
  }, [student.skills, skillSort]);

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
        s.id === skillId ? { ...s, evidence: [...s.evidence, { id: uid(), date: evDate, description: d }] } : s
      ),
    });
    setEvDesc("");
    setEvDate(today());
    setOpenEvidenceFor(null);
    announce("Evidence added.");
  }
  function delEvidence(skillId: string, evId: string) {
    onChange({
      ...student,
      skills: student.skills.map((s) => (s.id === skillId ? { ...s, evidence: s.evidence.filter((e) => e.id !== evId) } : s)),
    });
  }

  // --- Experience / contacts ---------------------------------------------

  const portfolio = student.entries.filter((e) => e.type === "experience");
  const contacts = student.entries.filter((e) => e.type === "contact");

  const sortedPortfolio = useMemo(() => {
    const list = [...portfolio];
    if (expSort === "earliest") list.sort((a, b) => a.date.localeCompare(b.date));
    else if (expSort === "newest") list.sort((a, b) => b.date.localeCompare(a.date));
    else list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [portfolio, expSort]);

  const shownContacts = contacts.filter(
    (c) => (relFilter === "all" || c.relationship === relFilter) && (pathFilter === "all" || c.path === pathFilter)
  );
  const contactRelCounts = useMemo(() => {
    const m = new Map<ContactRelationship, number>();
    for (const c of contacts) if (c.relationship) m.set(c.relationship, (m.get(c.relationship) ?? 0) + 1);
    return m;
  }, [contacts]);

  function add(ev: React.FormEvent) {
    ev.preventDefault();
    const t = title.trim();
    if (!t) return;
    const tools = toolsText.split(",").map((s) => s.trim()).filter(Boolean);
    onChange({
      ...student,
      entries: [
        {
          id: uid(),
          type,
          title: t,
          meta: meta.trim(),
          date: date || today(),
          path,
          relationship: type === "contact" ? relationship : undefined,
          tools: type === "experience" && tools.length ? tools : undefined,
        },
        ...student.entries,
      ],
    });
    setTitle("");
    setMeta("");
    setToolsText("");
    announce(`Added ${CATS[type].label.toLowerCase()} entry: ${t}.`);
  }
  function del(id: string) {
    const gone = student.entries.find((x) => x.id === id);
    onChange({ ...student, entries: student.entries.filter((x) => x.id !== id) });
    if (gone) announce(`Removed ${gone.title}.`);
  }
  function startEdit(entry: Entry) {
    setEditingId(entry.id);
    setEditDraft({ ...entry });
  }
  function saveEdit() {
    if (!editDraft) return;
    onChange({ ...student, entries: student.entries.map((x) => (x.id === editDraft.id ? editDraft : x)) });
    setEditingId(null);
    setEditDraft(null);
    announce("Entry updated.");
  }

  const skillTitles = new Set(student.skills.map((s) => s.title.toLowerCase()));

  return (
    <>
      <p className="eyebrow">Profile</p>
      <h1 className="page">Your profile</h1>
      <p className="lede">What the Career Center — and eventually a recruiter — would see about you.</p>

      {/* Identity */}
      <section className="sec" aria-labelledby="id-h">
        <div className="sec-head"><h2 id="id-h">About you</h2></div>
        <div className="profile-grid" style={{ marginBottom: 16 }}>
          <div className="field grow">
            <label htmlFor="p-headline">Your goal / headline</label>
            <input id="p-headline" value={student.headline} onChange={(e) => field("headline", e.target.value)} placeholder="e.g. Aiming for a UX internship by junior summer" />
          </div>
          <div className="field grow">
            <label htmlFor="p-interests">Interests <span style={{ fontWeight: 400 }}>(comma-separated)</span></label>
            <input id="p-interests" value={interestsText} onChange={(e) => commitInterests(e.target.value)} placeholder="e.g. Photography, Debate, Hiking" />
          </div>
          <div className="field grow">
            <label htmlFor="p-resume">Resume link</label>
            <input id="p-resume" type="url" value={student.resumeUrl} onChange={(e) => field("resumeUrl", e.target.value)} placeholder="Link to a PDF or Drive doc" />
          </div>
          <div className="field grow">
            <label htmlFor="p-linkedin">LinkedIn</label>
            <input id="p-linkedin" value={student.linkedin} onChange={(e) => field("linkedin", e.target.value)} placeholder="linkedin.com/in/…" />
          </div>
        </div>
        {student.interests.length > 0 && (
          <div className="chiprow" style={{ marginBottom: 20 }}>
            {student.interests.map((i) => (
              <span className="pill chip-accent" key={i}>{i}</span>
            ))}
          </div>
        )}
        <div className="grid2col">
          <MultiSelect label="Majors" options={MAJORS} selected={student.majors} onToggle={toggleMajor} />
          <MultiSelect label="Minors" options={MINORS} selected={student.minors} onToggle={toggleMinor} />
        </div>
      </section>

      {/* Skills: growth cards */}
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
          <div className="empty">Nothing logged yet. Start with one skill you already have — it counts.</div>
        ) : (
          <div className="skillcards">
            {sortedSkills.map((s) => {
              const level = levelFor(s.evidence.length);
              const pct = Math.min(100, Math.round((s.evidence.length / ADVANCED_AT) * 100));
              const evOrdered = [...s.evidence].sort((a, b) => a.date.localeCompare(b.date));
              return (
                <div className="skillcard" key={s.id}>
                  <div className="row-between">
                    <h3>{s.title}{s.path && <span className="pathchip" style={{ marginLeft: 8 }}>{pathLabel(s.path)}</span>}</h3>
                    <span className="proflevel">{SKILL_LEVEL_LABEL[level]}</span>
                  </div>
                  <div className="track"><i style={{ width: pct + "%" }} /></div>
                  <ul className="evidencelist">
                    {evOrdered.map((e) => (
                      <li key={e.id}>
                        <span className="ev-date">{fmt(e.date)}</span>
                        <span className="ev-desc">{e.description || "—"}</span>
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
                      <button className="btn btn-sm" type="submit">Save</button>
                      <button className="btn btn-sm btn-outline" type="button" onClick={() => setOpenEvidenceFor(null)}>Cancel</button>
                    </form>
                  ) : (
                    <div className="row" style={{ marginTop: 8, gap: 8 }}>
                      <button className="badge-sm-btn" onClick={() => { setOpenEvidenceFor(s.id); setEvDesc(""); setEvDate(today()); }}>+ Add evidence</button>
                      <button className="del" onClick={() => delSkill(s.id)} aria-label={`Remove skill ${s.title}`}>Remove skill</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Log an entry: experience / contact */}
      <section className="sec" aria-labelledby="log-h">
        <div className="sec-head"><h2 id="log-h">Log an entry</h2></div>
        <form className="logbar" onSubmit={add}>
          <div className="field">
            <label htmlFor="etype">Type</label>
            <select id="etype" value={type} onChange={(e) => setType(e.target.value as EntryType)}>
              <option value="experience">Experience</option>
              <option value="contact">Network</option>
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
          {type === "contact" ? (
            <div className="field">
              <label htmlFor="erel">Relationship</label>
              <select id="erel" value={relationship} onChange={(e) => setRelationship(e.target.value as ContactRelationship)}>
                {RELATIONSHIPS.map((r) => <option key={r} value={r}>{RELATIONSHIP_LABEL[r]}</option>)}
              </select>
            </div>
          ) : (
            <div className="field grow">
              <label htmlFor="etools">Tools/tech used <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input id="etools" value={toolsText} onChange={(e) => setToolsText(e.target.value)} placeholder="e.g. Python, Figma" />
            </div>
          )}
          <div className="field">
            <label htmlFor="epath">{type === "contact" ? "Industry" : "Career path"} <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <select id="epath" value={path} onChange={(e) => setPath(e.target.value as CareerPath)}>
              <option value="">— none —</option>
              {PATHS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          <button className="btn" type="submit">Add entry</button>
        </form>
        <p id="ehelp" className="sr-only">{CATS[type].help}</p>
      </section>

      {/* Experience */}
      <section className="sec" aria-labelledby="port-h">
        <div className="sec-head">
          <h2 id="port-h">Experience</h2>
          <label className="sr-only" htmlFor="exp-sort">Sort experience</label>
          <select id="exp-sort" className="sortselect" value={expSort} onChange={(e) => setExpSort(e.target.value as SortMode)}>
            <option value="earliest">Earliest first</option>
            <option value="newest">Newest first</option>
            <option value="az">A–Z</option>
          </select>
        </div>
        {sortedPortfolio.length === 0 ? (
          <div className="empty">Nothing logged yet.</div>
        ) : (
          <ul className="entries">
            {sortedPortfolio.map((e) =>
              editingId === e.id && editDraft ? (
                <li key={e.id} className="editrow">
                  <input value={editDraft.title} onChange={(ev) => setEditDraft({ ...editDraft, title: ev.target.value })} placeholder="What" />
                  <input value={editDraft.meta} onChange={(ev) => setEditDraft({ ...editDraft, meta: ev.target.value })} placeholder="Detail" />
                  <input type="date" value={editDraft.date} onChange={(ev) => setEditDraft({ ...editDraft, date: ev.target.value })} max={today()} />
                  <input
                    value={(editDraft.tools ?? []).join(", ")}
                    onChange={(ev) => setEditDraft({ ...editDraft, tools: ev.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                    placeholder="Tools/tech (comma-separated)"
                  />
                  <button className="btn btn-sm" onClick={saveEdit}>Save</button>
                  <button className="btn btn-sm btn-outline" onClick={() => { setEditingId(null); setEditDraft(null); }}>Cancel</button>
                </li>
              ) : (
                <li key={e.id}>
                  <span className={"tag " + e.type}>{CATS.experience.label}</span>
                  <span className="entry-main">
                    <span className="t">{e.title}</span>
                    {e.meta && <span className="m">{e.meta}</span>}
                    {e.path && <span className="pathchip">{pathLabel(e.path)}</span>}
                    {e.tools && e.tools.length > 0 && (
                      <span className="chiprow" style={{ marginTop: 6 }}>
                        {e.tools.map((t) => (
                          <span key={t} className={"pill chip-tool" + (skillTitles.has(t.toLowerCase()) ? " linked" : "")}>{t}</span>
                        ))}
                      </span>
                    )}
                  </span>
                  <button className="badge-sm-btn" onClick={() => startEdit(e)}>Edit</button>
                  <button className="del" onClick={() => del(e.id)} aria-label={`Remove ${e.title}`}>Remove</button>
                </li>
              )
            )}
          </ul>
        )}
      </section>

      {/* Connections */}
      <section className="sec" aria-labelledby="conn-h">
        <div className="sec-head">
          <h2 id="conn-h">Connections</h2>
          <span className="count">{shownContacts.length} of {contacts.length}</span>
        </div>
        <div className="filterrow" role="group" aria-label="Filter connections by relationship">
          <button className={"filterchip" + (relFilter === "all" ? " active" : "")} aria-pressed={relFilter === "all"} onClick={() => setRelFilter("all")}>
            All ({contacts.length})
          </button>
          {RELATIONSHIPS.filter((r) => contactRelCounts.has(r)).map((r) => (
            <button key={r} className={"filterchip" + (relFilter === r ? " active" : "")} aria-pressed={relFilter === r} onClick={() => setRelFilter(r)}>
              {RELATIONSHIP_LABEL[r]} ({contactRelCounts.get(r)})
            </button>
          ))}
        </div>
        <div className="field" style={{ maxWidth: 280, marginBottom: 12 }}>
          <label htmlFor="conn-path">Filter by industry</label>
          <select id="conn-path" value={pathFilter} onChange={(e) => setPathFilter(e.target.value as CareerPath | "all")}>
            <option value="all">All industries</option>
            {PATHS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        {shownContacts.length === 0 ? (
          <div className="empty">{contacts.length === 0 ? "No connections logged yet — add one above." : "No connections match this filter."}</div>
        ) : (
          <ul className="entries">
            {shownContacts.map((e) => (
              <li key={e.id}>
                <span className="tag contact">{e.relationship ? RELATIONSHIP_LABEL[e.relationship] : "Contact"}</span>
                <span className="entry-main">
                  <span className="t">{e.title}</span>
                  {e.meta && <span className="m">{e.meta}</span>}
                  {e.path && <span className="pathchip">{pathLabel(e.path)}</span>}
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
