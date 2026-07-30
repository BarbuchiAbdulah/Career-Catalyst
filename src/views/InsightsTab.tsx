import { useMemo } from "react";
import type { StaffStudent, Stage, ScoreCategory } from "../lib/types";
import { CATS, ORDER, PATHS, STAGE_LABEL, band, bandColor, dominantPath, lastActivityFor, scoreFor } from "../lib/scoring";

const STAGES: Stage[] = ["first-year", "sophomore", "junior", "senior"];
const DAY = 86400000;
const BANDS = ["ok", "mid", "low"] as const;
const BAND_LABEL: Record<(typeof BANDS)[number], string> = { ok: "On track", mid: "Building", low: "Needs outreach" };

function daysSince(iso: string): number | null {
  if (!iso) return null;
  return Math.round((Date.now() - new Date(iso + "T00:00:00").getTime()) / DAY);
}

export function InsightsTab({ students }: { students: StaffStudent[] }) {
  const rows = useMemo(
    () =>
      students.map((s) => ({
        student: s,
        ...scoreFor(s.skills, s.entries, { length: s.contactsCount }, s.grad),
        dom: dominantPath(s.skills, s.entries),
        activityDays: daysSince(lastActivityFor(s.skills, s.entries)),
      })),
    [students]
  );
  const total = rows.length;

  const bandCounts = useMemo(() => {
    const c = { ok: 0, mid: 0, low: 0 };
    for (const r of rows) c[band(r.score).key]++;
    return c;
  }, [rows]);
  const needingCount = bandCounts.mid + bandCounts.low;
  const avgScore = total ? Math.round(rows.reduce((sum, r) => sum + r.score, 0) / total) : 0;
  const flaggedCount = rows.filter((r) => r.student.flagged).length;

  // Cohort-wide average completion per category, weakest first — points at
  // which kind of programming (workshop/event/panel) would help the most students at once.
  const catAverages = useMemo(() => {
    const sums: Record<ScoreCategory, number> = { skill: 0, experience: 0, contact: 0 };
    for (const r of rows) for (const k of ORDER) sums[k] += r.per[k].pct;
    return ORDER.map((k) => ({ k, pct: total ? Math.round(sums[k] / total) : 0 })).sort((a, b) => a.pct - b.pct);
  }, [rows, total]);
  const weakest = catAverages[0];

  const stageStats = useMemo(
    () =>
      STAGES.map((st) => {
        const inStage = rows.filter((r) => r.stage === st);
        const n = inStage.length;
        const avg = n ? Math.round(inStage.reduce((s, r) => s + r.score, 0) / n) : 0;
        const need = inStage.filter((r) => band(r.score).key !== "ok").length;
        return { stage: st, n, avg, need };
      }),
    [rows]
  );

  // Which of L&C's 9 paths the cohort is (and isn't) leaning toward, by dominant path.
  const pathCounts = useMemo(() => {
    const counts = new Map<string, number>();
    let none = 0;
    for (const r of rows) {
      if (r.dom && r.dom.key) counts.set(r.dom.key, (counts.get(r.dom.key) ?? 0) + 1);
      else none++;
    }
    const list = PATHS.map((p) => ({ key: p.key, label: p.label, n: counts.get(p.key) ?? 0 })).sort((a, b) => b.n - a.n);
    return { list, none };
  }, [rows]);
  const maxPathCount = Math.max(1, ...pathCounts.list.map((p) => p.n));
  const leastPopularPath = pathCounts.list[pathCounts.list.length - 1];

  const activity = useMemo(() => {
    let none = 0, fresh = 0, aging = 0, stale = 0;
    for (const r of rows) {
      const d = r.activityDays;
      if (d === null) none++;
      else if (d <= 30) fresh++;
      else if (d <= 90) aging++;
      else stale++;
    }
    return { none, fresh, aging, stale };
  }, [rows]);

  if (total === 0) {
    return (
      <>
        <p className="eyebrow">Career Center · insights</p>
        <h1 className="page">Cohort insights</h1>
        <div className="empty">No students yet.</div>
      </>
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-id" style={{ marginLeft: "auto" }}>
          <span className="topbar-avatar" aria-hidden="true">CC</span>
          <span className="topbar-name">Career Center</span>
        </div>
      </div>

      <p className="eyebrow">Career Center · insights</p>
      <h1 className="page">Cohort insights</h1>
      <p className="lede">
        Aggregate patterns across all {total} students — where the cohort is strong, where it's
        thin, and where outreach effort moves the needle most.
      </p>

      <div className="statcards">
        <div className="statcard">
          <span className="statcard-ic skill" aria-hidden="true">{total}</span>
          <div className="statcard-body">
            <span className="statcard-count">Roster</span>
            <span className="statcard-label">Total students</span>
          </div>
        </div>
        <div className="statcard">
          <span className="statcard-ic experience" aria-hidden="true">{avgScore}</span>
          <div className="statcard-body">
            <span className="statcard-count">Cohort average</span>
            <span className="statcard-label">Readiness score</span>
          </div>
        </div>
        <div className="statcard">
          <span className="statcard-ic contact" aria-hidden="true">{needingCount}</span>
          <div className="statcard-body">
            <span className="statcard-count">{Math.round((needingCount / total) * 100)}% of roster</span>
            <span className="statcard-label">Below "on track"</span>
          </div>
        </div>
      </div>

      <section className="sec" aria-labelledby="ins-band">
        <div className="sec-head">
          <h2 id="ins-band">Readiness distribution</h2>
          <span className="count">{flaggedCount} flagged for outreach</span>
        </div>
        <div
          className="bandbar"
          role="img"
          aria-label={`${bandCounts.ok} on track, ${bandCounts.mid} building, ${bandCounts.low} needing outreach, out of ${total} students`}
        >
          {BANDS.map((k) => (
            <i key={k} style={{ width: `${(bandCounts[k] / total) * 100}%`, background: bandColor(k) }} />
          ))}
        </div>
        <div className="bandlegend">
          {BANDS.map((k) => (
            <span key={k} className="status">
              <span className="dot" style={{ background: bandColor(k) }} />
              {BAND_LABEL[k]} · {bandCounts[k]}
            </span>
          ))}
        </div>
      </section>

      <section className="sec" aria-labelledby="ins-cat">
        <div className="sec-head">
          <h2 id="ins-cat">Category strength, cohort-wide</h2>
          <span className="count">Avg % of stage target met</span>
        </div>
        <div className="cats">
          {catAverages.map(({ k, pct }) => (
            <div className="cat" key={k}>
              <h3>
                {CATS[k].label}
                <span className="n">{pct}%</span>
              </h3>
              <div className="track">
                <i style={{ width: pct + "%" }} />
              </div>
            </div>
          ))}
        </div>
        <p className="pathnote">
          <strong>{CATS[weakest.k].label}</strong> is the cohort's weakest area (avg {weakest.pct}% of
          target) — a workshop or event here reaches the most students at once.
        </p>
      </section>

      <section className="sec" aria-labelledby="ins-stage">
        <div className="sec-head">
          <h2 id="ins-stage">By class stage</h2>
        </div>
        <table className="roster">
          <caption>Average readiness and outreach need by class stage.</caption>
          <thead>
            <tr>
              <th scope="col">Stage</th>
              <th scope="col">Students</th>
              <th scope="col">Avg score</th>
              <th scope="col">Below on track</th>
            </tr>
          </thead>
          <tbody>
            {stageStats.map((s) => (
              <tr key={s.stage}>
                <td>{STAGE_LABEL[s.stage]}</td>
                <td>{s.n}</td>
                <td>
                  {s.n ? <span style={{ color: bandColor(band(s.avg).key), fontWeight: 700 }}>{s.avg}</span> : "—"}
                </td>
                <td>{s.n ? `${s.need} (${Math.round((s.need / s.n) * 100)}%)` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="sec" aria-labelledby="ins-path">
        <div className="sec-head">
          <h2 id="ins-path">Career path direction</h2>
          <span className="count">{pathCounts.none} not yet leaning any direction</span>
        </div>
        <ul className="pathlist">
          {pathCounts.list.map((p) => (
            <li key={p.key} className="pathlist-row">
              <span className="pathlist-label">{p.label}</span>
              <span className="track" style={{ flex: 1, margin: "0 10px" }}>
                <i style={{ width: `${(p.n / maxPathCount) * 100}%` }} />
              </span>
              <span className="pathlist-n">{p.n}</span>
            </li>
          ))}
        </ul>
        {leastPopularPath && (
          <p className="pathnote">
            Only {leastPopularPath.n} {leastPopularPath.n === 1 ? "student leans" : "students lean"} toward{" "}
            <strong>{leastPopularPath.label}</strong> — worth promoting if that path has upcoming events.
          </p>
        )}
      </section>

      <section className="sec" aria-labelledby="ins-activity">
        <div className="sec-head">
          <h2 id="ins-activity">Engagement</h2>
          <span className="count">{activity.none + activity.stale} of {total} inactive 90+ days</span>
        </div>
        <div className="statcards quad">
          <div className="statcard">
            <div className="statcard-body">
              <span className="statcard-count">Active, ≤30 days</span>
              <span className="statcard-label">{activity.fresh}</span>
            </div>
          </div>
          <div className="statcard">
            <div className="statcard-body">
              <span className="statcard-count">Aging, 31–90 days</span>
              <span className="statcard-label">{activity.aging}</span>
            </div>
          </div>
          <div className="statcard">
            <div className="statcard-body">
              <span className="statcard-count">Stale, 90+ days</span>
              <span className="statcard-label">{activity.stale}</span>
            </div>
          </div>
          <div className="statcard">
            <div className="statcard-body">
              <span className="statcard-count">Never logged</span>
              <span className="statcard-label">{activity.none}</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
