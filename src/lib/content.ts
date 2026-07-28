import type { AppSource, CareerPath } from "./types";

// Static, Career-Center-curated content for the Applications and Resources/Events
// tabs. None of this is live data — there's no backend to fetch real job postings,
// a real events calendar, or a real alumni database from, so everything here is
// seeded content a real Career Center would author and keep current by hand.

export interface Job {
  id: string;
  title: string;
  org: string;
  source: AppSource;
  path: CareerPath;
  location: string;
  blurb: string;
}

export const JOBS: Job[] = [
  { id: "j1", title: "Peer Career Advisor", org: "L&C Career Center", source: "on-campus", path: "social-services-nonprofit-education", location: "Fowler Student Center", blurb: "Coach fellow students through resumes and mock interviews, 8 hrs/week." },
  { id: "j2", title: "IT Help Desk Assistant", org: "L&C ITS", source: "on-campus", path: "data-tech-cs", location: "Watzek Library", blurb: "Front-line tech support for students and faculty." },
  { id: "j3", title: "Research Assistant", org: "Biology Department", source: "on-campus", path: "environment-sustainability-science", location: "Olin Hall", blurb: "Support a faculty field-ecology study; data entry and site visits." },
  { id: "j4", title: "Writing Center Tutor", org: "L&C Writing Center", source: "on-campus", path: "arts-design-media", location: "Watzek Library", blurb: "One-on-one sessions helping students with drafts across disciplines." },
  { id: "j5", title: "Marketing Intern", org: "Portland Trail Blazers", source: "external", path: "comm-marketing-pr", location: "Portland, OR", blurb: "Support social media and game-day promotions for the summer season." },
  { id: "j6", title: "Data Analyst Intern", org: "Simple Finance Co.", source: "external", path: "data-tech-cs", location: "Portland, OR (hybrid)", blurb: "SQL/Python work on customer analytics for a fintech startup." },
  { id: "j7", title: "Policy Research Fellow", org: "Oregon State Legislature", source: "external", path: "public-service-law-policy", location: "Salem, OR", blurb: "Support committee staff with bill research during session." },
  { id: "j8", title: "Sustainability Analyst Intern", org: "City of Portland", source: "external", path: "environment-sustainability-science", location: "Portland, OR", blurb: "Assist the Bureau of Planning with climate-action reporting." },
  { id: "j9", title: "Investment Banking Summer Analyst", org: "Moss Adams", source: "external", path: "econ-leadership-innovation", location: "Portland, OR", blurb: "Rotational summer program across advisory and audit teams." },
  { id: "j10", title: "Global Health Program Intern", org: "Mercy Corps", source: "external", path: "global-diplomacy-languages", location: "Portland, OR", blurb: "Support program logistics for an international relief initiative." },
  { id: "j11", title: "Clinical Research Coordinator (Volunteer)", org: "OHSU", source: "external", path: "health-wellness", location: "Portland, OR", blurb: "Assist with patient scheduling and data collection for a research team." },
  { id: "j12", title: "Museum Education Intern", org: "Portland Art Museum", source: "external", path: "arts-design-media", location: "Portland, OR", blurb: "Help develop tour scripts and youth-program materials." },
];

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
  },
];

export interface Article {
  id: string;
  title: string;
  tag: CareerPath | "";
  excerpt: string;
}

export const ARTICLES: Article[] = [
  { id: "a1", title: "How to Talk About a Liberal Arts Degree in an Interview", tag: "", excerpt: "A short framework for turning \"I studied History\" into a concrete, hireable story." },
  { id: "a2", title: "Cold Emailing an Alum Without Sounding Like a Form Letter", tag: "", excerpt: "Three sentences that get replies, and the two that get ignored." },
  { id: "a3", title: "Breaking Into Data Roles From Any Major", tag: "data-tech-cs", excerpt: "The three tools recruiters actually check for, and how to learn them in a semester." },
  { id: "a4", title: "So You Want to Work in Policy", tag: "public-service-law-policy", excerpt: "What a legislative session fellowship really looks like week to week." },
  { id: "a5", title: "Portfolio Basics for Creative Fields", tag: "arts-design-media", excerpt: "What to include when you have more coursework than published work — yet." },
  { id: "a6", title: "Reading a Job Description Like a Recruiter Does", tag: "", excerpt: "Which lines are hard requirements, and which are wish-list padding." },
];

export interface PathInfo {
  blurb: string;
  insight: string; // illustrative only — not a sourced labor-market statistic
}

export const PATH_INFO: Record<Exclude<CareerPath, "">, PathInfo> = {
  "comm-marketing-pr": { blurb: "Storytelling, brand, and audience — from agencies to in-house teams.", insight: "Illustrative: entry-level roles often value a portfolio over a specific major." },
  "arts-design-media": { blurb: "Creative and cultural work — studios, museums, publishing, design.", insight: "Illustrative: a strong portfolio typically matters more than GPA in this field." },
  "data-tech-cs": { blurb: "Analysis, software, and infrastructure — any major, with the right technical skills.", insight: "Illustrative: recruiters commonly screen for one or two specific tools before soft skills." },
  "econ-leadership-innovation": { blurb: "Finance, consulting, and venture — analytical roles across industries.", insight: "Illustrative: many programs recruit heavily a full year ahead of the start date." },
  "environment-sustainability-science": { blurb: "Conservation, policy, and field science — public, nonprofit, and private sector.", insight: "Illustrative: field-season and seasonal roles are a common entry point." },
  "global-diplomacy-languages": { blurb: "International affairs, NGOs, and language-driven work.", insight: "Illustrative: a second language plus one region of focus is a common early differentiator." },
  "health-wellness": { blurb: "Clinical, research, and wellness-adjacent paths — pre-health and beyond.", insight: "Illustrative: research or clinical hours are frequently weighted heavily before grad-program apply." },
  "public-service-law-policy": { blurb: "Government, law, and policy research — local to federal.", insight: "Illustrative: legislative fellowships are a common bridge role before law school or a policy career." },
  "social-services-nonprofit-education": { blurb: "Direct service, education, and mission-driven nonprofit work.", insight: "Illustrative: hands-on volunteer or tutoring experience is often weighted as highly as coursework." },
};

export interface AlumniProfile {
  id: string;
  name: string;
  grad: string;
  path: CareerPath;
  role: string;
  blurb: string;
}

export const ALUMNI_DIRECTORY: AlumniProfile[] = [
  { id: "al1", name: "Marcus Webb", grad: "2019", path: "data-tech-cs", role: "Data Engineer, Nike", blurb: "Happy to talk through breaking into data with a non-CS degree." },
  { id: "al2", name: "Sophia Trần", grad: "2021", path: "public-service-law-policy", role: "Legislative Aide, Oregon State Senate", blurb: "Did the legislative fellowship as a student — good first call for policy questions." },
  { id: "al3", name: "Elena Cruz", grad: "2017", path: "comm-marketing-pr", role: "Brand Manager, Nike", blurb: "Started in an agency internship found through the Career Center." },
  { id: "al4", name: "Owen Park", grad: "2020", path: "environment-sustainability-science", role: "Climate Policy Analyst, City of Portland", blurb: "Went straight from a trail-crew summer into municipal sustainability work." },
  { id: "al5", name: "Grace Kim", grad: "2022", path: "health-wellness", role: "Research Coordinator, OHSU", blurb: "Bridge-year advice for pre-health students weighing grad school timing." },
  { id: "al6", name: "Noah Fischer", grad: "2018", path: "econ-leadership-innovation", role: "Associate, Moss Adams", blurb: "Good contact for finance recruiting timelines and case-interview prep." },
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
