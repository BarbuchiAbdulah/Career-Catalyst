# Career Catalyst

A career-readiness tool for **Lewis & Clark College**, built for the Career Catalyst Challenge.

L&C students can't see their own career readiness — skills, experience, and professional network
— in one place, and Career Center staff have no way to spot which students need help before it's
too late. Career Catalyst puts all of it behind one **readiness score** that both the student and
the Career Center can see.

The Career Center's current tools (uConnect + Handshake) are a *library* — resources, listings,
and advice a student reads and forgets. Career Catalyst is the student's own **space that
accumulates over four years**: log in as a first-year, and by senior year that same space holds
every skill, experience, and contact you've gathered, with a readiness score that grew alongside
you and a timeline that becomes your résumé.

## The core loop

A student logs an entry (a skill, an experience, or a professional contact) → their readiness
score recomputes instantly → the student sees their dashboard and biggest gap → Career Center
staff see a roster sorted by score, lowest first → staff flag who needs outreach and drill into
any student for the detail.

## Two views

- **Student** — four tabs:
  - **Dashboard** — a four-year stage bar, readiness dial, category bars, a "biggest gap" nudge,
    quick tallies (applications tracked, events attended), and a timeline of everything logged.
  - **Profile** — editable major/interests/headline/resume link/LinkedIn, the log-entry form for
    skills and experience, and a Connections list filterable by relationship (mentor/faculty/
    alumni/recruiter/friend/other) and industry.
  - **Applications** — seeded on-campus and external opportunities to explore and save, plus a
    personal tracker with deadlines and status.
  - **Resources & Events** — Career Center services, resume templates, Career-Center articles, an
    explore-by-path view, an events list with mark-attended, and an alumni directory to connect with.
- **Career Center** — a sortable roster with the students who need help on top and a **stage
  column** so a low score is read fairly for a first-year vs. a senior, an outreach flag per
  student, and a per-student drill-in with gaps framed as talking points plus their full timeline.

Role comes from the signed-in account (`students.role` in the database), not a UI toggle — a
student can never click into the Career Center roster, and vice versa.

## Stage-aware scoring

The readiness score isn't flat. Category targets grow across the four years, so the same entries
read as "ahead" for a first-year and "behind" for a senior. A first-year at 40 is doing great; a
senior at 40 needs outreach — and the roster shows stage so staff see the difference at a glance.

## Career paths

Skills and experiences can be tagged with one of Lewis & Clark's real nine career paths (Data
Science/Tech/CS, Environment & Natural Sciences, Public Service/Law/Policy, and so on). The app
surfaces a student's dominant path, showing whether their work is cohering toward a direction.

## Accounts & data

Sign-in is real: email/password via Supabase Auth, gated to `@lclark.edu` addresses (checked
client-side for UX and enforced again server-side, so it can't be bypassed). Each account gets
one row in a `students` table behind Postgres row-level security — a student can only read/write
their own row; staff can read the whole roster but only flag students for outreach, not edit
their data. See [`supabase/schema.sql`](./supabase/schema.sql) for the full schema and policies.
The readiness score itself is never stored — it's always derived from a student's skills/entries
via a single `scoreFor()` function, so the student and staff views can never disagree.

## Tech

Vite + React + TypeScript on the frontend, Supabase (Postgres + Auth) as the backend. Fully
static build — no server to run yourself; Supabase is the only external dependency.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev                  # http://localhost:5173
npm run build                # production build to dist/
```

You'll also need a Supabase project with [`supabase/schema.sql`](./supabase/schema.sql) run once
in the SQL Editor (Project → SQL Editor → New query → paste → Run) before sign-up will work.

## Deploy

The frontend is a static build; Supabase is hosted separately.

- **Vercel** — import the repo; it auto-detects Vite. Add `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` as environment variables in the project settings.
- **GitHub Pages** — run `npm run build`, serve the `dist/` folder, and set the same two
  `VITE_*` env vars at build time.

## Accessibility

Built to a WCAG floor from the start: skip link, semantic table with sortable headers exposed
via `aria-sort`, live-region announcements for actions, `aria-pressed` toggles, visible focus
rings, keyboard navigation, and reduced-motion support.

## Design

Uses Lewis & Clark's real brand — orange `#E5703A` and black, the Pioneers identity, and the
Career Center in Fowler Student Center. Skill categories are grounded in the NACE
career-readiness competencies that college career centers actually use.

See [`CLAUDE.md`](./CLAUDE.md) for architecture decisions, scope guardrails, and the file map.

> Demo data only. No real student information.

