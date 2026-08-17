import type { LevelWithStatus, CourseType } from "../../../store/services/api";
import { colorsForSection } from "./palette";
import type { PathSection, PathLocation, SectionStatus } from "./types";

export const LEVELS_PER_SECTION = 4;

interface SectionMeta {
  title: string;
  subtitle: string;
}

const CURATED_META: Partial<Record<CourseType, SectionMeta[]>> = {
  qaida: [
    {
      title: "Meet the Letters I",
      subtitle: "Your first seventeen letters, by shape and sound",
    },
    {
      title: "Meet the Letters II",
      subtitle: "The rest of the alphabet — all 28 letters",
    },
    {
      title: "Harakat — Letters Speak",
      subtitle: "Fatha, kasra, damma & your first words",
    },
    {
      title: "Reading Words",
      subtitle: "Joining letters, long vowels & the Basmalah",
    },
    {
      title: "First Recitations",
      subtitle: "Al-Fatiha, short surahs & the duas of your day",
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
