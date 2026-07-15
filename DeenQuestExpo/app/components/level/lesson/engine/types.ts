export const ENGINE_VERSION = 1;

export const INTERACTIONS = [
  "teach",
  "choice",
  "match",
  "sequence",
  "sort",
  "hunt",
  "steps",
  "record",
  "blank",
] as const;

export type Interaction = (typeof INTERACTIONS)[number];

export function isInteraction(value: unknown): value is Interaction {
  return (
    typeof value === "string" && (INTERACTIONS as readonly string[]).includes(value)
  );
}

/** One question/round inside `content.rounds` (choice-family interactions). */
export interface DSLRound {
  prompt?: string;
  /** Arabic display glyph (binary layout / true-false rounds). */
  arabic?: string;
  /** Boolean answer for binary rounds. */
  answer?: boolean;
  options?: string[];
  /** Index into options. Absent = no wrong answer (reflection). */
  correct?: number;
  skill_tags?: string[];
  /** TTS prompt — a round with audio becomes listen-&-choose. */
  audio?: string | null;
}

export interface DSLPresentation {
  layout?: string;
  glyph_size?: string;
  accent?: string;
}

export interface DSLModifiers {
  timed_seconds?: number;
  rounds?: boolean;
  hints?: boolean;
  celebration?: boolean;
}

export interface DSLScoring {
  xp?: number;
  pass_threshold?: number;
}

export interface LessonDSL {
  interaction: string;
  presentation?: DSLPresentation;
  modifiers?: DSLModifiers;
  content: Record<string, any> & { rounds?: DSLRound[] };
  scoring?: DSLScoring;
  min_engine_version?: number;
}

export function parseLessonDSL(data: unknown): LessonDSL | null {
  if (!data || typeof data !== "object") return null;
  const doc = data as Record<string, any>;
  if (typeof doc.interaction !== "string") return null;
  if (!doc.content || typeof doc.content !== "object") return null;
  return doc as LessonDSL;
}
