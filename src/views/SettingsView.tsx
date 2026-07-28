import type { Role } from "../lib/types";

// Settings is where role is switched — deliberately NOT a header toggle visible from
// both views. A student never sees the Career Center roster in their nav, and staff
// never see the student tabs; the only door between the two is here.
export function SettingsView({
  role,
  onRoleChange,
  onReset,
}: {
  role: Role;
  onRoleChange: (r: Role) => void;
  onReset: () => void;
}) {
  return (
    <>
      <p className="eyebrow">Settings</p>
      <h1 className="page">Settings</h1>
      <p className="lede">
        In a real deployment, which view you see would be decided by login. For this demo, switch
        between the Student and Career Center views here.
      </p>

      <section className="sec" aria-labelledby="role-h">
        <div className="sec-head"><h2 id="role-h">View as</h2></div>
        <div className="roleswitch" role="group" aria-label="Switch view">
          <button aria-pressed={role === "student"} onClick={() => onRoleChange("student")}>
            Student
          </button>
          <button aria-pressed={role === "staff"} onClick={() => onRoleChange("staff")}>
            Career Center
          </button>
        </div>
      </section>

      <section className="sec" aria-labelledby="data-h">
        <div className="sec-head"><h2 id="data-h">Demo data</h2></div>
        <button className="btn btn-outline" onClick={onReset}>
          Reset demo data
        </button>
      </section>
    </>
  );
}
