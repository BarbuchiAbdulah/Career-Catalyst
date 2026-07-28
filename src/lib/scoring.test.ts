import { describe, expect, it } from "vitest";
import { ACADEMIC_YEAR, WEIGHT, band, scoreFor, stageFor, targetFor } from "./scoring";
import type { Contact, Entry, Skill } from "./types";

describe("stageFor", () => {
  it("maps grad years around ACADEMIC_YEAR to the right stage", () => {
    expect(stageFor(String(ACADEMIC_YEAR))).toBe("senior");
    expect(stageFor(String(ACADEMIC_YEAR - 1))).toBe("senior"); // already graduated / this year
    expect(stageFor(String(ACADEMIC_YEAR + 1))).toBe("junior");
    expect(stageFor(String(ACADEMIC_YEAR + 2))).toBe("sophomore");
    expect(stageFor(String(ACADEMIC_YEAR + 3))).toBe("first-year");
    expect(stageFor(String(ACADEMIC_YEAR + 10))).toBe("first-year");
  });
});

describe("WEIGHT", () => {
  it("sums to 1 so scoreFor's total is a clean 0..100 scale", () => {
    const sum = WEIGHT.skill + WEIGHT.experience + WEIGHT.contact;
    expect(sum).toBeCloseTo(1);
  });
});

describe("scoreFor", () => {
  it("scores 0 with no skills, entries, or contacts", () => {
    const { score, per } = scoreFor([], [], [], String(ACADEMIC_YEAR));
    expect(score).toBe(0);
    expect(per.skill.n).toBe(0);
    expect(per.experience.n).toBe(0);
    expect(per.contact.n).toBe(0);
  });

  it("caps at 100 once every category meets its stage target", () => {
    const grad = String(ACADEMIC_YEAR); // senior — full-size targets
    const skillTarget = targetFor("skill", "senior");
    const expTarget = targetFor("experience", "senior");
    const contactTarget = targetFor("contact", "senior");

    const skills: Skill[] = Array.from({ length: skillTarget + 2 }, (_, i) => ({
      id: `sk${i}`,
      title: `Skill ${i}`,
      path: "",
      evidence: [],
    }));
    const entries: Entry[] = Array.from({ length: expTarget + 2 }, (_, i) => ({
      id: `exp${i}`,
      title: `Experience ${i}`,
      meta: "",
      startDate: "2026-01-01",
      ongoing: false,
      path: "" as const,
    }));
    const contacts: Contact[] = Array.from({ length: contactTarget + 2 }, (_, i) => ({
      id: `con${i}`,
      name: `Contact ${i}`,
      relationship: "mentor" as const,
      note: "",
      date: "2026-01-01",
      path: "" as const,
    }));

    const { score } = scoreFor(skills, entries, contacts, grad);
    expect(score).toBe(100);
  });

  it("is stage-aware: the same entry counts score lower for a senior than a first-year", () => {
    const skills: Skill[] = [{ id: "s1", title: "Python", path: "", evidence: [] }];
    const entries: Entry[] = [
      { id: "e1", title: "Internship", meta: "", startDate: "2026-01-01", ongoing: false, path: "" },
    ];
    const contacts: Contact[] = [{ id: "c1", name: "Mentor", relationship: "mentor", note: "", date: "2026-01-01", path: "" }];
    const firstYear = scoreFor(skills, entries, contacts, String(ACADEMIC_YEAR + 3));
    const senior = scoreFor(skills, entries, contacts, String(ACADEMIC_YEAR));
    expect(senior.score).toBeLessThan(firstYear.score);
  });
});

describe("band", () => {
  it("maps score boundaries to the right band", () => {
    expect(band(70).key).toBe("ok");
    expect(band(69).key).toBe("mid");
    expect(band(40).key).toBe("mid");
    expect(band(39).key).toBe("low");
  });
});
