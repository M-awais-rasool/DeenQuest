/**
 * The learning-path screen: one course at a time, drawn as a road through an
 * illustrated world, with a course selector and an animated course switch.
 *
 * The section model (`buildSections`, `PathSection`) is no longer used by this
 * screen — the path is one continuous road now — but the rewards and
 * certificates screens still group levels by it, so it stays.
 */
export { LearningPathContent } from "./LearningPathContent";
export { PathTopBar } from "./PathTopBar";
export { SkyLayer, GroundLayer } from "./PathBackdrop";
export { PathHero } from "./PathHero";
export { NextRewardCard } from "./NextRewardCard";
export {
  PathNode,
  NodeLabel,
  StarTray,
  StartFlag,
  NodePulse,
  nodeState,
  type NodeState,
} from "./PathNode";
export { WORLD, worldFamily, DESIGN_WIDTH, type WorldFamily } from "./worldTheme";
export {
  NODE_GAP,
  NODE_SIZE,
  RING,
  canvasHeight,
  nodePoint,
  roadPath,
  scaleX,
} from "./pathLayout";
export { CourseSelectorSheet } from "./CourseSelectorSheet";
export { CourseSwitchTransition } from "./CourseSwitchTransition";
export { StreakPopup, type StreakOrigin } from "./StreakPopup";
export { buildSections } from "./sections";
export { QAIDA_PALETTE, NAMAZ_PALETTE } from "./palette";
export { hexToRgba, type SectionColors } from "./sectionColors";
export {
  COURSE_CATALOG,
  DEFAULT_COURSE,
  courseEntry,
  isKnownCourse,
  type CourseCatalogEntry,
} from "./courseCatalog";
export type { PathSection } from "./types";
