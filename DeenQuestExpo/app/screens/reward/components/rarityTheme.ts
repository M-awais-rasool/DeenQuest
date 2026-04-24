import { theme } from "../../../theme/themes";

export type RarityTheme = {
  accent: string;
  border: string;
  iconBg: string;
  iconColor: string;
  pillBg: string;
  pillText: string;
};

const RARITY: Record<string, RarityTheme> = {
  legendary: {
    accent: theme.colors.secondary,
    border: theme.colors.secondary30,
    iconBg: theme.colors.secondary10,
    iconColor: theme.colors.secondary,
    pillBg: theme.colors.secondary15,
    pillText: theme.colors.secondary,
  },
  epic: {
    accent: theme.colors.primary,
    border: theme.colors.primary25,
    iconBg: theme.colors.primary10,
    iconColor: theme.colors.primary,
    pillBg: theme.colors.primary12,
    pillText: theme.colors.primary,
  },
  rare: {
    accent: theme.colors.cyan,
    border: "rgba(79,195,247,0.25)",
    iconBg: "rgba(79,195,247,0.1)",
    iconColor: theme.colors.cyan,
    pillBg: "rgba(79,195,247,0.12)",
    pillText: theme.colors.cyan,
  },
};

export function rarityTheme(rarity: string): RarityTheme {
  return RARITY[rarity] ?? RARITY.rare;
}

export function formatTrigger(trigger: string, required: number): string {
  if (trigger === "levels_completed") return `Complete ${required} levels`;
  if (trigger === "xp") return `Earn ${required.toLocaleString()} XP`;
  return `Maintain a ${required}-day streak`;
}
