import type { LevelWithStatus, CourseType } from "../../../store/services/api";
import type { SectionColors } from "../map/constants";

/** Roll-up status of a whole section, derived from its levels. */
export type SectionStatus = "locked" | "active" | "completed";

/**
 * One section of the learning path: a contiguous run of levels (10 by
 * default) presented under a single banner. The shape matches what
 * `SectionList` expects (`data` holds the rows), with extra metadata used by
 * the header, checkpoint and node coloring.
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
  /** The levels in this section — `SectionList` renders these as rows. */
  data: LevelWithStatus[];
}

/** A position inside the sectioned list (used for auto-scroll). */
export interface PathLocation {
  sectionIndex: number;
  itemIndex: number;
}
