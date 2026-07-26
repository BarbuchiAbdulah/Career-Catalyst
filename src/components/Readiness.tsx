import type { Readiness, Stage } from "../lib/types";
import { band, bandColor, CATS, ORDER, STAGE_LABEL, STAGE_FACTOR } from "../lib/scoring";

export function Dial({ score, size = 180 }: { score: number; size?: number }) {
  const b = band(score);
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);
  return (
    <div
      className="dial"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Readiness score ${score} out of 100 — ${b.label}`}
    >
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--paper-2)" strokeWidth="14" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={bandColor(b.key)}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(.2,.7,.2,1)" }}
        />
      </svg>
      <div className="val">
        <div>
          <div className="num" style={{ color: bandColor(b.key) }}>
            {score}
          </div>
          <div className="den">/ 100</div>
        </div>
      </div>
    </div>
  );
}

export function CatBars({ per }: { per: Readiness["per"] }) {
  return (
    <div className="cats">
      {ORDER.map((k) => {
        const p = per[k];
        const c = CATS[k];
        return (
          <div className="cat" key={k}>
            <h3>
              {c.label}
              <span className="n">
                {p.n}/{p.target}
              </span>
            </h3>
            <div className="track">
              <i style={{ width: p.pct + "%" }} />
            </div>
            <small>{p.n >= p.target ? "Target met for now" : `${p.target - p.n} more to hit this stage's target`}</small>
          </div>
        );
      })}
    </div>
  );
}

// The four-year arc, made visible: shows where the student is and how the bar
// grows over time, so a number is read fairly for their stage.
export function StageBar({ stage }: { stage: Stage }) {
  const stages: Stage[] = ["first-year", "sophomore", "junior", "senior"];
  const idx = stages.indexOf(stage);
  return (
    <div className="stagebar" role="img" aria-label={`Class stage: ${STAGE_LABEL[stage]}, year ${idx + 1} of 4`}>
      {stages.map((s, i) => (
        <div key={s} className={"stagestep" + (i <= idx ? " done" : "") + (i === idx ? " here" : "")}>
          <span className="stagestep-dot" aria-hidden="true" />
          <span className="stagestep-label">{STAGE_LABEL[s]}</span>
          <span className="stagestep-exp">{Math.round(STAGE_FACTOR[s] * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

