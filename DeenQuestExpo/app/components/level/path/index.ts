/**
 * The learning-path screen composition: one course at a time, rendered as a
 * section-based journey on top of the `../map` node primitives, with a course
 * selector and an animated course-switch transition.
 */
export { LearningPathContent } from "./LearningPathContent";
export { PathTopBar } from "./PathTopBar";
export { SectionHeader } from "./SectionHeader";
export { ActiveSectionBanner } from "./ActiveSectionBanner";
export { SectionDivider } from "./SectionDivider";
export { CourseSelectorSheet } from "./CourseSelectorSheet";
export { CourseSwitchTransition } from "./CourseSwitchTransition";
export { StreakPopup, type StreakOrigin } from "./StreakPopup";
export {
  buildSections,
  findActiveLocation,
  LEVELS_PER_SECTION,
} from "./sections";
export {
  SECTION_PALETTE,
  QAIDA_PALETTE,
  NAMAZ_PALETTE,
  colorsForSection,
} from "./palette";
export {
  COURSE_CATALOG,
  DEFAULT_COURSE,
  courseEntry,
  isKnownCourse,
  type CourseCatalogEntry,
} from "./courseCatalog";
export type { PathSection, PathLocation, SectionStatus } from "./types";
