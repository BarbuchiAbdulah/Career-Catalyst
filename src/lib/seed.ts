import type { Application, Entry, Skill, Student, Todo } from "./types";

let _id = 100;
export const uid = (): string =>
  (++_id).toString(36) + Date.now().toString(36).slice(-3);

function apps(list: Omit<Application, "id">[]): Application[] {
  return list.map((x) => ({ id: uid(), ...x }));
}

function skills(list: { title: string; path: Skill["path"]; evidence: Omit<Skill["evidence"][number], "id">[] }[]): Skill[] {
  return list.map((s) => ({ id: uid(), title: s.title, path: s.path, evidence: s.evidence.map((ev) => ({ id: uid(), ...ev })) }));
}

function todos(list: Omit<Todo, "id">[]): Todo[] {
  return list.map((t) => ({ id: uid(), ...t }));
}

// Real Lewis & Clark College undergraduate programs (college.lclark.edu/academics/majors-and-minors/).
export const MAJORS = [
  "Art (Studio)",
  "Art History",
  "Biochemistry and Molecular Biology",
  "Biology",
  "Chemistry",
  "Classics",
  "Computer Science",
  "Computer Science and Mathematics",
  "Data Science",
  "Economics",
  "English",
  "Environmental Studies",
  "French Studies",
  "German Studies",
  "Hispanic Studies",
  "History",
  "International Affairs",
  "Mathematics and Statistics",
  "Music",
  "Philosophy",
  "Physics",
  "Political Science",
  "Psychology",
  "Religious Studies",
  "Rhetoric and Media Studies",
  "Sociology and Anthropology",
  "Student-Designed Major",
  "Theatre",
  "World Languages",
];

export const MINORS = [
  "Art and Art History",
  "Artificial Intelligence",
  "Asian Studies",
  "Chemistry",
  "Chinese",
  "Classics",
  "Computer Science",
  "Cybersecurity",
  "Dance",
  "Data Science",
  "Earth System Science",
  "Economics",
  "Education",
  "English",
  "Entrepreneurial Leadership and Innovation",
  "Environmental Studies",
  "Ethnic Studies",
  "French Studies",
  "Gender Studies",
  "German Studies",
  "Health Studies",
  "Hispanic Studies",
  "History",
  "Japanese",
  "Latin American and Latino Studies",
  "Law and Policy",
  "Mathematics and Statistics",
  "Middle East and North African Studies",
  "Music",
  "Neuroscience",
  "Philosophy",
  "Physics",
  "Political Economy",
  "Political Science",
  "Religious Studies",
  "Rhetoric and Media Studies",
  "Russian",
  "Theatre",
];

function e(list: Omit<Entry, "id">[]): Entry[] {
  return list.map((x) => ({ id: uid(), ...x }));
}

export const SEED_STUDENTS: Student[] = [
  {
    id: "me",
    name: "Riley Chen",
    grad: "2027",
    majors: ["Computer Science"],
    minors: ["Data Science"],
    headline: "Aiming for a software internship by junior summer.",
    flagged: false,
    skills: skills([
      {
        title: "Python",
        path: "data-tech-cs",
        evidence: [
          { date: "2024-10-02", description: "Intro CS coursework — first exposure" },
          { date: "2025-01-20", description: "Completed an online Python certification" },
          { date: "2025-03-10", description: "Personal project — built a study-group finder app" },
          { date: "2025-09-01", description: "Used on the job — automated grading scripts as CS department grader" },
        ],
      },
      { title: "Technical writing", path: "data-tech-cs", evidence: [{ date: "2025-02-14", description: "Lab reports" }] },
      { title: "Git & GitHub", path: "data-tech-cs", evidence: [{ date: "2025-03-10", description: "Group project workflow" }] },
    ]),
    entries: e([
      { type: "experience", title: "CS department grader", meta: "On-campus, 2 semesters", date: "2025-09-01", path: "data-tech-cs", tools: ["Python"] },
      { type: "experience", title: "Hackathon project", meta: "Built a study-group finder", date: "2025-10-18", path: "data-tech-cs", tools: ["Python", "Git & GitHub"] },
      { type: "contact", title: "Prof. Ramirez", meta: "CS faculty · recommender", date: "2025-11-20", path: "data-tech-cs", relationship: "faculty" },
      { type: "contact", title: "Career advisor Tasia S.", meta: "First resume review", date: "2026-01-28", path: "", relationship: "mentor" },
    ]),
    interests: ["Game development", "Trail running", "Campus radio"],
    resumeUrl: "",
    linkedin: "linkedin.com/in/rileychen-example",
    applications: apps([
      { company: "Simple Finance Co.", role: "Data Analyst Intern", link: "", source: "external", deadline: "2026-09-15", status: "saved", notes: "", date: "2026-07-20" },
      { company: "L&C ITS", role: "IT Help Desk Assistant", link: "", source: "on-campus", deadline: "", status: "applied", notes: "Applied through Handshake-style posting.", date: "2026-06-10" },
    ]),
    eventsAttended: ["e3"],
    advisingNotes: [{ id: uid(), date: "2026-01-28", note: "Action item: apply to two on-campus tech roles before end of spring term." }],
    todos: todos([
      { text: "Update resume link before the Fall Career Fair", done: false, date: "2026-07-20" },
      { text: "Ask Prof. Ramirez for a recommendation letter", done: true, date: "2026-01-28" },
    ]),
    dismissedSuggestions: [],
  },
  {
    id: "s2",
    name: "Amara Okafor",
    grad: "2026",
    majors: ["Economics"],
    minors: ["Political Economy"],
    headline: "Headed into financial analysis — building the network now.",
    flagged: false,
    skills: skills([
      {
        title: "Financial modeling",
        path: "econ-leadership-innovation",
        evidence: [
          { date: "2023-10-10", description: "Coursework — Excel valuation methods" },
          { date: "2024-06-15", description: "Used as summer analyst at Portland credit union" },
        ],
      },
      { title: "Stata", path: "econ-leadership-innovation", evidence: [{ date: "2024-02-01", description: "Econometrics coursework" }] },
      { title: "Public speaking", path: "", evidence: [{ date: "2023-11-05", description: "Debate team" }] },
      { title: "Data visualization", path: "data-tech-cs", evidence: [{ date: "2024-09-12", description: "Tableau" }] },
      { title: "Spanish (fluent)", path: "global-diplomacy-languages", evidence: [{ date: "2023-09-01", description: "" }] },
      { title: "R", path: "econ-leadership-innovation", evidence: [{ date: "2025-09-20", description: "Senior thesis" }] },
    ]),
    entries: e([
      { type: "experience", title: "Summer analyst", meta: "Portland credit union", date: "2024-06-15", path: "econ-leadership-innovation", tools: ["Excel", "Financial modeling"] },
      { type: "experience", title: "Research assistant", meta: "Econ dept", date: "2024-09-01", path: "econ-leadership-innovation", tools: ["Stata", "R"] },
      { type: "experience", title: "Treasurer, Investment Club", meta: "", date: "2023-10-01", path: "econ-leadership-innovation" },
      { type: "experience", title: "Peer career advisor", meta: "L&C Career Center", date: "2025-01-20", path: "" },
      { type: "contact", title: "L&C alum @ US Bank", meta: "Informational interview done", date: "2024-11-08", path: "econ-leadership-innovation", relationship: "alumni" },
      { type: "contact", title: "Career advisor Nina O.", meta: "", date: "2023-10-15", path: "", relationship: "mentor" },
      { type: "contact", title: "Econ thesis advisor", meta: "", date: "2025-09-10", path: "econ-leadership-innovation", relationship: "faculty" },
      { type: "contact", title: "Recruiter, Moss Adams", meta: "Met at career fair", date: "2025-10-02", path: "econ-leadership-innovation", relationship: "recruiter" },
      { type: "contact", title: "Alum mentor (L&C Net)", meta: "", date: "2024-03-18", path: "", relationship: "alumni" },
    ]),
    interests: ["Investment clubs", "Debate", "Portland food scene"],
    resumeUrl: "drive.google.com/file/example-amara-resume",
    linkedin: "linkedin.com/in/amaraokafor-example",
    applications: apps([
      { company: "Moss Adams", role: "Investment Banking Summer Analyst", link: "", source: "external", deadline: "2026-08-01", status: "interviewing", notes: "First-round done, waiting on second round.", date: "2026-05-01" },
      { company: "US Bank", role: "Credit Analyst Rotation", link: "", source: "external", deadline: "2026-08-20", status: "applied", notes: "", date: "2026-06-15" },
      { company: "L&C Career Center", role: "Peer Career Advisor", link: "", source: "on-campus", deadline: "", status: "offer", notes: "Already working this role.", date: "2025-01-10" },
    ]),
    eventsAttended: ["e1", "e5"],
    advisingNotes: [{ id: uid(), date: "2025-09-10", note: "Long-term plan: financial analysis role, then an MBA in 4-5 years." }],
    todos: [],
    dismissedSuggestions: [],
  },
  {
    id: "s3",
    name: "Diego Marín",
    grad: "2027",
    majors: ["Environmental Studies"],
    minors: ["Earth System Science"],
    headline: "Wants field conservation work after graduation.",
    flagged: true,
    skills: skills([
      { title: "GIS mapping", path: "environment-sustainability-science", evidence: [{ date: "2025-03-01", description: "ArcGIS coursework" }] },
    ]),
    entries: e([
      { type: "experience", title: "Trail crew volunteer", meta: "Summer", date: "2025-07-10", path: "environment-sustainability-science" },
      { type: "contact", title: "ENVS faculty advisor", meta: "", date: "2024-09-25", path: "environment-sustainability-science", relationship: "faculty" },
    ]),
    interests: ["Backpacking", "Bird watching"],
    resumeUrl: "",
    linkedin: "",
    applications: apps([
      { company: "City of Portland", role: "Sustainability Analyst Intern", link: "", source: "external", deadline: "2026-08-30", status: "saved", notes: "", date: "2026-07-15" },
    ]),
    eventsAttended: [],
    advisingNotes: [],
    todos: [],
    dismissedSuggestions: [],
  },
  {
    id: "s4",
    name: "Priya Nair",
    grad: "2028",
    majors: ["Psychology"],
    minors: ["Neuroscience"],
    headline: "Exploring clinical vs. research psych.",
    flagged: false,
    skills: skills([
      { title: "SPSS", path: "health-wellness", evidence: [{ date: "2025-10-05", description: "Stats methods coursework" }] },
      { title: "Active listening", path: "health-wellness", evidence: [{ date: "2025-11-01", description: "Peer support training" }] },
    ]),
    entries: e([
      { type: "experience", title: "Research participant coordinator", meta: "Psych lab", date: "2026-02-01", path: "health-wellness", tools: ["SPSS"] },
      { type: "contact", title: "Lab PI", meta: "", date: "2026-02-10", path: "health-wellness", relationship: "faculty" },
      { type: "contact", title: "Pre-health advisor", meta: "", date: "2025-10-20", path: "", relationship: "mentor" },
    ]),
    interests: ["Peer support training", "Ceramics"],
    resumeUrl: "",
    linkedin: "",
    applications: apps([
      { company: "OHSU", role: "Clinical Research Coordinator (Volunteer)", link: "", source: "external", deadline: "", status: "saved", notes: "", date: "2026-07-10" },
    ]),
    eventsAttended: [],
    advisingNotes: [{ id: uid(), date: "2025-10-20", note: "Still deciding clinical vs. research psych — revisit after this term's lab work." }],
    todos: [],
    dismissedSuggestions: [],
  },
  {
    id: "s5",
    name: "Jordan Blake",
    grad: "2026",
    majors: ["History"],
    minors: ["Art and Art History"],
    headline: "Museum and archival work; applying to grad programs.",
    flagged: false,
    skills: skills([
      { title: "Archival research", path: "social-services-nonprofit-education", evidence: [{ date: "2023-11-01", description: "" }] },
      { title: "Editing", path: "arts-design-media", evidence: [{ date: "2024-02-15", description: "Student journal" }] },
    ]),
    entries: e([
      { type: "experience", title: "Museum intern", meta: "Oregon Historical Society", date: "2024-06-20", path: "arts-design-media" },
      { type: "experience", title: "Writing tutor", meta: "On-campus", date: "2024-09-05", path: "social-services-nonprofit-education", tools: ["Editing"] },
      { type: "contact", title: "History dept chair", meta: "", date: "2025-03-12", path: "social-services-nonprofit-education", relationship: "faculty" },
    ]),
    interests: ["Museum studies", "Board games"],
    resumeUrl: "",
    linkedin: "linkedin.com/in/jordanblake-example",
    applications: apps([
      { company: "Portland Art Museum", role: "Museum Education Intern", link: "", source: "external", deadline: "2026-08-15", status: "applied", notes: "", date: "2026-06-01" },
    ]),
    eventsAttended: ["e2"],
    advisingNotes: [],
    todos: [],
    dismissedSuggestions: [],
  },
  {
    id: "s6",
    name: "Wei Chen",
    grad: "2028",
    majors: ["Biology"],
    minors: [],
    headline: "New here — just getting started.",
    flagged: false,
    skills: skills([
      { title: "Cell culture", path: "environment-sustainability-science", evidence: [{ date: "2026-03-01", description: "Intro bio lab" }] },
    ]),
    entries: [],
    interests: ["Rock climbing"],
    resumeUrl: "",
    linkedin: "",
    applications: [],
    eventsAttended: [],
    advisingNotes: [],
    todos: [],
    dismissedSuggestions: [],
  },
];
