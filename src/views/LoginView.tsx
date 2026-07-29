import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const EMAIL_DOMAIN = "@lclark.edu";

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M2 2l20 20" />}
    </svg>
  );
}

// Hand-drawn (not generated) — a simple flat river otter: brown body/head,
// cream belly/face patch, closed happy eyes, whiskers, and a small stone held
// between its paws (otters are known for that) so it reads as an otter and
// not a generic bear/rodent shape.
function OtterIllustration() {
  return (
    <svg viewBox="0 0 300 300" role="img" aria-label="A river otter holding a small stone">
      <ellipse cx="205" cy="228" rx="62" ry="26" transform="rotate(-22 205 228)" fill="#6B4226" />
      <ellipse cx="140" cy="205" rx="95" ry="80" fill="#8B5E3C" />
      <ellipse cx="140" cy="228" rx="54" ry="46" fill="#F3D9C6" />
      <circle cx="140" cy="112" r="66" fill="#8B5E3C" />
      <circle cx="97" cy="66" r="16" fill="#6B4226" />
      <circle cx="183" cy="66" r="16" fill="#6B4226" />
      <ellipse cx="140" cy="126" rx="46" ry="38" fill="#F3D9C6" />
      <ellipse cx="106" cy="132" rx="11" ry="7" fill="#E5703A" opacity=".35" />
      <ellipse cx="174" cy="132" rx="11" ry="7" fill="#E5703A" opacity=".35" />
      <path d="M112 108q8-10 16 0" stroke="#231F20" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M152 108q8-10 16 0" stroke="#231F20" strokeWidth="4" strokeLinecap="round" fill="none" />
      <ellipse cx="140" cy="128" rx="7" ry="5" fill="#231F20" />
      <g stroke="#231F20" strokeWidth="1.5" strokeLinecap="round" opacity=".55">
        <path d="M112 132h-24M110 138h-22M112 144h-20" />
        <path d="M168 132h24M170 138h22M168 144h20" />
      </g>
      <ellipse cx="112" cy="252" rx="20" ry="14" fill="#8B5E3C" />
      <ellipse cx="168" cy="252" rx="20" ry="14" fill="#8B5E3C" />
      <circle cx="140" cy="246" r="10" fill="#9FA1A4" />
      <circle cx="137" cy="243" r="2" fill="#5F6062" />
      <circle cx="143" cy="248" r="1.6" fill="#5F6062" />
    </svg>
  );
}

export function LoginView() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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
    <div className="loginwrap">
      <div className="logincard">
        <div className="login-blob" aria-hidden="true" style={{ width: 320, height: 320, left: -80, bottom: -100, background: "#C4551F", opacity: 0.45 }} />
        <div className="login-blob" aria-hidden="true" style={{ width: 220, height: 220, right: 20, top: -60, background: "#FFE8D1", opacity: 0.6 }} />
        <div className="login-blob" aria-hidden="true" style={{ width: 180, height: 180, right: -40, bottom: 40, background: "#FBC9A0", opacity: 0.6 }} />
        <div className="login-leaf" aria-hidden="true" style={{ width: 14, height: 14, top: "18%", right: "38%", transform: "rotate(30deg)" }} />
        <div className="login-leaf" aria-hidden="true" style={{ width: 10, height: 10, top: "70%", right: "20%", transform: "rotate(-15deg)", opacity: 0.35 }} />
        <div className="login-leaf" aria-hidden="true" style={{ width: 18, height: 18, top: "40%", right: "12%", transform: "rotate(60deg)", opacity: 0.3 }} />

        <div className="loginform">
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
              <label htmlFor="auth-email">Email</label>
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
            <div className="field pw-field">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={6}
                required
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                <EyeIcon off={showPw} />
              </button>
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

        <div className="login-art">
          <OtterIllustration />
        </div>
      </div>
    </div>
  );
}
