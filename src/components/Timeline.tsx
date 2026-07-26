import type { Entry } from "../lib/types";
import { CATS, pathLabel } from "../lib/scoring";

// Groups entries by academic term and renders them as a vertical timeline —
// the visible "here's everything you've built" spine of the four-year journey.

function termOf(iso: string): { key: string; label: string; sort: number } {
  const d = new Date(iso + "T00:00:00");
  const y = d.getFullYear();
  const m = d.getMonth(); // 0-11
  // Fall term = Aug–Dec; Spring/Summer = Jan–Jul.
  if (m >= 7) return { key: `${y}-F`, label: `Fall ${y}`, sort: y * 2 + 1 };
  return { key: `${y}-S`, label: `Spring ${y}`, sort: y * 2 };
}

function fmt(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function Timeline({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return <div className="empty">Your timeline fills in as you log entries.</div>;
  }

  // newest term first
  const terms = new Map<string, { label: string; sort: number; items: Entry[] }>();
  for (const e of entries) {
    const t = termOf(e.date);
    if (!terms.has(t.key)) terms.set(t.key, { label: t.label, sort: t.sort, items: [] });
    terms.get(t.key)!.items.push(e);
  }
  const ordered = [...terms.values()].sort((a, b) => b.sort - a.sort);
  for (const t of ordered)
    t.items.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ol className="timeline">
      {ordered.map((t) => (
        <li key={t.label} className="tl-term">
          <div className="tl-termhead">
            <span className="tl-dot" aria-hidden="true" />
            <h3>{t.label}</h3>
            <span className="tl-count">{t.items.length}</span>
          </div>
          <ul className="tl-items">
            {t.items.map((e) => (
              <li key={e.id}>
                <span className={"tag " + e.type}>{CATS[e.type].label}</span>
                <span className="tl-main">
                  <span className="t">{e.title}</span>
                  {e.meta && <span className="m">{e.meta}</span>}
                  {e.path && <span className="pathchip">{pathLabel(e.path)}</span>}
                </span>
                <time className="tl-date" dateTime={e.date}>
                  {fmt(e.date)}
                </time>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

