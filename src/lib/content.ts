import type { AppSource, CareerPath } from "./types";

// Static, Career-Center-curated content for the Applications and Resources/Events
// tabs. None of this is live data — there's no backend to fetch real job postings,
// a real events calendar, or a real alumni database from, so everything here is
// seeded content a real Career Center would author and keep current by hand.

export interface Job {
  id: string;
  title: string;
  org: string;
  domain?: string; // real org's domain, used for a Clearbit logo lookup (falls back to a monogram)
  source: AppSource;
  path: CareerPath;
  location: string;
  blurb: string;
}

export const JOBS: Job[] = [
  { id: "j1", title: "Peer Career Advisor", org: "L&C Career Center", domain: "lclark.edu", source: "on-campus", path: "social-services-nonprofit-education", location: "Fowler Student Center", blurb: "Coach fellow students through resumes and mock interviews, 8 hrs/week." },
  { id: "j2", title: "IT Help Desk Assistant", org: "L&C ITS", domain: "lclark.edu", source: "on-campus", path: "data-tech-cs", location: "Watzek Library", blurb: "Front-line tech support for students and faculty." },
  { id: "j3", title: "Research Assistant", org: "Biology Department", domain: "lclark.edu", source: "on-campus", path: "environment-sustainability-science", location: "Olin Hall", blurb: "Support a faculty field-ecology study; data entry and site visits." },
  { id: "j4", title: "Writing Center Tutor", org: "L&C Writing Center", domain: "lclark.edu", source: "on-campus", path: "arts-design-media", location: "Watzek Library", blurb: "One-on-one sessions helping students with drafts across disciplines." },
  { id: "j5", title: "Marketing Intern", org: "Portland Trail Blazers", domain: "trailblazers.com", source: "external", path: "comm-marketing-pr", location: "Portland, OR", blurb: "Support social media and game-day promotions for the summer season." },
  { id: "j6", title: "Data Analyst Intern", org: "Simple Finance Co.", source: "external", path: "data-tech-cs", location: "Portland, OR (hybrid)", blurb: "SQL/Python work on customer analytics for a fintech startup." },
  { id: "j7", title: "Policy Research Fellow", org: "Oregon State Legislature", domain: "oregonlegislature.gov", source: "external", path: "public-service-law-policy", location: "Salem, OR", blurb: "Support committee staff with bill research during session." },
  { id: "j8", title: "Sustainability Analyst Intern", org: "City of Portland", domain: "portland.gov", source: "external", path: "environment-sustainability-science", location: "Portland, OR", blurb: "Assist the Bureau of Planning with climate-action reporting." },
  { id: "j9", title: "Investment Banking Summer Analyst", org: "Moss Adams", domain: "mossadams.com", source: "external", path: "econ-leadership-innovation", location: "Portland, OR", blurb: "Rotational summer program across advisory and audit teams." },
  { id: "j10", title: "Global Health Program Intern", org: "Mercy Corps", domain: "mercycorps.org", source: "external", path: "global-diplomacy-languages", location: "Portland, OR", blurb: "Support program logistics for an international relief initiative." },
  { id: "j11", title: "Clinical Research Coordinator (Volunteer)", org: "OHSU", domain: "ohsu.edu", source: "external", path: "health-wellness", location: "Portland, OR", blurb: "Assist with patient scheduling and data collection for a research team." },
  { id: "j12", title: "Museum Education Intern", org: "Portland Art Museum", domain: "pam.org", source: "external", path: "arts-design-media", location: "Portland, OR", blurb: "Help develop tour scripts and youth-program materials." },
];

// "Simple Finance Co." above is an invented placeholder employer, so it
// deliberately has no `domain` — the UI falls back to a monogram rather than
// guessing at a logo for a company that doesn't exist.

export interface EventItem {
  id: string;
  title: string;
  date: string; // ISO date
  location: string;
  path: CareerPath; // "" = general/all-paths event
  blurb: string;
}

export const EVENTS: EventItem[] = [
  { id: "e1", title: "Fall Career Fair", date: "2026-09-24", location: "Pamplin Sports Center", path: "", blurb: "60+ employers across every L&C career path." },
  { id: "e2", title: "Resume Rescue Drop-In", date: "2026-09-10", location: "Career Center, Fowler", path: "", blurb: "Bring a draft, leave with a stronger one — no appointment needed." },
  { id: "e3", title: "Tech & Data Meetup", date: "2026-10-02", location: "Watzek Library", path: "data-tech-cs", blurb: "Alumni panel on breaking into data roles without a CS degree." },
  { id: "e4", title: "Public Service Info Session", date: "2026-10-08", location: "J.R. Howard Hall", path: "public-service-law-policy", blurb: "Oregon Legislature fellows describe their year in Salem." },
  { id: "e5", title: "LinkedIn Headshot & Profile Clinic", date: "2026-10-15", location: "Career Center, Fowler", path: "", blurb: "Free headshots and a 15-minute profile review." },
  { id: "e6", title: "Environment & Sustainability Career Night", date: "2026-10-22", location: "Olin Hall", path: "environment-sustainability-science", blurb: "Meet employers from parks, policy, and climate-tech." },
  { id: "e7", title: "Mock Interview Marathon", date: "2026-11-05", location: "Career Center, Fowler", path: "", blurb: "30-minute mock interviews with volunteer alumni across industries." },
  { id: "e8", title: "Arts & Media Portfolio Workshop", date: "2026-11-12", location: "Fields Center", path: "arts-design-media", blurb: "Build a digital portfolio employers actually look at." },
];

export interface ResumeTemplate {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  link: string; // real, free, no-login-required template gallery
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: "t1",
    title: "First internship / entry-level",
    summary: "For students with limited paid work experience — leads with coursework and campus involvement.",
    bullets: [
      "Header: name, phone, email, LinkedIn, portland-area location",
      "Education first: degree, major, expected grad date, relevant coursework",
      "Experience: campus jobs, class projects, volunteer work — framed with an action verb + outcome",
      "Skills: technical skills grouped separately from foundational/soft skills",
    ],
    link: "https://www.canva.com/resumes/templates/",
  },
  {
    id: "t2",
    title: "Internship / research-heavy",
    summary: "For students with at least one substantial internship, research role, or high-impact experience.",
    bullets: [
      "Experience moves above Education once you have 1+ real role",
      "Each bullet: what you did, the tool/method, the measurable result",
      "A dedicated Projects or Research section for anything with a tangible artifact",
      "Tailor the top third of the resume to the specific job description's language",
    ],
    link: "https://www.canva.com/resumes/templates/",
  },
  {
    id: "t3",
    title: "Career-changer / liberal-arts translation",
    summary: "For turning a non-obvious major into a clear pitch for a specific field.",
    bullets: [
      "A 2-line summary at the top naming the target role and your strongest transferable skill",
      "Group experience by relevant skill, not strictly by chronology",
      "Name the technical skill you're building now, even if it's in progress",
      "Close with a Connections/Recommenders section — who can vouch for you",
    ],
    link: "https://www.canva.com/cover-letters/templates/",
  },
];

export interface Article {
  id: string;
  title: string;
  tag: CareerPath | "";
  excerpt: string;
  url: string; // real college.lclark.edu article
}

// Real, current news from the L&C Career Center
// (college.lclark.edu/student_life/career_development/news_and_events/), not
// invented advice columns — refresh this list by hand periodically, same as
// the rest of this file.
export const ARTICLES: Article[] = [
  { id: "a1", title: "L&C Launches New Career Accelerator, 'Turbocharged' by $5M Commitment", tag: "", excerpt: "A $5M endowment behind the integrated career-readiness program this app is part of.", url: "https://college.lclark.edu/live/news/55576-lc-launches-new-career-accelerator-turbocharged-by-5m-" },
  { id: "a2", title: "Behind the Swoosh at Nike HQ", tag: "econ-leadership-innovation", excerpt: "Students toured Nike headquarters and connected with alumni working there.", url: "https://college.lclark.edu/live/news/54312-behind-the-swoosh-at-nike-hq" },
  { id: "a3", title: "Career Connections with Alumni is Back for 2025!", tag: "", excerpt: "The spring event where alumni advise on careers, internships, and degree paths.", url: "https://college.lclark.edu/live/news/55300-career-connections-with-alumni-is-back-for-2025" },
  { id: "a4", title: "Econ Students & Alumni Come Together for an Evening of Networking", tag: "econ-leadership-innovation", excerpt: "A joint event from the Career Center, Economics Department, and Alumni Office.", url: "https://college.lclark.edu/live/news/52847-econ-students-alumni-come-together-for-an" },
  { id: "a5", title: "What's Next for Sociology and Anthropology Students?", tag: "social-services-nonprofit-education", excerpt: "A new course bridging campus to post-college life through alumni connections.", url: "https://college.lclark.edu/live/news/57620-whats-next-for-sociology-and-anthropology-students" },
  { id: "a6", title: "Lewis & Clark Students Visit Meta in Seattle", tag: "data-tech-cs", excerpt: "Alumni employees hosted a student visit to Meta's Seattle office.", url: "https://college.lclark.edu/live/news/52333-lewis-clark-students-visit-meta-in-seattle" },
];

export interface PathInfo {
  blurb: string;
  insight: string; // illustrative only — not a sourced labor-market statistic
  learnMoreUrl: string; // real L&C Career Center page for this path
}

export const PATH_INFO: Record<Exclude<CareerPath, "">, PathInfo> = {
  "comm-marketing-pr": { blurb: "Storytelling, brand, and audience — from agencies to in-house teams.", insight: "Illustrative: entry-level roles often value a portfolio over a specific major.", learnMoreUrl: "https://careercenter.lclark.edu/channels/communication-marketing-public-relations/" },
  "arts-design-media": { blurb: "Creative and cultural work — studios, museums, publishing, design.", insight: "Illustrative: a strong portfolio typically matters more than GPA in this field.", learnMoreUrl: "https://careercenter.lclark.edu/channels/arts-design-media/" },
  "data-tech-cs": { blurb: "Analysis, software, and infrastructure — any major, with the right technical skills.", insight: "Illustrative: recruiters commonly screen for one or two specific tools before soft skills.", learnMoreUrl: "https://careercenter.lclark.edu/channels/data-science-tech-comp-sci/" },
  "econ-leadership-innovation": { blurb: "Finance, consulting, and venture — analytical roles across industries.", insight: "Illustrative: many programs recruit heavily a full year ahead of the start date.", learnMoreUrl: "https://careercenter.lclark.edu/channels/economics-organizational-leadership-innovation/" },
  "environment-sustainability-science": { blurb: "Conservation, policy, and field science — public, nonprofit, and private sector.", insight: "Illustrative: field-season and seasonal roles are a common entry point.", learnMoreUrl: "https://careercenter.lclark.edu/channels/environment-sustainability-natural-sciences/" },
  "global-diplomacy-languages": { blurb: "International affairs, NGOs, and language-driven work.", insight: "Illustrative: a second language plus one region of focus is a common early differentiator.", learnMoreUrl: "https://careercenter.lclark.edu/channels/global-engagement-diplomacy-world-languages/" },
  "health-wellness": { blurb: "Clinical, research, and wellness-adjacent paths — pre-health and beyond.", insight: "Illustrative: research or clinical hours are frequently weighted heavily before grad-program apply.", learnMoreUrl: "https://careercenter.lclark.edu/channels/human-development-health-wellness/" },
  "public-service-law-policy": { blurb: "Government, law, and policy research — local to federal.", insight: "Illustrative: legislative fellowships are a common bridge role before law school or a policy career.", learnMoreUrl: "https://careercenter.lclark.edu/channels/public-service-law-policy/" },
  "social-services-nonprofit-education": { blurb: "Direct service, education, and mission-driven nonprofit work.", insight: "Illustrative: hands-on volunteer or tutoring experience is often weighted as highly as coursework.", learnMoreUrl: "https://careercenter.lclark.edu/channels/social-services-nonprofit-education/" },
};

// Real, stable contact info for the actual L&C Career Center — not live data,
// just public facts (address/hours/phone/email) unlikely to change mid-year.
export const CAREER_CENTER = {
  name: "L&C Career Center",
  location: "Fowler Student Center",
  hours: "Mon–Fri, 9am–4pm",
  phone: "503-768-7114",
  email: "careers@lclark.edu",
  siteUrl: "https://careercenter.lclark.edu/",
  jobBoardUrl: "https://careercenter.lclark.edu/jobs/",
  newsAndEventsUrl: "https://college.lclark.edu/student_life/career_development/news_and_events/",
};

export interface ExternalBoard {
  id: string;
  label: string;
  url: string;
  blurb: string;
}

// General-purpose job boards students should also check — not a replacement
// for the curated list above, just "more places to look."
export const EXTERNAL_BOARDS: ExternalBoard[] = [
  { id: "eb1", label: "L&C Career Center Job Board", url: CAREER_CENTER.jobBoardUrl, blurb: "Postings curated specifically for L&C students." },
  { id: "eb2", label: "Handshake", url: "https://joinhandshake.com/", blurb: "What the Career Center uses for event registration and employer postings." },
  { id: "eb3", label: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs/", blurb: "Broadest search — filter by location and entry-level experience." },
  { id: "eb4", label: "Indeed", url: "https://www.indeed.com/", blurb: "Good for hourly and local Portland-area listings." },
];

export interface AlumniProfile {
  id: string;
  name: string;
  grad: string;
  path: CareerPath;
  role: string;
  blurb: string;
  // Invented example alumni, not real consenting people — email/LinkedIn are
  // plausible-format placeholders, not functioning contact info.
  email: string;
  linkedin: string;
}

export const ALUMNI_DIRECTORY: AlumniProfile[] = [
  { id: "al1", name: "Marcus Webb", grad: "2019", path: "data-tech-cs", role: "Data Engineer, Nike", blurb: "Happy to talk through breaking into data with a non-CS degree.", email: "marcus.webb.19@alumni.lclark.edu", linkedin: "linkedin.com/in/marcuswebb" },
  { id: "al2", name: "Sophia Trần", grad: "2021", path: "public-service-law-policy", role: "Legislative Aide, Oregon State Senate", blurb: "Did the legislative fellowship as a student — good first call for policy questions.", email: "sophia.tran.21@alumni.lclark.edu", linkedin: "linkedin.com/in/sophiatran" },
  { id: "al3", name: "Elena Cruz", grad: "2017", path: "comm-marketing-pr", role: "Brand Manager, Nike", blurb: "Started in an agency internship found through the Career Center.", email: "elena.cruz.17@alumni.lclark.edu", linkedin: "linkedin.com/in/elenacruz" },
  { id: "al4", name: "Owen Park", grad: "2020", path: "environment-sustainability-science", role: "Climate Policy Analyst, City of Portland", blurb: "Went straight from a trail-crew summer into municipal sustainability work.", email: "owen.park.20@alumni.lclark.edu", linkedin: "linkedin.com/in/owenpark" },
  { id: "al5", name: "Grace Kim", grad: "2022", path: "health-wellness", role: "Research Coordinator, OHSU", blurb: "Bridge-year advice for pre-health students weighing grad school timing.", email: "grace.kim.22@alumni.lclark.edu", linkedin: "linkedin.com/in/gracekim" },
  { id: "al6", name: "Noah Fischer", grad: "2018", path: "econ-leadership-innovation", role: "Associate, Moss Adams", blurb: "Good contact for finance recruiting timelines and case-interview prep.", email: "noah.fischer.18@alumni.lclark.edu", linkedin: "linkedin.com/in/noahfischer" },
];

export interface CareerService {
  id: string;
  title: string;
  description: string;
  cta: string;
}

export const CAREER_SERVICES: CareerService[] = [
  { id: "cs1", title: "Resume & Cover Letter Review", description: "30 minutes, one-on-one, with a career consultant.", cta: "Book a review" },
  { id: "cs2", title: "Mock Interview", description: "Practice a real interview format for your target field.", cta: "Book a mock interview" },
  { id: "cs3", title: "Career Exploration Session", description: "Not sure what direction fits? Start here.", cta: "Book a session" },
];
