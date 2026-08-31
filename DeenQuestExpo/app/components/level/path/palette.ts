import type { SectionColors } from "./sectionColors";

export const QAIDA_PALETTE: SectionColors[] = [
  {
    accent: "#2CC9B5",
    light: "#2CC9B5",
    base: "#2CC9B5",
    dark: "#1B9484",
    deep: "#06302B",
    glow: "rgba(44, 201, 181, 0.15)",
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
  // Violet
  {
    accent: "#A78BFA",
    light: "#A78BFA",
    base: "#A78BFA",
    dark: "#7B5BD6",
    deep: "#241A45",
    glow: "rgba(167, 139, 250, 0.15)",
  },
  // Cornflower
  {
    accent: "#5B8DEF",
    light: "#5B8DEF",
    base: "#5B8DEF",
    dark: "#3A67C4",
    deep: "#101E42",
    glow: "rgba(91, 141, 239, 0.15)",
  },
  // Mint
  {
    accent: "#5EE0CE",
    light: "#5EE0CE",
    base: "#5EE0CE",
    dark: "#2CC9B5",
    deep: "#06302B",
    glow: "rgba(94, 224, 206, 0.15)",
  },
  // Periwinkle
  {
    accent: "#8C9EFF",
    light: "#8C9EFF",
    base: "#8C9EFF",
    dark: "#6474D6",
    deep: "#1A1F45",
    glow: "rgba(140, 158, 255, 0.15)",
  },
];

export const NAMAZ_PALETTE: SectionColors[] = [
  {
    accent: "#EFB65A",
    light: "#EFB65A",
    base: "#EFB65A",
    dark: "#C98F35",
    deep: "#3A2A08",
    glow: "rgba(239, 182, 90, 0.15)",
  },
  // Saffron
  {
    accent: "#F0913F",
    light: "#F0913F",
    base: "#F0913F",
    dark: "#C56D22",
    deep: "#3A2205",
    glow: "rgba(240, 145, 63, 0.15)",
  },
  // Terracotta
  {
    accent: "#E2705A",
    light: "#E2705A",
    base: "#E2705A",
    dark: "#B84E3A",
    deep: "#3A1409",
    glow: "rgba(226, 112, 90, 0.15)",
  },
  // Clay rose
  {
    accent: "#D46A80",
    light: "#D46A80",
    base: "#D46A80",
    dark: "#AC4A5F",
    deep: "#3A0F1A",
    glow: "rgba(212, 106, 128, 0.15)",
  },
  // Warm plum
  {
    accent: "#B87BA8",
    light: "#B87BA8",
    base: "#B87BA8",
    dark: "#925A84",
    deep: "#2E1329",
    glow: "rgba(184, 123, 168, 0.15)",
  },
  // Deep amber
  {
    accent: "#C68A3C",
    light: "#C68A3C",
    base: "#C68A3C",
    dark: "#9E6A24",
    deep: "#33210A",
    glow: "rgba(198, 138, 60, 0.15)",
  },
];

export const SECTION_PALETTE = QAIDA_PALETTE;

export function colorsForSection(
  index: number,
  palette: SectionColors[] = SECTION_PALETTE,
): SectionColors {
  return palette[index % palette.length];
}
