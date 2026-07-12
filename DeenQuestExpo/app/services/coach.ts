export const COACH_PRACTICE_LEVEL_ID = 33;

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
  win: { bold: string; middle: string; boldAccent: string; tail: string };
}

const MOCK_STATE: CoachState = {
  subtitle: "Watched your last 3 lessons",
  message: {
    before: "I noticed you mix up ",
    arabicA: "ت",
    middle: " and ",
    arabicB: "ث",
    after: " — it happened ",
    highlight: "4 times",
    tail: " this week. The dots are the key!",
  },
  fixMinutes: 2,
  practiceLevelId: COACH_PRACTICE_LEVEL_ID,
  suggestedMission: {
    title: "Coach practice: ت vs ث",
    subtitle: "Suggested for you",
    xp: 15,
    levelId: COACH_PRACTICE_LEVEL_ID,
  },
  weekAccuracy: [0.52, 0.6, 0.46, 0.7, 0.78, 0.88, -1],
  weekDeltaPct: 9,
  lessonsAnalyzed: 14,
  insights: [
    {
      id: "ta-tha",
      glyph: "ت‌ث",
      glyphIsArabic: true,
      tileBg: "#3D2A14",
      tileFg: "#F79A59",
      title: "Mixing up Ta & Tha",
      detail: "4 mistakes · mostly in Letter Hunt",
      severity: "high",
      practiceMinutes: 2,
      practiceLevelId: COACH_PRACTICE_LEVEL_ID,
      why: "Ta (ت) has two dots, Tha (ث) has three. In fast rounds you tapped Ta whenever you saw dots on top — slowing down to count the dots fixes it.",
    },
    {
      id: "madd",
      glyph: "mic",
      glyphIsArabic: false,
      tileBg: "#3D2A14",
      tileFg: "#F79A59",
      title: "Rushing long vowels (madd)",
      detail: "Pace score drops on آ words",
      severity: "med",
      practiceMinutes: 3,
      practiceLevelId: COACH_PRACTICE_LEVEL_ID,
      why: "A madd letter stretches the sound to two counts. Your recordings average 0.8 counts on آ — try holding it twice as long.",
    },
    {
      id: "ha-final",
      glyph: "ـه",
      glyphIsArabic: true,
      tileBg: "#2A2440",
      tileFg: "#C4B2FF",
      title: "Final-form Ha shapes",
      detail: "2 slips · improving steadily",
      severity: "low",
    },
  ],
  win: {
    bold: "Ba",
    middle: " pronunciation is now ",
    boldAccent: "95% accurate",
    tail: " — mastered!",
  },
};

/**
 * Mock activation rule: the coach "wakes up" once the user has actually done
 * something (any daily task completed or any XP earned). Brand-new users get
 * the plain B1 Home.
 */
export function getMockCoachState({
  xp,
  completedTasks,
}: {
  xp: number;
  completedTasks: number;
}): CoachState | null {
  if (xp <= 0 && completedTasks <= 0) return null;
  return MOCK_STATE;
}
