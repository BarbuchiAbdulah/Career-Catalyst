import { useMemo, useRef, useState } from "react";
import type { CareerPath, Contact, ContactRelationship, Student } from "../lib/types";
import { PATHS, RELATIONSHIPS, RELATIONSHIP_LABEL, pathLabel } from "../lib/scoring";
import { uid } from "../lib/seed";
import { ALUMNI_DIRECTORY } from "../lib/content";
import { CarouselRow, MailIcon, LinkedinIcon } from "./ResourcesTab";

const today = () => new Date().toISOString().slice(0, 10);
const DAY = 86400000;

function fmtLast(iso: string): string {
  if (!iso) return "No contact logged";
  const days = Math.round((Date.now() - new Date(iso + "T00:00:00").getTime()) / DAY);
  if (days <= 0) return "Last: today";
  if (days === 1) return "Last: yesterday";
  if (days < 14) return `Last: ${days} days ago`;
  if (days < 60) return `Last: ${Math.round(days / 7)} weeks ago`;
  return `Last: ${Math.round(days / 30)} months ago`;
}

function isStale(iso: string): boolean {
  if (!iso) return false;
  const days = Math.round((Date.now() - new Date(iso + "T00:00:00").getTime()) / DAY);
  return days >= 60;
}

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
    </svg>
  );
}

function StrengthDots({ n }: { n: number }) {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <i key={i} className={n >= i ? "filled" : ""} />
      ))}
    </>
  );
}

const emptyDraft = (): Omit<Contact, "id"> => ({
  name: "",
  relationship: "mentor",
  path: "",
  company: "",
  role: "",
  grad: "",
  strength: 2,
  email: "",
  phone: "",
  linkedin: "",
  note: "",
  date: today(),
});

type SubTab = "connections" | "explore";

export function NetworkTab({
  student,
  onChange,
}: {
  student: Student;
  onChange: (next: Student) => void;
}) {
  const [subTab, setSubTab] = useState<SubTab>("connections");
  const [q, setQ] = useState("");
  const [relFilter, setRelFilter] = useState<ContactRelationship | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<Contact, "id">>(emptyDraft());
  const [alumniPathFilter, setAlumniPathFilter] = useState<CareerPath | "all">("all");
  const liveRef = useRef<HTMLDivElement>(null);

  function announce(msg: string) {
    if (liveRef.current) liveRef.current.textContent = msg;
  }

  const savedNames = new Set(student.contacts.map((c) => c.name));
  function saveAlumni(a: (typeof ALUMNI_DIRECTORY)[number]) {
    if (savedNames.has(a.name)) return;
    onChange({
      ...student,
      contacts: [
        {
          id: uid(),
          name: a.name,
          relationship: "alumni",
          path: a.path,
          email: a.email,
          linkedin: a.linkedin,
          note: `${a.role} · Class of ${a.grad}`,
          date: today(),
        },
        ...student.contacts,
      ],
    });
    announce(`Saved ${a.name} to your connections.`);
  }
  const filteredAlumni = ALUMNI_DIRECTORY.filter((a) => alumniPathFilter === "all" || a.path === alumniPathFilter);
  const alumniPaths = [...new Set(ALUMNI_DIRECTORY.map((a) => a.path).filter(Boolean))] as Exclude<CareerPath, "">[];

  const relCounts = useMemo(() => {
    const m = new Map<ContactRelationship, number>();
    for (const c of student.contacts) m.set(c.relationship, (m.get(c.relationship) ?? 0) + 1);
    return m;
  }, [student.contacts]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return student.contacts.filter((c) => {
      if (relFilter !== "all" && c.relationship !== relFilter) return false;
      if (!term) return true;
      return (
        c.name.toLowerCase().includes(term) ||
        (c.company ?? "").toLowerCase().includes(term) ||
        (c.role ?? "").toLowerCase().includes(term) ||
        c.note.toLowerCase().includes(term) ||
        pathLabel(c.path).toLowerCase().includes(term)
      );
    });
  }, [student.contacts, q, relFilter]);

  function openAdd() {
    setEditingId(null);
    setDraft(emptyDraft());
    setFormOpen(true);
  }
  function openEdit(c: Contact) {
    setEditingId(c.id);
    setDraft({ ...c });
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }
  function submitForm(ev: React.FormEvent) {
    ev.preventDefault();
    const name = draft.name.trim();
    if (!name) return;
    if (editingId) {
      onChange({
        ...student,
        contacts: student.contacts.map((c) => (c.id === editingId ? { ...draft, id: editingId, name } : c)),
      });
      announce(`Updated ${name}.`);
    } else {
      const contact: Contact = { ...draft, id: uid(), name };
      onChange({ ...student, contacts: [contact, ...student.contacts] });
      announce(`Added connection: ${name}.`);
    }
    closeForm();
  }
  function delContact(c: Contact) {
    onChange({ ...student, contacts: student.contacts.filter((x) => x.id !== c.id) });
    announce(`Removed ${c.name}.`);
  }

  return (
    <>
      <div className="row-between" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page">Your network</h1>
          <p className="lede">Mentors, alumni, recruiters, and industry contacts — plus alumni to discover and connect with.</p>
        </div>
      </div>

      <div className="subtabs" role="tablist" aria-label="Network sections">
        <button role="tab" aria-selected={subTab === "connections"} className={"subtab" + (subTab === "connections" ? " active" : "")} onClick={() => setSubTab("connections")}>
          Your connections ({student.contacts.length})
        </button>
        <button role="tab" aria-selected={subTab === "explore"} className={"subtab" + (subTab === "explore" ? " active" : "")} onClick={() => setSubTab("explore")}>
          Explore alumni
        </button>
      </div>

      {subTab === "explore" ? (
        <section className="sec" aria-labelledby="alum-h">
          <div className="sec-head"><h2 id="alum-h">Alumni to connect with</h2></div>
          <div className="field" style={{ maxWidth: 320, marginBottom: 12 }}>
            <label htmlFor="alumni-path">Filter by career path</label>
            <select id="alumni-path" value={alumniPathFilter} onChange={(e) => setAlumniPathFilter(e.target.value as CareerPath | "all")}>
              <option value="all">All paths</option>
              {alumniPaths.map((p) => <option key={p} value={p}>{pathLabel(p)}</option>)}
            </select>
          </div>
          {filteredAlumni.length === 0 ? (
            <div className="empty">No alumni match this filter.</div>
          ) : (
            <CarouselRow label="alumni">
              {filteredAlumni.map((a) => {
                const saved = savedNames.has(a.name);
                return (
                  <div className="resourcecard" key={a.id}>
                    <span className="avatarring" aria-hidden="true">{a.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                    <h3>{a.name}</h3>
                    <p className="jobcard-org">{a.role} · Class of {a.grad}</p>
                    <p className="jobcard-blurb">{a.blurb}</p>
                    <span className="pathchip">{pathLabel(a.path)}</span>
                    <span className="contactinfo">
                      <a href={`mailto:${a.email}`} className="linkicon" aria-label={`Email ${a.name}`}>
                        <MailIcon />
                      </a>
                      <a
                        href={a.linkedin.startsWith("http") ? a.linkedin : `https://${a.linkedin}`}
                        target="_blank"
                        rel="noreferrer"
                        className="linkicon"
                        aria-label={`${a.name}'s LinkedIn profile`}
                      >
                        <LinkedinIcon />
                      </a>
                    </span>
                    <button className="btn btn-sm" disabled={saved} onClick={() => saveAlumni(a)}>
                      {saved ? "Saved" : "Save as connection"}
                    </button>
                  </div>
                );
              })}
            </CarouselRow>
          )}
        </section>
      ) : (
        <>
      <div className="topbar">
        <div className="searchbox">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, company, or tag…"
            aria-label="Search connections by name, company, or tag"
          />
        </div>
        <button className="btn" onClick={openAdd}>+ Add Contact</button>
      </div>

      <div className="filterrow" role="group" aria-label="Filter connections by relationship">
        <button className={"filterchip" + (relFilter === "all" ? " active" : "")} aria-pressed={relFilter === "all"} onClick={() => setRelFilter("all")}>
          All ({student.contacts.length})
        </button>
        {RELATIONSHIPS.filter((r) => relCounts.has(r)).map((r) => (
          <button key={r} className={"filterchip" + (relFilter === r ? " active" : "")} aria-pressed={relFilter === r} onClick={() => setRelFilter(r)}>
            {RELATIONSHIP_LABEL[r]} ({relCounts.get(r)})
          </button>
        ))}
      </div>

      {formOpen && (
        <section className="sec" aria-labelledby="net-form-h">
          <div className="sec-head"><h2 id="net-form-h">{editingId ? "Edit connection" : "Add a connection"}</h2></div>
          <form className="logbar" onSubmit={submitForm}>
            <div className="field grow">
              <label htmlFor="n-name">Name</label>
              <input id="n-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Alum in your field" autoFocus />
            </div>
            <div className="field">
              <label htmlFor="n-rel">Relationship</label>
              <select id="n-rel" value={draft.relationship} onChange={(e) => setDraft({ ...draft, relationship: e.target.value as ContactRelationship })}>
                {RELATIONSHIPS.map((r) => <option key={r} value={r}>{RELATIONSHIP_LABEL[r]}</option>)}
              </select>
            </div>
            <div className="field grow">
              <label htmlFor="n-company">Company <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input id="n-company" value={draft.company ?? ""} onChange={(e) => setDraft({ ...draft, company: e.target.value })} placeholder="e.g. Nike Inc." />
            </div>
            <div className="field grow">
              <label htmlFor="n-role">Job title <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input id="n-role" value={draft.role ?? ""} onChange={(e) => setDraft({ ...draft, role: e.target.value })} placeholder="e.g. Sustainability Manager" />
            </div>
            <div className="field">
              <label htmlFor="n-grad">Their class year <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input id="n-grad" value={draft.grad ?? ""} onChange={(e) => setDraft({ ...draft, grad: e.target.value })} placeholder="e.g. 2018" inputMode="numeric" />
            </div>
            <div className="field">
              <label htmlFor="n-path">Industry <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <select id="n-path" value={draft.path} onChange={(e) => setDraft({ ...draft, path: e.target.value as CareerPath })}>
                <option value="">— none —</option>
                {PATHS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
            <div className="field grow">
              <label htmlFor="n-email">Email <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input id="n-email" type="email" value={draft.email ?? ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="name@example.com" />
            </div>
            <div className="field grow">
              <label htmlFor="n-phone">Phone <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input id="n-phone" value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="(503) 555-0100" />
            </div>
            <div className="field grow">
              <label htmlFor="n-linkedin">LinkedIn <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input id="n-linkedin" value={draft.linkedin ?? ""} onChange={(e) => setDraft({ ...draft, linkedin: e.target.value })} placeholder="linkedin.com/in/…" />
            </div>
            <div className="field">
              <label htmlFor="n-last">Last contact</label>
              <input id="n-last" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} max={today()} />
            </div>
            <div className="field">
              <span style={{ display: "block", marginBottom: 10 }}>Relationship strength</span>
              <div className="strengthdots" role="group" aria-label="Set relationship strength, 1 to 3">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`Strength ${n} of 3`}
                    aria-pressed={(draft.strength ?? 2) >= n}
                    onClick={() => setDraft({ ...draft, strength: n as 1 | 2 | 3 })}
                    style={{ border: 0, background: "transparent", padding: 4, cursor: "pointer" }}
                  >
                    <i className={(draft.strength ?? 2) >= n ? "filled" : ""} />
                  </button>
                ))}
              </div>
            </div>
            <div className="field grow">
              <label htmlFor="n-note">Note <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input id="n-note" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="How you know them, what you talked about" />
            </div>
            <button className="btn" type="submit">{editingId ? "Save" : "Add Contact"}</button>
            <button className="btn btn-outline" type="button" onClick={closeForm}>Cancel</button>
          </form>
        </section>
      )}

      {shown.length === 0 ? (
        <div className="empty">
          {student.contacts.length === 0 ? "No connections logged yet — add one above." : "No connections match this search or filter."}
        </div>
      ) : (
        <div className="cardgrid">
          {shown.map((c) => (
            <div className="resourcecard netcard" key={c.id}>
              <div className="netcard-top">
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", minWidth: 0 }}>
                  <span className={"netavatar " + c.relationship} aria-hidden="true">{initials(c.name)}</span>
                  <div style={{ minWidth: 0 }}>
                    <h3 className="netcard-name">{c.name}</h3>
                    {c.role && <p className="netcard-sub">{c.role}</p>}
                    {(c.company || c.grad) && (
                      <p className="netcard-sub">
                        {c.company}
                        {c.company && c.grad && " · "}
                        {c.grad && `'${c.grad.slice(-2)}`}
                      </p>
                    )}
                  </div>
                </div>
                <button className="expcard-iconbtn" onClick={() => delContact(c)} aria-label={`Remove ${c.name}`}>
                  <TrashIcon />
                </button>
              </div>
              <div className="chiprow" style={{ margin: "10px 0 6px" }}>
                <span className={"tag rel-" + c.relationship}>{RELATIONSHIP_LABEL[c.relationship]}</span>
                {c.path && <span className="pathchip">{pathLabel(c.path)}</span>}
              </div>
              {c.note && <p className="jobcard-blurb">{c.note}</p>}
              <div className="row-between" style={{ width: "100%", marginTop: 6 }}>
                <span className="strengthdots" role="img" aria-label={`Relationship strength ${c.strength ?? 1} of 3`}>
                  <StrengthDots n={c.strength ?? 1} />
                </span>
                <span className={"netcard-last" + (isStale(c.date) ? " stale" : "")}>{fmtLast(c.date)}</span>
              </div>
              <div className="netcard-actions">
                {c.email && (
                  <a href={`mailto:${c.email}`} className="netcard-iconbtn" aria-label={`Email ${c.name}`}>
                    <MailIcon />
                  </a>
                )}
                {c.linkedin && (
                  <a
                    href={c.linkedin.startsWith("http") ? c.linkedin : `https://${c.linkedin}`}
                    target="_blank"
                    rel="noreferrer"
                    className="netcard-iconbtn"
                    aria-label={`${c.name}'s LinkedIn profile`}
                  >
                    <LinkedinIcon />
                  </a>
                )}
                <button className="badge-sm-btn" onClick={() => openEdit(c)}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}

      <div ref={liveRef} className="sr-only" aria-live="polite"></div>
    </>
  );
}
