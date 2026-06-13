/**
 * The learning-path screen composition: a single continuous, section-based
 * journey built on top of the `../map` node primitives.
 */
export { LearningPathContent } from "./LearningPathContent";
export { PathTopBar } from "./PathTopBar";
export { SectionHeader } from "./SectionHeader";
export { ActiveSectionBanner } from "./ActiveSectionBanner";
export { SectionDivider } from "./SectionDivider";
export { StreakPopup, type StreakOrigin } from "./StreakPopup";
export {
  buildSections,
  findActiveLocation,
  LEVELS_PER_SECTION,
} from "./sections";
export { SECTION_PALETTE, colorsForSection } from "./palette";
export type { PathSection, PathLocation, SectionStatus } from "./types";
