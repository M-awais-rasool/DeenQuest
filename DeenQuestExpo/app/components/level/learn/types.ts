import type { LucideIcon } from "lucide-react-native";
import type { CourseType } from "../../../store/services/api";

export type CourseStatus = "available" | "locked";

export type CourseConfig = {
  id: string;
  courseType?: CourseType;
  title: string;
  subtitle: string;
  levelCount: string;
  accentColor: string;
  /** Darker shade of accentColor used for 3-D extrusion */
  depthColor: string;
  /** Subtle tint applied to the card background when available */
  cardTint: string;
  /** Glow ring color shown behind the 3-D box for available courses */
  glowColor: string;
  Icon: LucideIcon;
  status: CourseStatus;
};
