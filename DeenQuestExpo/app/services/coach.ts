export const COACH_PRACTICE_COURSE = "practice" as const;

export type CoachSeverity = "high" | "med" | "low";

export interface CoachInsight {
  id: string;
  /** Tile glyph — Arabic letters or an icon name handled by the screen. */
  glyph: string;
  glyphIsArabic: boolean;
  tileBg: string;
  tileFg: string;
  title: string;
  detail: string;
  severity: CoachSeverity;
  /** Practice CTA — omitted for observations that need no drill. */
  practiceMinutes?: number;
  practiceLevelId?: number;
  /** Shown when the "WHY?" button is pressed. */
  why?: string;
}

export interface CoachState {
  /** Header line under "Your Coach" on Home. */
  subtitle: string;
  /** Rich message parts for the Home card (Arabic rendered in Amiri). */
  message: {
    before: string;
    arabicA: string;
    middle: string;
    arabicB: string;
    after: string;
    highlight: string;
    tail: string;
  };
  fixMinutes: number;
  /** Top insight's id — needed to fetch/complete its practice drill. */
  insightId?: string;
  practiceLevelId: number;
  /** Suggested mission row injected into Daily Missions (G1). */
  suggestedMission: {
    title: string;
    subtitle: string;
    xp: number;
    levelId: number;
  };
  /** Mon..Sun accuracy 0–1; values < 0 mean "no data yet" (dashed bar). */
  weekAccuracy: number[];
  weekDeltaPct: number;
  lessonsAnalyzed: number;
  insights: CoachInsight[];
  /** Empty strings when no skill is mastered yet — hide the banner then. */
  win: { bold: string; middle: string; boldAccent: string; tail: string };
}

export function coachHasTopInsight(coach: CoachState): boolean {
  return !!coach.insightId && coach.practiceLevelId > 0;
}
