export const home = {
  night: "#011E23",
  card: "#03222C",
  ridgeCard: "#0A3A42",
  cardBorder: "rgba(45, 110, 124, 0.45)",
  well: "rgba(4, 22, 28, 0.75)",
  wellBorder: "rgba(255, 255, 255, 0.06)",
  divider: "rgba(255, 255, 255, 0.11)",

  teal: "#2FE3D0",
  tealBright: "#5EF3E6",
  tealDeep: "#0C3F46",
  gold: "#F2C36B",
  goldBright: "#F8F0B1",

  text: "#FFFFFF",
  soft: "#C7DDE3",
  muted: "#8FB0B8",

  track: "rgba(2, 24, 30, 0.7)",

  radius: 18,
  gutter: 18,
} as const;

export const CATEGORY_TILE: Record<string, [string, string]> = {
  coach: ["#3BEDE2", "#0B6F73"],
  quran: ["#12A79F", "#0A4F57"],
  learning: ["#2E8FD8", "#10416E"],
  salah: ["#8A7AE8", "#3A3470"],
  dhikr: ["#E0A64F", "#6A4413"],
  character: ["#E874A8", "#6A2745"],
  reflection: ["#4FC3E8", "#14465C"],
  social: ["#46CFA0", "#124C3C"],
};

export const DEFAULT_TILE: [string, string] = ["#12A79F", "#0A4F57"];

export function tileFor(category: string): [string, string] {
  return CATEGORY_TILE[category] ?? DEFAULT_TILE;
}
