// Role now comes from the authenticated account (students.role in Supabase),
// not a UI toggle — a student account can never click into the staff roster.
export function SettingsView({
  email,
  onSignOut,
  onReset,
}: {
  email: string;
  onSignOut: () => void;
  onReset: () => void;
}) {
  return (
    <>
      <p className="eyebrow">Settings</p>
      <h1 className="page">Settings</h1>
      <p className="lede">Signed in as {email}.</p>

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
    </>
  );
}
