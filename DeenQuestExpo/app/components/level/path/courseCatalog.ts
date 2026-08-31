import { BookOpen, Landmark, type LucideIcon } from "lucide-react-native";

import type { CourseType } from "../../../store/services/api";
import type { SectionColors } from "./sectionColors";
import { QAIDA_PALETTE, NAMAZ_PALETTE } from "./palette";

export interface CourseCatalogEntry {
  courseType: CourseType;
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  palette: SectionColors[];
}

export const COURSE_CATALOG: CourseCatalogEntry[] = [
  {
    courseType: "qaida",
    title: "Noorani Qaida",
    subtitle: "Read the Arabic script, letter by letter",
    Icon: BookOpen,
    palette: QAIDA_PALETTE,
  },
  {
    courseType: "namaz",
    title: "Namaz",
    subtitle: "Learn to pray, from wudu to salam",
    Icon: Landmark,
    palette: NAMAZ_PALETTE,
  },
];

export const DEFAULT_COURSE: CourseType = COURSE_CATALOG[0].courseType;

export function courseEntry(courseType: CourseType): CourseCatalogEntry {
  return (
    COURSE_CATALOG.find((c) => c.courseType === courseType) ?? COURSE_CATALOG[0]
  );
}

export function isKnownCourse(value: string | null): value is CourseType {
  return !!value && COURSE_CATALOG.some((c) => c.courseType === value);
}
