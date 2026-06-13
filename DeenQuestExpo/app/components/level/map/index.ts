/**
 * Node primitives for the learning path. These are the low-level, reusable
 * building blocks (a single 3-D level node, its start popup and treasure
 * badge) plus the shared geometry/colors. The high-level screen composition
 * lives in `../path`.
 */
export { LevelNode } from "./LevelNode";
export { LevelPopup } from "./LevelPopup";
export { TreasureBadge } from "./TreasureBadge";
export {
  NODE_SIZE,
  NODE_DEPTH,
  getNodeOffset,
  nodeVisual,
  hexToRgba,
  DEFAULT_SECTION_COLORS,
  LEVEL_GREEN,
  LEVEL_GREEN_LIGHT,
  LEVEL_GREEN_DARK,
  LEVEL_GREEN_DEEP,
  LEVEL_GREEN_GLOW,
  type SectionColors,
  type NodeVisual,
} from "./constants";
export { s } from "./styles";
