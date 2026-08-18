import { dq } from "../../theme/designTokens";

export const CHALLENGE_ACCENTS = {
  gold: { tile: dq.goldTint, fg: dq.gold, bar: dq.gold },
  teal: { tile: dq.greenTint, fg: dq.greenBright, bar: dq.green },
  violet: { tile: "#2A2440", fg: "#C4B2FF", bar: "#A78BFA" },
  pink: { tile: "#3A2030", fg: "#F8A9CC", bar: "#F27FB2" },
  blue: { tile: "#16303E", fg: "#6EC1E8", bar: "#4FA8D8" },
} as const;

export type AccentName = keyof typeof CHALLENGE_ACCENTS;

export const PURPLE = "#A78BFA";
export const PURPLE_LIGHT = "#C4B2FF";
export const PURPLE_DARK = "#241A45";

export function accentOf(name: string) {
  return CHALLENGE_ACCENTS[name as AccentName] ?? CHALLENGE_ACCENTS.teal;
}

export const AVATAR_GRADIENTS: [string, string][] = [
  ["#2CC9B5", "#EFB65A"],
  ["#6EC1E8", "#A78BFA"],
  ["#F79A59", "#F27FB2"],
  ["#5EE0CE", "#4FA8D8"],
  ["#EFB65A", "#F27FB2"],
];

export const AVATAR_FOREGROUNDS = ["#06302B", "#0E2A3A", "#3A1024", "#06302B", "#3A2A08"];

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "ending soon";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${Math.max(minutes, 1)}m`;
}

export function metricLabel(metric: string, amount: number): string {
  const unit =
    metric === "xp"
      ? "XP"
      : metric === "lessons"
        ? amount === 1 ? "lesson" : "lessons"
        : metric === "tasks"
          ? amount === 1 ? "mission" : "missions"
          : metric === "hifz"
            ? amount === 1 ? "portion" : "portions"
            : metric === "recitations"
              ? amount === 1 ? "recitation" : "recitations"
              : amount === 1 ? "encouragement" : "encouragements";
  return `${amount} ${unit}`;
}
