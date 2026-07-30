import { useEffect, useRef, useState } from "react";
import type { Role } from "../lib/types";
import { STUDENT_ONBOARDING_SLIDES, STAFF_ONBOARDING_SLIDES } from "../lib/content";

// One-time first-login tutorial. Shown when Student.onboarded is false (see
// App.tsx), dismissed for good via storage.ts's setOnboarded — never shown
// again after that, even in a new tab, since the flag lives in the DB, not
// component state. Native <dialog>.showModal() gives a focus trap and
// Escape-to-close for free, so there's no extra a11y wiring needed here.
export function WelcomeModal({ role, onDismiss }: { role: Role; onDismiss: () => void }) {
  const slides = role === "staff" ? STAFF_ONBOARDING_SLIDES : STUDENT_ONBOARDING_SLIDES;
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  function close() {
    ref.current?.close();
    onDismiss();
  }

  const last = i === slides.length - 1;

  return (
    <dialog
      ref={ref}
      className="welcome-modal"
      aria-labelledby="welcome-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <button type="button" className="welcome-skip" onClick={close} aria-label="Skip introduction">
        Skip
      </button>
      <p className="eyebrow">{role === "staff" ? "Career Center" : "Welcome"}</p>
      <h2 id="welcome-title">{slides[i].title}</h2>
      <p className="lede">{slides[i].body}</p>
      <div className="welcome-dots" role="img" aria-label={`Slide ${i + 1} of ${slides.length}`}>
        {slides.map((_, k) => (
          <span key={k} className={"welcome-dot" + (k === i ? " active" : "")} />
        ))}
      </div>
      <div className="welcome-nav">
        {i > 0 && (
          <button type="button" className="btn btn-outline" onClick={() => setI((v) => v - 1)}>
            Back
          </button>
        )}
        <button type="button" className="btn" onClick={() => (last ? close() : setI((v) => v + 1))}>
          {last ? "Get started" : "Next"}
        </button>
      </div>
    </dialog>
  );
}
