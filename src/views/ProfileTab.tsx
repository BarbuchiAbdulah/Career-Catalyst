import { useMemo, useRef, useState } from "react";
import type { CareerPath, Contact, ContactRelationship, Entry, Student } from "../lib/types";
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

function dateRange(e: { startDate: string; endDate?: string; ongoing: boolean }): string {
  const start = fmt(e.startDate);
  if (e.ongoing) return `${start} – Present`;
  if (e.endDate) return `${start} – ${fmt(e.endDate)}`;
  return start;
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
  // Only shows the search+checklist while actively picking — once there's a
  // selection, it collapses to chips so the long real list doesn't linger.
  const [editing, setEditing] = useState(selected.length === 0);
  const filtered = q.trim() ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase())) : options;
  return (
    <div className="majorscard">
      <div className="row-between" style={{ marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>{label}</h3>
        {selected.length > 0 && (
          <button type="button" className="badge-sm-btn" onClick={() => setEditing((e) => !e)}>
            {editing ? "Done" : `Edit ${label.toLowerCase()}`}
          </button>
        )}
      </div>
      {selected.length > 0 && (
        <div className="chiprow" style={{ marginBottom: editing ? 10 : 0 }}>
          {selected.map((s) => (
            <button type="button" className="pill chip-accent" key={s} onClick={() => onToggle(s)} aria-label={`Remove ${s}`}>
              {s} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
      {!editing ? null : (
        <>
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
        </>
      )}
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

  const [skillSort, setSkillSort] = useState<SortMode>("earliest");
  const [openEvidenceFor, setOpenEvidenceFor] = useState<string | null>(null);
  const [evDate, setEvDate] = useState(today());
  const [evDesc, setEvDesc] = useState("");
  const [newSkillTitle, setNewSkillTitle] = useState("");
  const [newSkillPath, setNewSkillPath] = useState<CareerPath>("");

  const [expSort, setExpSort] = useState<SortMode>("earliest");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Entry | null>(null);

  const [title, setTitle] = useState("");
  const [meta, setMeta] = useState("");
  const [toolsText, setToolsText] = useState("");
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState("");
  const [ongoing, setOngoing] = useState(false);
  const [path, setPath] = useState<CareerPath>("");

  const [relFilter, setRelFilter] = useState<ContactRelationship | "all">("all");
  const [pathFilter, setPathFilter] = useState<CareerPath | "all">("all");
  const [cName, setCName] = useState("");
  const [cRelationship, setCRelationship] = useState<ContactRelationship>("mentor");
  const [cPath, setCPath] = useState<CareerPath>("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cLinkedin, setCLinkedin] = useState("");
  const [cNote, setCNote] = useState("");
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContactDraft, setEditContactDraft] = useState<Contact | null>(null);

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

  // --- Experience ---------------------------------------------------------

  const sortedExperience = useMemo(() => {
    const list = [...student.entries];
    if (expSort === "earliest") list.sort((a, b) => a.startDate.localeCompare(b.startDate));
    else if (expSort === "newest") list.sort((a, b) => b.startDate.localeCompare(a.startDate));
    else list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [student.entries, expSort]);

  function addExperience(ev: React.FormEvent) {
    ev.preventDefault();
    const t = title.trim();
    if (!t) return;
    const tools = toolsText.split(",").map((s) => s.trim()).filter(Boolean);
    onChange({
      ...student,
      entries: [
        {
          id: uid(),
          title: t,
          meta: meta.trim(),
          startDate: startDate || today(),
          endDate: ongoing ? undefined : endDate || undefined,
          ongoing,
          path,
          tools: tools.length ? tools : undefined,
        },
        ...student.entries,
      ],
    });
    setTitle("");
    setMeta("");
    setToolsText("");
    setEndDate("");
    setOngoing(false);
    announce(`Added experience: ${t}.`);
  }
  function delExperience(id: string) {
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
    announce("Experience updated.");
  }

  const skillTitles = new Set(student.skills.map((s) => s.title.toLowerCase()));

  // --- Connections ---------------------------------------------------------

  const shownContacts = student.contacts.filter(
    (c) => (relFilter === "all" || c.relationship === relFilter) && (pathFilter === "all" || c.path === pathFilter)
  );
  const contactRelCounts = useMemo(() => {
    const m = new Map<ContactRelationship, number>();
    for (const c of student.contacts) m.set(c.relationship, (m.get(c.relationship) ?? 0) + 1);
    return m;
  }, [student.contacts]);

  function addContact(ev: React.FormEvent) {
    ev.preventDefault();
    const n = cName.trim();
    if (!n) return;
    const contact: Contact = {
      id: uid(),
      name: n,
      relationship: cRelationship,
      path: cPath,
      email: cEmail.trim() || undefined,
      phone: cPhone.trim() || undefined,
      linkedin: cLinkedin.trim() || undefined,
      note: cNote.trim(),
      date: today(),
    };
    onChange({ ...student, contacts: [contact, ...student.contacts] });
    setCName("");
    setCEmail("");
    setCPhone("");
    setCLinkedin("");
    setCNote("");
    announce(`Added connection: ${n}.`);
  }
  function delContact(id: string) {
    const gone = student.contacts.find((c) => c.id === id);
    onChange({ ...student, contacts: student.contacts.filter((c) => c.id !== id) });
    if (gone) announce(`Removed ${gone.name}.`);
  }
  function startEditContact(c: Contact) {
    setEditingContactId(c.id);
    setEditContactDraft({ ...c });
  }
  function saveEditContact() {
    if (!editContactDraft) return;
    onChange({ ...student, contacts: student.contacts.map((c) => (c.id === editContactDraft.id ? editContactDraft : c)) });
    setEditingContactId(null);
    setEditContactDraft(null);
    announce("Connection updated.");
  }

  return (
    <>
      <p className="eyebrow">Profile</p>
      <h1 className="page">Your profile</h1>
      <p className="lede">What the Career Center — and eventually a recruiter — would see about you.</p>

      {/* Identity */}
      <section className="sec" aria-labelledby="id-h">
        <div className="sec-head"><h2 id="id-h">About you</h2></div>
        <div className="profile-header">
          <div className="profileavatar" aria-hidden="true">
            {student.avatarUrl ? <img src={student.avatarUrl} alt="" /> : student.name.charAt(0) || "?"}
          </div>
          <div>
            <div className="profile-header-name">{student.name || "You"}</div>
            <div className="profile-header-sub">Class of {student.grad || "—"}</div>
          </div>
          <p className="profile-header-hint">Change your photo in Settings.</p>
        </div>
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
                    <h3>{s.title}{s.path && <span className="pathchip">{pathLabel(s.path)}</span>}</h3>
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

      {/* Log experience */}
      <section className="sec" aria-labelledby="log-h">
        <div className="sec-head"><h2 id="log-h">Log experience</h2></div>
        <form className="logbar" onSubmit={addExperience}>
          <div className="field grow">
            <label htmlFor="etitle">What</label>
            <input id="etitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={CATS.experience.ex} aria-describedby="ehelp" />
          </div>
          <div className="field grow">
            <label htmlFor="emeta">Detail <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input id="emeta" value={meta} onChange={(e) => setMeta(e.target.value)} placeholder="Where, when, or context" />
          </div>
          <div className="field grow">
            <label htmlFor="estart" className="row-between">
              <span>Started – Ended</span>
              <span className="inline-check">
                <input type="checkbox" checked={ongoing} onChange={(e) => setOngoing(e.target.checked)} />
                Present
              </span>
            </label>
            <div className="daterange-row">
              <input id="estart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} max={today()} />
              <span aria-hidden="true">–</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={ongoing} aria-label="Ended" />
            </div>
          </div>
          <div className="field grow">
            <label htmlFor="etools">Tools/tech used <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input id="etools" value={toolsText} onChange={(e) => setToolsText(e.target.value)} placeholder="e.g. Python, Figma" />
          </div>
          <div className="field">
            <label htmlFor="epath">Career path <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <select id="epath" value={path} onChange={(e) => setPath(e.target.value as CareerPath)}>
              <option value="">— none —</option>
              {PATHS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          <button className="btn" type="submit">Add entry</button>
        </form>
        <p id="ehelp" className="sr-only">{CATS.experience.help}</p>
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
        {sortedExperience.length === 0 ? (
          <div className="empty">Nothing logged yet.</div>
        ) : (
          <ul className="entries">
            {sortedExperience.map((e) =>
              editingId === e.id && editDraft ? (
                <li key={e.id} className="editrow">
                  <input value={editDraft.title} onChange={(ev) => setEditDraft({ ...editDraft, title: ev.target.value })} placeholder="What" />
                  <input value={editDraft.meta} onChange={(ev) => setEditDraft({ ...editDraft, meta: ev.target.value })} placeholder="Detail" />
                  <input type="date" value={editDraft.startDate} onChange={(ev) => setEditDraft({ ...editDraft, startDate: ev.target.value })} max={today()} />
                  <input type="date" value={editDraft.endDate ?? ""} disabled={editDraft.ongoing} onChange={(ev) => setEditDraft({ ...editDraft, endDate: ev.target.value })} />
                  <label className="inline-check">
                    <input type="checkbox" checked={editDraft.ongoing} onChange={(ev) => setEditDraft({ ...editDraft, ongoing: ev.target.checked })} />
                    Still doing this
                  </label>
                  <select className="editrow-select" value={editDraft.path} onChange={(ev) => setEditDraft({ ...editDraft, path: ev.target.value as CareerPath })}>
                    <option value="">— no career path —</option>
                    {PATHS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
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
                  <span className="tag experience">{dateRange(e)}</span>
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
                  <button className="del" onClick={() => delExperience(e.id)} aria-label={`Remove ${e.title}`}>Remove</button>
                </li>
              )
            )}
          </ul>
        )}
      </section>

      {/* Connections: their own entity, not a repurposed experience row */}
      <section className="sec" aria-labelledby="conn-log-h">
        <div className="sec-head"><h2 id="conn-log-h">Add a connection</h2></div>
        <form className="logbar" onSubmit={addContact}>
          <div className="field grow">
            <label htmlFor="c-name">Name</label>
            <input id="c-name" value={cName} onChange={(e) => setCName(e.target.value)} placeholder="e.g. Alum in your field" />
          </div>
          <div className="field">
            <label htmlFor="c-rel">Relationship</label>
            <select id="c-rel" value={cRelationship} onChange={(e) => setCRelationship(e.target.value as ContactRelationship)}>
              {RELATIONSHIPS.map((r) => <option key={r} value={r}>{RELATIONSHIP_LABEL[r]}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="c-path">Industry <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <select id="c-path" value={cPath} onChange={(e) => setCPath(e.target.value as CareerPath)}>
              <option value="">— none —</option>
              {PATHS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          <div className="field grow">
            <label htmlFor="c-email">Email <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input id="c-email" type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="name@example.com" />
          </div>
          <div className="field grow">
            <label htmlFor="c-phone">Phone <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input id="c-phone" value={cPhone} onChange={(e) => setCPhone(e.target.value)} placeholder="(503) 555-0100" />
          </div>
          <div className="field grow">
            <label htmlFor="c-linkedin">LinkedIn <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input id="c-linkedin" value={cLinkedin} onChange={(e) => setCLinkedin(e.target.value)} placeholder="linkedin.com/in/…" />
          </div>
          <div className="field grow">
            <label htmlFor="c-note">Note <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input id="c-note" value={cNote} onChange={(e) => setCNote(e.target.value)} placeholder="How you know them, what you talked about" />
          </div>
          <button className="btn" type="submit">Add connection</button>
        </form>
      </section>

      <section className="sec" aria-labelledby="conn-h">
        <div className="sec-head">
          <h2 id="conn-h">Connections</h2>
          <span className="count">{shownContacts.length} of {student.contacts.length}</span>
        </div>
        <div className="filterrow" role="group" aria-label="Filter connections by relationship">
          <button className={"filterchip" + (relFilter === "all" ? " active" : "")} aria-pressed={relFilter === "all"} onClick={() => setRelFilter("all")}>
            All ({student.contacts.length})
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
          <div className="empty">{student.contacts.length === 0 ? "No connections logged yet — add one above." : "No connections match this filter."}</div>
        ) : (
          <ul className="entries">
            {shownContacts.map((c) =>
              editingContactId === c.id && editContactDraft ? (
                <li key={c.id} className="editrow">
                  <input value={editContactDraft.name} onChange={(ev) => setEditContactDraft({ ...editContactDraft, name: ev.target.value })} placeholder="Name" />
                  <select className="editrow-select" value={editContactDraft.relationship} onChange={(ev) => setEditContactDraft({ ...editContactDraft, relationship: ev.target.value as ContactRelationship })}>
                    {RELATIONSHIPS.map((r) => <option key={r} value={r}>{RELATIONSHIP_LABEL[r]}</option>)}
                  </select>
                  <select className="editrow-select" value={editContactDraft.path} onChange={(ev) => setEditContactDraft({ ...editContactDraft, path: ev.target.value as CareerPath })}>
                    <option value="">— no industry —</option>
                    {PATHS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                  <input value={editContactDraft.email ?? ""} onChange={(ev) => setEditContactDraft({ ...editContactDraft, email: ev.target.value })} placeholder="Email" />
                  <input value={editContactDraft.phone ?? ""} onChange={(ev) => setEditContactDraft({ ...editContactDraft, phone: ev.target.value })} placeholder="Phone" />
                  <input value={editContactDraft.linkedin ?? ""} onChange={(ev) => setEditContactDraft({ ...editContactDraft, linkedin: ev.target.value })} placeholder="LinkedIn" />
                  <input value={editContactDraft.note} onChange={(ev) => setEditContactDraft({ ...editContactDraft, note: ev.target.value })} placeholder="Note" />
                  <button className="btn btn-sm" onClick={saveEditContact}>Save</button>
                  <button className="btn btn-sm btn-outline" onClick={() => { setEditingContactId(null); setEditContactDraft(null); }}>Cancel</button>
                </li>
              ) : (
                <li key={c.id}>
                  <span className="tag contact">{RELATIONSHIP_LABEL[c.relationship]}</span>
                  <span className="entry-main">
                    <span className="t">{c.name}</span>
                    {c.note && <span className="m">{c.note}</span>}
                    {c.path && <span className="pathchip">{pathLabel(c.path)}</span>}
                    {(c.email || c.phone || c.linkedin) && (
                      <span className="contactinfo">
                        {c.email && <span>{c.email}</span>}
                        {c.phone && <span>{c.phone}</span>}
                        {c.linkedin && <span>{c.linkedin}</span>}
                      </span>
                    )}
                  </span>
                  <button className="badge-sm-btn" onClick={() => startEditContact(c)}>Edit</button>
                  <button className="del" onClick={() => delContact(c.id)} aria-label={`Remove ${c.name}`}>Remove</button>
                </li>
              )
            )}
          </ul>
        )}
      </section>

      <div ref={liveRef} className="sr-only" aria-live="polite"></div>
    </>
  );
}
