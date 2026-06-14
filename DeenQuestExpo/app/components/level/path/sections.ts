import type { LevelWithStatus, CourseType } from "../../../store/services/api";
import { colorsForSection } from "./palette";
import type { PathSection, PathLocation, SectionStatus } from "./types";

/** How many levels make up one section of the path. */
export const LEVELS_PER_SECTION = 10;

interface SectionMeta {
  title: string;
  subtitle: string;
}

/**
 * Curated titles per course. Kept as data (not hardcoded in the UI) so adding
 * a course or renaming a section is a one-line change, and anything beyond the
 * curated list falls back to a generated title.
 */
const CURATED_META: Partial<Record<CourseType, SectionMeta[]>> = {
  qaida: [
    {
      title: "Arabic Foundations",
      subtitle: "Letters, harakat & your first words",
    },
    {
      title: "Reading the Qur'an",
      subtitle: "From joining letters to fluent recitation",
    },
    {
      title: "Learn to Pray",
      subtitle: "Wudu, the postures & what to recite in salah",
    },
  ],
};

function metaFor(
  courseType: CourseType,
  sectionIndex: number,
  levels: LevelWithStatus[],
): SectionMeta {
  const curated = CURATED_META[courseType]?.[sectionIndex];
  if (curated) return curated;
  // Fallback: borrow the theme of the section's opening level so generated
  // sections still feel descriptive.
  const opener = levels[0]?.theme?.trim();
  return {
    title: `Chapter ${sectionIndex + 1}`,
    subtitle: opener || "Continue your learning journey",
  };
}

function statusFor(levels: LevelWithStatus[]): SectionStatus {
  if (levels.length === 0) return "locked";
  if (levels.every((l) => l.status === "completed")) return "completed";
  if (levels.some((l) => l.status !== "locked")) return "active";
  return "locked";
}

/**
 * Split a flat, ordered list of levels into fixed-size sections. Pure and
 * O(n) — safe to memoize on the levels array. Works for any number of levels,
 * so the path grows automatically as more content is seeded.
 */
export function buildSections(
  levels: LevelWithStatus[],
  courseType: CourseType,
  size: number = LEVELS_PER_SECTION,
): PathSection[] {
  const sections: PathSection[] = [];

  for (let start = 0; start < levels.length; start += size) {
    const chunk = levels.slice(start, start + size);
    const index = sections.length;
    const meta = metaFor(courseType, index, chunk);

    sections.push({
      key: `${courseType}-section-${index}`,
      index,
      number: index + 1,
      title: meta.title,
      subtitle: meta.subtitle,
      colors: colorsForSection(index),
      startIndex: start,
      status: statusFor(chunk),
      total: chunk.length,
      completed: chunk.filter((l) => l.status === "completed").length,
      courseType,
      data: chunk,
    });
  }

  return sections;
}

/**
 * Locate where the user is along the path so the screen can open there: the
 * frontier level (first one that is unlocked but not yet completed). Falls
 * back to the last level when everything is done, or null when nothing is
 * unlocked yet (open at the top).
 */
export function findActiveLocation(
  sections: PathSection[],
): PathLocation | null {
  let last: PathLocation | null = null;

  for (const section of sections) {
    for (let itemIndex = 0; itemIndex < section.data.length; itemIndex++) {
      const loc = { sectionIndex: section.index, itemIndex };
      last = loc;
      const status = section.data[itemIndex].status;
      if (status === "available" || status === "in_progress") {
        return loc;
      }
    }
  }

  return last;
}
