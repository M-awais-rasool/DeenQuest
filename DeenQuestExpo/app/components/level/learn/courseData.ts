import {
  BookOpen,
  Star,
  Feather,
  ScrollText,
} from "lucide-react-native";
import { theme } from "../../../theme/themes";
import type { CourseConfig } from "./types";

export const COURSES: CourseConfig[] = [
  {
    id: "qaida",
    courseType: "qaida",
    title: "Noorani Qaida",
    subtitle: "Arabic Alphabet to Quran",
    levelCount: "20 Levels",
    accentColor: theme.colors.primary,
    depthColor: "#3a7a35",
    cardTint: theme.colors.primary12,
    glowColor: theme.colors.primary25,
    Icon: BookOpen,
    status: "available",
  },
  {
    id: "memorization",
    title: "Memorization",
    subtitle: "Key Surahs by Heart",
    levelCount: "Coming Soon",
    accentColor: "#FFDB3C",
    depthColor: "#b89800",
    cardTint: "rgba(255,219,60,0.10)",
    glowColor: "rgba(255,219,60,0.22)",
    Icon: Star,
    status: "locked",
  },
  {
    id: "arabic",
    title: "Quranic Arabic",
    subtitle: "Language & Meaning",
    levelCount: "Coming Soon",
    accentColor: "#B39DDB",
    depthColor: "#6646aa",
    cardTint: "rgba(179,157,219,0.10)",
    glowColor: "rgba(179,157,219,0.22)",
    Icon: Feather,
    status: "locked",
  },
  {
    id: "hadith",
    title: "Hadith Studies",
    subtitle: "Prophetic Traditions",
    levelCount: "Coming Soon",
    accentColor: "#FF8A65",
    depthColor: "#bf4a1e",
    cardTint: "rgba(255,138,101,0.10)",
    glowColor: "rgba(255,138,101,0.22)",
    Icon: ScrollText,
    status: "locked",
  },
];

/** Map from course id → navigation route name (extend as new courses unlock) */
export const COURSE_ROUTE_MAP: Record<string, string> = {
  qaida: "LevelMap",
};
