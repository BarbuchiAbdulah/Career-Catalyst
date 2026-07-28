import { useRef, useState } from "react";
import type { Student } from "../lib/types";
import { supabase } from "../lib/supabaseClient";

// Role now comes from the authenticated account (students.role in Supabase),
// not a UI toggle — a student account can never click into the staff roster.
export function SettingsView({
  email,
  onSignOut,
  onReset,
  student,
  onChange,
}: {
  email: string;
  onSignOut: () => void;
  onReset: () => void;
  student: Student;
  onChange: (next: Student) => void;
}) {
  const [avatarBusy, setAvatarBusy] = useState(false);
  const liveRef = useRef<HTMLDivElement>(null);

  async function handleAvatarChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    setAvatarBusy(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${student.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      if (liveRef.current) liveRef.current.textContent = "Couldn't upload photo. Try again.";
      setAvatarBusy(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    onChange({ ...student, avatarUrl: `${data.publicUrl}?t=${Date.now()}` });
    if (liveRef.current) liveRef.current.textContent = "Profile picture updated.";
    setAvatarBusy(false);
  }

  return (
    <>
      <p className="eyebrow">Settings</p>
      <h1 className="page">Settings</h1>
      <p className="lede">Signed in as {email}.</p>

      <section className="sec" aria-labelledby="photo-h">
        <div className="sec-head"><h2 id="photo-h">Profile picture</h2></div>
        <div className="row" style={{ gap: 16, alignItems: "center" }}>
          <div className="profileavatar" aria-hidden="true">
            {student.avatarUrl ? <img src={student.avatarUrl} alt="" /> : student.name.charAt(0) || "?"}
          </div>
          <div>
            <label htmlFor="settings-avatar-input" className="badge-sm-btn" style={{ cursor: "pointer" }}>
              {avatarBusy ? "Uploading…" : "Change photo"}
            </label>
            <input id="settings-avatar-input" type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" disabled={avatarBusy} />
          </div>
        </div>
      </section>

      <section className="sec" aria-labelledby="account-h">
        <div className="sec-head"><h2 id="account-h">Account</h2></div>
        <button className="btn btn-outline" onClick={onSignOut}>
          Sign out
        </button>
      </section>

      <section className="sec" aria-labelledby="data-h">
        <div className="sec-head"><h2 id="data-h">Your data</h2></div>
        <button className="btn btn-outline" onClick={onReset}>
          Reset my data
        </button>
      </section>

      <div ref={liveRef} className="sr-only" aria-live="polite"></div>
    </>
  );
}
