import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const EMAIL_DOMAIN = "@lclark.edu";

export function LoginView() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [grad, setGrad] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function switchMode(next: "signin" | "signup") {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    setNotice("");

    if (!email.toLowerCase().endsWith(EMAIL_DOMAIN)) {
      setError(`Please use your school email (ends in ${EMAIL_DOMAIN}).`);
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Enter your name.");
      return;
    }

    setBusy(true);
    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name.trim(), grad: grad.trim() } },
      });
      setBusy(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      setMode("signin");
      setNotice("Check your school email for a confirmation link, then sign in below.");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) setError(signInError.message);
  }

  return (
    <div className="authwrap">
      <div className="authcard">
        <div className="side-brand" style={{ marginBottom: 20 }}>
          <span className="mark" aria-hidden="true">C</span>
          <span className="side-brandname">Career Catalyst</span>
        </div>
        <p className="eyebrow">{mode === "signin" ? "Sign in" : "Create your account"}</p>
        <h1 className="page" style={{ fontSize: 26, marginBottom: 8 }}>
          {mode === "signin" ? "Welcome back" : "Get started"}
        </h1>
        <p className="lede" style={{ marginBottom: 20 }}>
          Use your Lewis &amp; Clark email ({EMAIL_DOMAIN}) to {mode === "signin" ? "sign in" : "sign up"}.
        </p>

        {error && <p className="autherror" role="alert">{error}</p>}
        {notice && <p className="lede" style={{ marginBottom: 16 }}>{notice}</p>}

        <form onSubmit={submit}>
          {mode === "signup" && (
            <>
              <div className="field">
                <label htmlFor="auth-name">Name</label>
                <input id="auth-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
              </div>
              <div className="field">
                <label htmlFor="auth-grad">Graduation year <span style={{ fontWeight: 400 }}>(optional)</span></label>
                <input id="auth-grad" value={grad} onChange={(e) => setGrad(e.target.value)} placeholder="e.g. 2027" inputMode="numeric" />
              </div>
            </>
          )}
          <div className="field">
            <label htmlFor="auth-email">School email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`you${EMAIL_DOMAIN}`}
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </div>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <button
          type="button"
          className="authswitch"
          onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
