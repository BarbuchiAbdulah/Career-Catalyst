import type { Entry, Student } from "./types";

let _id = 100;
export const uid = (): string =>
  (++_id).toString(36) + Date.now().toString(36).slice(-3);

export const MAJORS = [
  "Biology",
  "Computer Science",
  "Economics",
  "English",
  "Environmental Studies",
  "History",
  "International Affairs",
  "Psychology",
  "Sociology/Anthropology",
  "Studio Art",
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
    major: "Computer Science",
    headline: "Aiming for a software internship by junior summer.",
    flagged: false,
    entries: e([
      { type: "skill", title: "Python", meta: "Coursework + personal projects", date: "2024-10-02", path: "data-tech-cs" },
      { type: "skill", title: "Technical writing", meta: "Lab reports", date: "2025-02-14", path: "data-tech-cs" },
      { type: "skill", title: "Git & GitHub", meta: "Group project workflow", date: "2025-03-10", path: "data-tech-cs" },
      { type: "experience", title: "CS department grader", meta: "On-campus, 2 semesters", date: "2025-09-01", path: "data-tech-cs" },
      { type: "experience", title: "Hackathon project", meta: "Built a study-group finder", date: "2025-10-18", path: "data-tech-cs" },
      { type: "contact", title: "Prof. Ramirez", meta: "CS faculty · recommender", date: "2025-11-20", path: "" },
      { type: "contact", title: "Career advisor Tasia S.", meta: "First resume review", date: "2026-01-28", path: "" },
    ]),
  },
  {
    id: "s2",
    name: "Amara Okafor",
    grad: "2026",
    major: "Economics",
    headline: "Headed into financial analysis — building the network now.",
    flagged: false,
    entries: e([
      { type: "skill", title: "Financial modeling", meta: "Excel, valuation", date: "2023-10-10", path: "econ-leadership-innovation" },
      { type: "skill", title: "Stata", meta: "Econometrics", date: "2024-02-01", path: "econ-leadership-innovation" },
      { type: "skill", title: "Public speaking", meta: "Debate team", date: "2023-11-05", path: "" },
      { type: "skill", title: "Data visualization", meta: "Tableau", date: "2024-09-12", path: "data-tech-cs" },
      { type: "skill", title: "Spanish (fluent)", meta: "", date: "2023-09-01", path: "global-diplomacy-languages" },
      { type: "skill", title: "R", meta: "Senior thesis", date: "2025-09-20", path: "econ-leadership-innovation" },
      { type: "experience", title: "Summer analyst", meta: "Portland credit union", date: "2024-06-15", path: "econ-leadership-innovation" },
      { type: "experience", title: "Research assistant", meta: "Econ dept", date: "2024-09-01", path: "econ-leadership-innovation" },
      { type: "experience", title: "Treasurer, Investment Club", meta: "", date: "2023-10-01", path: "econ-leadership-innovation" },
      { type: "experience", title: "Peer career advisor", meta: "L&C Career Center", date: "2025-01-20", path: "" },
      { type: "contact", title: "L&C alum @ US Bank", meta: "Informational interview done", date: "2024-11-08", path: "" },
      { type: "contact", title: "Career advisor Nina O.", meta: "", date: "2023-10-15", path: "" },
      { type: "contact", title: "Econ thesis advisor", meta: "", date: "2025-09-10", path: "" },
      { type: "contact", title: "Recruiter, Moss Adams", meta: "Met at career fair", date: "2025-10-02", path: "" },
      { type: "contact", title: "Alum mentor (L&C Net)", meta: "", date: "2024-03-18", path: "" },
    ]),
  },
  {
    id: "s3",
    name: "Diego Marín",
    grad: "2027",
    major: "Environmental Studies",
    headline: "Wants field conservation work after graduation.",
    flagged: true,
    entries: e([
      { type: "skill", title: "GIS mapping", meta: "ArcGIS", date: "2025-03-01", path: "environment-sustainability-science" },
      { type: "experience", title: "Trail crew volunteer", meta: "Summer", date: "2025-07-10", path: "environment-sustainability-science" },
      { type: "contact", title: "ENVS faculty advisor", meta: "", date: "2024-09-25", path: "" },
    ]),
  },
  {
    id: "s4",
    name: "Priya Nair",
    grad: "2028",
    major: "Psychology",
    headline: "Exploring clinical vs. research psych.",
    flagged: false,
    entries: e([
      { type: "skill", title: "SPSS", meta: "Stats methods", date: "2025-10-05", path: "health-wellness" },
      { type: "skill", title: "Active listening", meta: "Peer support training", date: "2025-11-01", path: "health-wellness" },
      { type: "experience", title: "Research participant coordinator", meta: "Psych lab", date: "2026-02-01", path: "health-wellness" },
      { type: "contact", title: "Lab PI", meta: "", date: "2026-02-10", path: "" },
      { type: "contact", title: "Pre-health advisor", meta: "", date: "2025-10-20", path: "" },
    ]),
  },
  {
    id: "s5",
    name: "Jordan Blake",
    grad: "2026",
    major: "History",
    headline: "Museum and archival work; applying to grad programs.",
    flagged: false,
    entries: e([
      { type: "skill", title: "Archival research", meta: "", date: "2023-11-01", path: "social-services-nonprofit-education" },
      { type: "skill", title: "Editing", meta: "Student journal", date: "2024-02-15", path: "arts-design-media" },
      { type: "experience", title: "Museum intern", meta: "Oregon Historical Society", date: "2024-06-20", path: "arts-design-media" },
      { type: "experience", title: "Writing tutor", meta: "On-campus", date: "2024-09-05", path: "social-services-nonprofit-education" },
      { type: "contact", title: "History dept chair", meta: "", date: "2025-03-12", path: "" },
    ]),
  },
  {
    id: "s6",
    name: "Wei Chen",
    grad: "2028",
    major: "Biology",
    headline: "New here — just getting started.",
    flagged: false,
    entries: e([
      { type: "skill", title: "Cell culture", meta: "Intro bio lab", date: "2026-03-01", path: "environment-sustainability-science" },
    ]),
  },
];

