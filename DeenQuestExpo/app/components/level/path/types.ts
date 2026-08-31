import type { LevelWithStatus, CourseType } from "../../../store/services/api";
import type { SectionColors } from "./sectionColors";

/** Roll-up status of a whole section, derived from its levels. */
export type SectionStatus = "locked" | "active" | "completed";

/**
 * A contiguous run of levels (10 by default) under one banner.
 *
 * The path itself no longer groups levels this way — it is one continuous
 * road — but the rewards and certificates screens still present progress in
 * sections, so the model outlived the list it was shaped for.
 */
export interface PathSection {
  /** Stable list key. */
  key: string;
  /** 0-based section index along the path. */
  index: number;
  /** 1-based number shown to the user ("Section 1"). */
  number: number;
  title: string;
  subtitle: string;
  /** Color identity shared by this section's banner, nodes and checkpoint. */
  colors: SectionColors;
  /** Absolute index of this section's first level within the whole path. */
  startIndex: number;
  status: SectionStatus;
  total: number;
  completed: number;
  courseType: CourseType;
  /** The levels in this section. */
  data: LevelWithStatus[];
}
