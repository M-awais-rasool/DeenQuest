import type { SectionColors } from "../map/constants";

/**
 * Each consecutive section of the learning path is painted with the next
 * color identity in this palette (wrapping when it runs out). Giving every
 * section its own hue is what makes the journey read as distinct "chapters"
 * the way Duolingo's units do, while the node primitives stay generic.
 *
 * Index 0 is the original green so the very first section keeps the look
 * users already know.
 */
export const SECTION_PALETTE: SectionColors[] = [
  // Green
  {
    accent: "#43A047",
    light: "#66BB6A",
    base: "#43A047",
    dark: "#2E7D32",
    deep: "#1B5E20",
    glow: "rgba(67, 160, 71, 0.15)",
  },
  // Violet
  {
    accent: "#7E57C2",
    light: "#9575CD",
    base: "#7E57C2",
    dark: "#5E35B1",
    deep: "#4527A0",
    glow: "rgba(126, 87, 194, 0.15)",
  },
  // Sky
  {
    accent: "#29B6F6",
    light: "#4FC3F7",
    base: "#29B6F6",
    dark: "#0288D1",
    deep: "#01579B",
    glow: "rgba(41, 182, 246, 0.15)",
  },
  // Amber
  {
    accent: "#FB8C00",
    light: "#FFA726",
    base: "#FB8C00",
    dark: "#EF6C00",
    deep: "#E65100",
    glow: "rgba(251, 140, 0, 0.15)",
  },
  // Rose
  {
    accent: "#EC407A",
    light: "#F06292",
    base: "#EC407A",
    dark: "#D81B60",
    deep: "#AD1457",
    glow: "rgba(236, 64, 122, 0.15)",
  },
  // Teal
  {
    accent: "#26A69A",
    light: "#4DB6AC",
    base: "#26A69A",
    dark: "#00897B",
    deep: "#00695C",
    glow: "rgba(38, 166, 154, 0.15)",
  },
];

/** Color identity for the Nth section (wraps around the palette). */
export function colorsForSection(index: number): SectionColors {
  return SECTION_PALETTE[index % SECTION_PALETTE.length];
}
