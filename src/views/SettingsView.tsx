import { useRef, useState } from "react";
import type { Student } from "../lib/types";
import { supabase } from "../lib/supabaseClient";
import { MAJORS, MINORS } from "../lib/seed";
import { band, bandColor, scoreFor } from "../lib/scoring";

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

// Role now comes from the authenticated account (students.role in Supabase),
// not a UI toggle — a student account can never click into the staff roster.
export function SettingsView({
  email,
  onSignOut,
  onReset,
  onLoadDemo,
  student,
  onChange,
}: {
  email: string;
  onSignOut: () => void;
  onReset: () => void;
  onLoadDemo: () => void;
  student: Student;
  onChange: (next: Student) => void;
}) {
  const [interestsText, setInterestsText] = useState(student.interests.join(", "));
  const [avatarBusy, setAvatarBusy] = useState(false);
  const liveRef = useRef<HTMLDivElement>(null);

  const { score } = scoreFor(student.skills, student.entries, student.contacts, student.grad);
  const b = band(score);

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

  async function handleAvatarChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    setAvatarBusy(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${student.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      announce("Couldn't upload photo. Try again.");
      setAvatarBusy(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    onChange({ ...student, avatarUrl: `${data.publicUrl}?t=${Date.now()}` });
    announce("Profile picture updated.");
    setAvatarBusy(false);
  }

  return (
    <>
      <h1 className="page">Settings</h1>
      <p className="lede">Signed in as {email}.</p>

      {student.role === "student" && (
      <section className="sec">
        <div className="profile-header">
          <div className="profileavatar" aria-hidden="true">
            {student.avatarUrl ? <img src={student.avatarUrl} alt="" /> : student.name.charAt(0) || "?"}
          </div>
          <div>
            <div className="profile-header-name">{student.name || "Your name"}</div>
            <div className="profile-header-sub">Class of {student.grad || "—"}</div>
            <span className={"pill " + b.cls} style={{ marginTop: 6 }}>
              <span className="dot" style={{ background: bandColor(b.key) }} />
              {score}/100 · {b.label}
            </span>
          </div>
          <div className="profile-header-photo">
            <label htmlFor="settings-avatar-input" className="badge-sm-btn" style={{ cursor: "pointer" }}>
              {avatarBusy ? "Uploading…" : "Change photo"}
            </label>
            <input
              id="settings-avatar-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="sr-only"
              disabled={avatarBusy}
            />
          </div>
        </div>

        <div className="grid2col" style={{ marginBottom: 16 }}>
          <MultiSelect label="Majors" options={MAJORS} selected={student.majors} onToggle={toggleMajor} />
          <MultiSelect label="Minors" options={MINORS} selected={student.minors} onToggle={toggleMinor} />
        </div>

        <div className="profile-grid" style={{ marginBottom: 16 }}>
          <div className="field grow">
            <label htmlFor="p-name">Name</label>
            <input id="p-name" value={student.name} onChange={(e) => field("name", e.target.value)} placeholder="Your full name" />
          </div>
          <div className="field">
            <label htmlFor="p-grad">Class year</label>
            <input id="p-grad" value={student.grad} onChange={(e) => field("grad", e.target.value)} placeholder="e.g. 2027" inputMode="numeric" />
          </div>
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
          <div className="chiprow">
            {student.interests.map((i) => (
              <span className="pill chip-strong" key={i}>{i}</span>
            ))}
          </div>
        )}
      </section>
      )}

      {student.role === "staff" && (
      <section className="sec">
        <div className="profile-header">
          <div className="profileavatar" aria-hidden="true">
            {student.avatarUrl ? <img src={student.avatarUrl} alt="" /> : student.name.charAt(0) || "?"}
          </div>
          <div>
            <div className="profile-header-name">{student.name || "Your name"}</div>
            <div className="profile-header-sub">{student.title || "Career Center staff"}</div>
          </div>
          <div className="profile-header-photo">
            <label htmlFor="settings-avatar-input" className="badge-sm-btn" style={{ cursor: "pointer" }}>
              {avatarBusy ? "Uploading…" : "Change photo"}
            </label>
            <input
              id="settings-avatar-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="sr-only"
              disabled={avatarBusy}
            />
          </div>
        </div>
        <div className="profile-grid">
          <div className="field grow">
            <label htmlFor="p-name">Name</label>
            <input id="p-name" value={student.name} onChange={(e) => field("name", e.target.value)} placeholder="Your full name" />
          </div>
          <div className="field grow">
            <label htmlFor="p-title">Position</label>
            <input id="p-title" value={student.title} onChange={(e) => field("title", e.target.value)} placeholder="e.g. Career Advisor" />
          </div>
        </div>
      </section>
      )}

      <section className="sec" aria-labelledby="account-h">
        <div className="sec-head"><h2 id="account-h">Account</h2></div>
        <button className="btn btn-outline" onClick={onSignOut}>
          Sign out
        </button>
      </section>

      {student.role === "student" && (
      <section className="sec" aria-labelledby="data-h">
        <div className="sec-head"><h2 id="data-h">Your data</h2></div>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-outline" onClick={onLoadDemo}>
            Load demo data
          </button>
          <button className="btn btn-outline" onClick={onReset}>
            Reset my data
          </button>
        </div>
      </section>
      )}

      <div ref={liveRef} className="sr-only" aria-live="polite"></div>
    </>
  );
}
