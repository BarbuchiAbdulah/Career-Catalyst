# Career Catalyst

A career-readiness tool for **Lewis & Clark College**, built for the Career Catalyst Challenge.

L&C students can't see their career readiness — skills, experience, and professional network —
in one place, and Career Center staff have no way to spot which students need help before it's
too late. Career Catalyst puts all of it behind one **readiness score** that both the student
and the Career Center can see.

## The core loop

A student logs an entry (a skill, an experience, or a professional contact) → their readiness
score recomputes instantly → the student sees their dashboard and biggest gap → Career Center
staff see a roster sorted by score, lowest first → staff flag who needs outreach and drill into
any student for the detail.

## Why it's different from what L&C already has

The Career Center's current tools (uConnect + Handshake) are a *library* — resources, listings,
and advice a student reads and forgets. Career Catalyst is the student's own **space that
accumulates over four years**: log in as a first-year, and by senior year that same space holds
every skill, experience, and contact you've gathered, with a readiness score that grew alongside
you and a timeline that becomes your résumé.

## Two views

- **Student** — four tabs:
  - **Dashboard** — a four-year stage bar, readiness dial, category bars, a "biggest gap" nudge,
    quick tallies (applications tracked, events attended), and a timeline of everything logged.
  - **Profile** — editable major/interests/headline/resume link/LinkedIn, the log-entry form for
    skills and experience, and a Connections list filterable by relationship (mentor/faculty/
    alumni/recruiter/friend) and industry.
  - **Applications** — seeded on-campus and external opportunities to explore and save, plus a
    personal tracker with deadlines and status.
  - **Resources & Events** — resume templates, Career-Center articles, an explore-by-path view,
    an events list with mark-attended, an alumni directory to connect with, and advising notes.
- **Career Center** — a sortable roster with the students who need help on top and a **stage
  column** so a low score is read fairly for a first-year vs. a senior, an outreach flag per
  student, and a per-student drill-in with gaps framed as talking points plus their full timeline.

Role is switched from **Settings**, not a header toggle — the student sidebar never shows the
Career Center roster, and vice versa.

## Stage-aware scoring

The readiness score isn't flat. Category targets grow across the four years, so the same entries
read as "ahead" for a first-year and "behind" for a senior. A first-year at 40 is doing great; a
senior at 40 needs outreach — and the roster shows stage so staff see the difference at a glance.

## Career paths

Skills and experiences can be tagged with one of Lewis & Clark's real nine career paths (Data
Science/Tech/CS, Environment & Natural Sciences, Public Service/Law/Policy, and so on). The app
surfaces a student's dominant path, showing whether their work is cohering toward a direction.

Switch between them with the toggle in the header. (In a real deployment this would be a login;
for the demo it's a toggle so judges can see both sides.)

## Tech

Vite + React + TypeScript, fully static — no backend. Data persists in `localStorage` and falls
back to seed data. The readiness score is always derived from entries via a single
`scoreFor()` function, so the student and staff views can never disagree.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build to dist/
```

## Deploy

It's a static build. Either:

- **Vercel** — import the repo; it auto-detects Vite. Zero config.
- **GitHub Pages** — run `npm run build` and serve the `dist/` folder.

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

