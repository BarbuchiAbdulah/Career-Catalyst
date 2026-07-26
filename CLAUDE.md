# Career Catalyst — project context for Claude Code

A career-readiness tool for Lewis & Clark College, built for the Career Catalyst Challenge.
**Hard deadline: 2026-07-29.** Every decision below is driven by that constraint. When in
doubt, choose the option that ships a working, accessible, deployed app over the one that is
more architecturally complete.

## The problem this solves

L&C students can't see their own career readiness (skills, experience, professional network)
in one place, and Career Center staff have no way to spot which students need help before it's
too late.

## Two users, one core loop

- **Student** — owns their own profile. Logs entries → sees their readiness score and biggest gap.
- **Staff** (Career Center / peer advisor) — views a roster sorted by score, drills into a
  student, flags who needs outreach.

Core loop: student logs an entry (skill / experience / contact) → readiness score recomputes →
student sees dashboard + gaps → staff see roster sorted by score → staff flag who needs outreach.

## Architecture decisions (do not undo without reason)

- **Vite + React + TypeScript, fully static.** No backend. No server. Deploys as static files.
- **One unified data model.** Everything a student logs is an `Entry` with a `type` of
  `skill | experience | contact`. There are NOT three separate models. A `Student` owns an
  `Entry[]`. This was a deliberate scope cut — resist any urge to split it into three tables.
- **The readiness score is DERIVED, never stored.** `scoreFor(entries)` in `src/lib/scoring.ts`
  is the single source of truth. Student dashboard and staff roster both call it, so they can
  never disagree. If you change scoring, change it in that one function.
- **Persistence is localStorage** (`src/lib/storage.ts`), falling back to seed data. No auth,
  no accounts. Role is a UI toggle, not a login. This is intentional for the deadline.

## File map

```
src/
  lib/
    types.ts      # Entry, Student, Readiness, Band — all shared types
    scoring.ts    # CATS config, WEIGHT, scoreFor(), band() — THE scoring logic
    seed.ts       # demo students + uid() helper
    storage.ts    # localStorage load/save/reset
  components/
    Readiness.tsx # <Dial> (the score ring) and <CatBars> — shared by both views
  views/
    StudentView.tsx  # student dashboard + log form + entry list
    StaffView.tsx    # roster table + StaffDrill (individual student detail)
  App.tsx         # shell: role switch, persistence wiring
  main.tsx        # entry point
  styles.css      # all styles; design tokens are CSS vars in :root
```

## Design system (keep it consistent)

- **Brand: real Lewis & Clark.** Colors are L&C's: orange `#E5703A`, black `#231F20`,
  grays `#5F6062` / `#9FA1A4`. Orange is the accent, used sparingly. Naming rule from L&C:
  use "Lewis & Clark" or "L&C" and "Pioneers" — never "LC" or "Lewis and Clark".
- **Type:** Fraunces (display), Inter (body), JetBrains Mono (data/labels).
- **The signature element is the readiness dial.** Spend visual boldness there; keep the rest quiet.
- All design tokens live as CSS variables in `:root` in `styles.css`. Change colors there, once.

## Accessibility is a graded requirement — maintain it

Already in place; do not regress:
- Skip link, semantic `<table>` with `<caption>`, `scope="col"`, and live `aria-sort`.
- `aria-live="polite"` regions announce add/remove and flag changes.
- `aria-pressed` on toggle buttons; visible `:focus-visible` outlines; keyboard-openable rows.
- `prefers-reduced-motion` respected. Every color pairing meets contrast.
When you add a control, add its label/ARIA in the same change.

## Scope guardrails (what NOT to build unless there's time to spare)

Out of scope by design — the SchooLinks features we deliberately did not copy:
real auth/SSO, events/calendar, opportunity/job board, college search, messaging, analytics,
CI/CD, a backend or database. If asked to add one, confirm the deadline allows it first.

## Commands

- `npm install` — install deps
- `npm run dev` — local dev server
- `npm run build` — typecheck + production build to `dist/`
- `npm run typecheck` — types only
- Deploy: push to a repo, then Vercel (auto-detects Vite) or GitHub Pages serving `dist/`.

## Good first tasks to hand to Claude Code

- Add a "last activity" date to each entry and surface a stale-activity column in the roster.
- Add a search/filter box above the roster.
- Persist per-student, keyed by id, and add a simple student picker.
- Add unit tests for `scoreFor` and `band` (Vitest).
