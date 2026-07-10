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
  // Teal — the new-brand primary; the first section keeps the brand look.
  {
    accent: "#2CC9B5",
    light: "#2CC9B5",
    base: "#2CC9B5",
    dark: "#1B9484",
    deep: "#06302B",
    glow: "rgba(44, 201, 181, 0.15)",
  },
  // Violet
  {
    accent: "#A78BFA",
    light: "#A78BFA",
    base: "#A78BFA",
    dark: "#7B5BD6",
    deep: "#241A45",
    glow: "rgba(167, 139, 250, 0.15)",
  },
  // Sky
  {
    accent: "#6EC1E8",
    light: "#6EC1E8",
    base: "#6EC1E8",
    dark: "#3E8AB3",
    deep: "#0E2A3A",
    glow: "rgba(110, 193, 232, 0.15)",
  },
  // Gold
  {
    accent: "#EFB65A",
    light: "#EFB65A",
    base: "#EFB65A",
    dark: "#C98F35",
    deep: "#3A2A08",
    glow: "rgba(239, 182, 90, 0.15)",
  },
  // Rose
  {
    accent: "#F27FB2",
    light: "#F27FB2",
    base: "#F27FB2",
    dark: "#C25E8E",
    deep: "#3A1024",
    glow: "rgba(242, 127, 178, 0.15)",
  },
  // Deep teal
  {
    accent: "#5EE0CE",
    light: "#5EE0CE",
    base: "#5EE0CE",
    dark: "#2CC9B5",
    deep: "#06302B",
    glow: "rgba(94, 224, 206, 0.15)",
  },
];

/** Color identity for the Nth section (wraps around the palette). */
export function colorsForSection(index: number): SectionColors {
  return SECTION_PALETTE[index % SECTION_PALETTE.length];
}
