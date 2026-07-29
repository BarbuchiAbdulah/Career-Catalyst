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

- **Student** — owns their own profile, across **5 tabs**: Dashboard (read-only overview),
  Experiences (sub-tabs: Experiences / Projects / Skills — card-grid layout), Network (sub-tabs:
  Your connections / Explore alumni — card-grid layout), Applications (track opportunities),
  Resources & Events (Career Center content). There is no standalone Profile tab — identity
  fields (name/grad/headline/interests/resume/LinkedIn/majors/minors) are edited in Settings
  instead, shown only for student accounts (`SettingsView.tsx` gates that section on
  `student.role === "student"` — staff share the same Settings view and don't need it).
- **Staff** (Career Center / peer advisor) — across **2 tabs**: Student roster (sorted by score,
  drills into a student, flags who needs outreach, leaves advising notes) and Insights
  (cohort-wide aggregates: readiness distribution, category strength, by-stage breakdown, career
  path distribution, engagement).

Core loop: student logs an entry (skill / experience / contact) → readiness score recomputes →
student sees dashboard + gaps → staff see roster sorted by score (and cohort patterns in
Insights) → staff flag who needs outreach and leave an advising note.

**Role has no in-app toggle at all** (see the comment atop `views/SettingsView.tsx`) — it comes
straight from `students.role` in the DB, full stop. A student's sidebar never shows the Career
Center roster, and staff's sidebar never shows the student tabs, and there is no button anywhere
that changes an account's own role (a student could otherwise just grant themselves staff access).
The only way to create a staff account today is to sign up normally, then run
`update public.students set role = 'staff' where id = '<their auth uid>';` by hand in the
Supabase SQL Editor. See `App.tsx`: `role`/`studentPage`/`staffPage`/`showSettings` state.

## Architecture decisions (do not undo without reason)

- **Vite + React + TypeScript, with a real Supabase backend.** Auth (`@lclark.edu`-only signup,
  enforced server-side by a trigger — see `supabase/schema.sql`) + Postgres, one row per student
  in `public.students`, RLS-gated. `src/lib/storage.ts` reads/writes it; there is no localStorage
  and no shared seed data anymore — every account's data is its own. `role` (`student`/`staff`)
  comes from the DB, not a UI toggle — a student account can never see the staff roster client-side
  *or* server-side (RLS enforces it too).
- **Three data shapes, not one, and that's deliberate.** `Entry` (experience only), `Skill`
  (`title` + a growing `evidence[]`), and `Contact` (`name` + relationship + email/phone/LinkedIn
  + note) are each their own entity because they behave differently: an experience is a one-off
  event with a date range; a skill accumulates evidence over time; a contact needs fields an
  experience doesn't and should be editable after the fact. `ScoreCategory` (`skill | experience |
  contact`) is the 3-way readiness split — it's not the same set as any one entity's own fields.
  See `types.ts`.
- **The readiness score is DERIVED, never stored.** `scoreFor(skills, entries, contacts, grad)`
  in `src/lib/scoring.ts` is the single source of truth — each category counts its own array's
  length. Student dashboard, profile, and staff roster all call it, so they can never disagree.
  If you change scoring, change it in that one function.
- **Skill proficiency is DERIVED too.** `levelFor(evidenceCount)` in `scoring.ts` — never store
  a level directly, or it can drift out of sync with the evidence list.
- **An experience has `startDate`/`endDate?`/`ongoing`**, not a single `date` — an ongoing role
  displays "Present" and anchors to its start term on the timeline rather than being duplicated
  across every term it spans. It also carries `organization`/`location`/`hoursLogged`/`link` (all
  optional — undefined for entries logged before these fields existed; `link` is most useful for
  `category: "project"`, e.g. a GitHub/portfolio URL) and an `ExperienceCategory` (`category`:
  internship/research/study-abroad/leadership/volunteer/campus-involvement/project/other).
  `category` is a SEPARATE dimension from `path` (`CareerPath`): category describes the FORM of
  the experience, path describes its career DIRECTION — don't collapse the two. `ExperiencesTab.tsx`
  is its own top-level tab with three sub-tabs: Experiences (everything except `category:
  "project"`), Projects (`category: "project"` only), and Skills (moved here since Profile no
  longer exists).
- **Contacts are deliberately NOT on the four-year timeline.** A connection isn't a "growth
  moment" the way a skill or experience is; Dashboard shows a separate small "Recent connections"
  card instead (see `DashboardTab.tsx`), and `NetworkTab.tsx` is its own top-level tab with two
  sub-tabs: Your connections (the searchable/filterable card grid) and Explore alumni (the curated
  `ALUMNI_DIRECTORY` — moved here from Resources & Events). A `Contact` also carries
  `company`/`role`/`grad` (their info, not the student's own) and a manually-rated `strength`
  (1–3, not derived — no interaction log exists to derive it from).
- **Timeline only needs skills + entries flattened.** `toTimelineItems(skills, entries)` in
  `scoring.ts` turns skill evidence + entries into the common `TimelineItem` shape `<Timeline>`
  renders. If you add a new loggable thing, decide deliberately whether it belongs on the
  timeline (flatten it here) — contacts don't, on purpose (see above).
- **Profile pictures use Supabase Storage**, not a database column holding binary data — one
  public `avatars` bucket, RLS-gated so a student can only write to the folder named after their
  own auth uid (`{user id}/avatar.<ext>`, `upsert: true` so re-uploading just replaces it).
  `Student.avatarUrl` is just the resulting public URL, empty string until they upload one.
- **Whenever `Student`'s shape changes, update `supabase/schema.sql` too** — new columns need an
  `alter table ... add column if not exists` (the file's `create table if not exists` only runs
  on a database that doesn't have the table yet, so it silently no-ops on every already-deployed
  project otherwise). The file is meant to be safe to re-run in the Supabase SQL Editor after
  every such change.

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
    seed.ts       # uid() + real L&C MAJORS/MINORS lists — no demo-student generator anymore
    storage.ts    # Supabase reads/writes: fetchMe/fetchRoster/upsertMe/setFlag/addAdvisingNote/
                  # resetMe/loadDemoData — no localStorage, every account's data is its own
    demoData.ts   # one realistic fully-populated demo profile, loaded via Settings on demand
    generate.ts   # resume bullets / LinkedIn blurb text, generated live from logged data
    content.ts    # static Career-Center content: JOBS, EVENTS, RESUME_TEMPLATES, ARTICLES,
                  # PATH_INFO, ALUMNI_DIRECTORY, CAREER_SERVICES — no live data source
  components/
    Readiness.tsx # <Dial>, <CatBars>, <StageBar> — shared by both views
    Timeline.tsx  # <Timeline> — entries grouped by term into the four-year spine
  views/
    DashboardTab.tsx     # read-only overview: greeting, stat cards, tallies, timeline
    ExperiencesTab.tsx   # sub-tabs: Experiences / Projects / Skills — card grid, add+edit form
    NetworkTab.tsx       # sub-tabs: Your connections / Explore alumni — card grid, add+edit form
    ApplicationsTab.tsx  # explore seeded JOBS + personal application tracker
    ResourcesTab.tsx     # templates, articles, paths, events, advising notes (alumni moved to Network)
    StaffView.tsx        # roster table + StaffDrill (student detail + advising notes)
    InsightsTab.tsx      # staff-facing cohort aggregates: distribution, stage, paths, engagement
    SettingsView.tsx     # avatar + identity fields (student-only) + account/data actions (both roles)
    LoginView.tsx         # split card + hand-drawn otter illustration, @lclark.edu email/password only
  App.tsx         # shell: role-scoped nav, studentPage/staffPage/showSettings state, persistence
  main.tsx        # entry point
  styles.css      # all styles; design tokens are CSS vars in :root
```

## Design system (keep it consistent)

- **Layout: a persistent left sidebar + content area** (see `App.tsx`, `.app`/`.sidebar`/`.content`).
  Inspired by a "learning dashboard" reference the user liked (Coursue). The Dashboard tab opens
  with an **orange greeting banner** whose signature element is a **readiness ring wrapping the
  student's avatar** (`RingAvatar` in `DashboardTab.tsx`), then three **stat cards** (one per
  category), then the timeline. There is no in-app role switch anywhere (see above) — the sidebar
  just renders whichever nav set matches the signed-in account's DB role.
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

