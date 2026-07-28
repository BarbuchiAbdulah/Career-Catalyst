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

- **Student** — owns their own profile, across **4 tabs**: Dashboard (read-only overview),
  Profile (edit identity + log skills/experience/connections), Applications (track
  opportunities), Resources & Events (Career Center content).
- **Staff** (Career Center / peer advisor) — views a roster sorted by score, drills into a
  student, flags who needs outreach.

Core loop: student logs an entry (skill / experience / contact) → readiness score recomputes →
student sees dashboard + gaps → staff see roster sorted by score → staff flag who needs outreach.

**Role is switched from Settings only** (`views/SettingsView.tsx`), not a header toggle visible
from both sides — a student's sidebar never shows the Career Center roster, and staff's sidebar
never shows the student tabs. See `App.tsx`: `role`/`studentPage`/`showSettings` state.

## Architecture decisions (do not undo without reason)

- **Vite + React + TypeScript, fully static.** No backend. No server. Deploys as static files.
- **Two data shapes, not one, and that's deliberate.** Experience and contacts are still a
  unified `Entry` with `type: "experience" | "contact"`. Skills are their own `Skill` entity
  (`title` + a growing `evidence[]` list) because they behave differently — a skill is logged
  once and built up over time, not a one-off event. `ScoreCategory` (`skill | experience |
  contact`) is the 3-way readiness split; don't confuse it with `EntryType` (2-way). See
  `types.ts`.
- **The readiness score is DERIVED, never stored.** `scoreFor(skills, entries, grad)` in
  `src/lib/scoring.ts` is the single source of truth — the `skill` category counts
  `skills.length`, not entries. Student dashboard, profile, and staff roster all call it, so
  they can never disagree. If you change scoring, change it in that one function.
- **Skill proficiency is DERIVED too.** `levelFor(evidenceCount)` in `scoring.ts` — never store
  a level directly, or it can drift out of sync with the evidence list.
- **Timeline needs both shapes flattened.** `toTimelineItems(skills, entries)` in `scoring.ts`
  turns skill evidence + entries into the common `TimelineItem` shape `<Timeline>` renders. If
  you add a new loggable thing, flatten it here too or it silently vanishes from the timeline.
- **Persistence is localStorage** (`src/lib/storage.ts`), falling back to seed data. No auth,
  no accounts. Role is a UI toggle, not a login. This is intentional for the deadline. The
  storage KEY is versioned (`...:v5`) — bump it whenever the Student/Entry/Skill shape changes
  so stale payloads don't crash the new model.

## The four-year journey (the product's core idea)

This app exists because L&C's current tools (uConnect + Handshake) are a *library* — a pile of
resources a student reads and forgets. Career Catalyst is the student's own *space* that
accumulates over four years. Everything below serves that idea:

- **Every entry has a `date`.** The `<Timeline>` component groups entries by academic term
  (Fall/Spring) into a vertical spine — the visible "here's everything you've built" history.
- **Scoring is STAGE-AWARE.** `stageFor(grad)` derives first-year → senior from the grad year vs.
  `ACADEMIC_YEAR` (a constant in scoring.ts — bump it each fall). Category targets scale by
  `STAGE_FACTOR`, so the same entries read as "ahead" for a first-year and "behind" for a senior.
  The staff roster shows a Stage column so a low score is interpreted fairly, not punitively.
- **L&C's real 9 career paths** (`PATHS` in scoring.ts, `CareerPath` in types.ts) are an OPTIONAL
  tag on skills/experiences. `dominantPath()` surfaces whether a student's work coheres toward a
  direction. Paths are a tag layered ON TOP of the three readiness categories — they describe
  *direction*; the categories describe *breadth*. Do not collapse one into the other.
- **`headline`** on Student is the student's own stated goal — makes the space feel like theirs.
- **Guidance is intentionally not a 4th scored pillar.** The real Career Accelerator logbook has
  4 sections (Skills/Experience/Connections/Guidance), but `scoreFor()` only weights 3
  (skill/experience/contact). Guidance-equivalent content (advisor action items, mentor notes)
  lives as `Student.advisingNotes`, surfaced in the Resources & Events tab — present, but
  deliberately not disturbing the working score model this close to the deadline.

## File map

```
src/
  lib/
    types.ts      # Entry, Student, Application, AdvisingNote, ContactRelationship, etc.
    scoring.ts    # CATS, WEIGHT, PATHS, RELATIONSHIPS, scoreFor(), band(), stageFor()
    seed.ts       # demo students (dates, path tags, applications, events, notes) + uid()
    storage.ts    # localStorage load/save/reset (versioned key)
    content.ts    # static Career-Center content: JOBS, EVENTS, RESUME_TEMPLATES, ARTICLES,
                  # PATH_INFO, ALUMNI_DIRECTORY, CAREER_SERVICES — no live data source
  components/
    Readiness.tsx # <Dial>, <CatBars>, <StageBar> — shared by both views
    Timeline.tsx  # <Timeline> — entries grouped by term into the four-year spine
  views/
    DashboardTab.tsx     # read-only overview: greeting, stat cards, tallies, timeline
    ProfileTab.tsx       # editable identity + log-entry form + Connections (filterable)
    ApplicationsTab.tsx  # explore seeded JOBS + personal application tracker
    ResourcesTab.tsx     # templates, articles, paths, events, alumni directory, advising notes
    StaffView.tsx        # roster table + StaffDrill (individual student detail) — unchanged
    SettingsView.tsx     # role switch + reset demo data — the only door between roles
  App.tsx         # shell: role-scoped nav, studentPage/showSettings state, persistence wiring
  main.tsx        # entry point
  styles.css      # all styles; design tokens are CSS vars in :root
```

## Design system (keep it consistent)

- **Layout: a persistent left sidebar + content area** (see `App.tsx`, `.app`/`.sidebar`/`.content`).
  Inspired by a "learning dashboard" reference the user liked (Coursue). The student view opens
  with a top bar (search + identity), then an **orange greeting banner** whose signature element
  is a **readiness ring wrapping the student's avatar** (`RingAvatar` in StudentView), then three
  **stat cards** (one per category), then the timeline. Role is switched from the sidebar.
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

The Applications and Resources/Events tabs DO now include a seeded opportunity list and an
events list (`content.ts`) — that's a deliberate, scoped exception to the original "no job
board / no events" cut, done as **static curated content**, not a live integration. Still fully
out of scope: real auth/SSO, a real job-board API or web-scraped listings, a real calendar
integration, real file upload/hosting (resume is a link field, not a binary), college search,
messaging, analytics, CI/CD, a backend or database. If asked to add one of these, confirm the
deadline allows it first.

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

