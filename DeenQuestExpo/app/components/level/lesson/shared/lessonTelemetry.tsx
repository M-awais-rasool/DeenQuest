// lessonTelemetry carries the current lesson's context (level, lesson index,
// skill tags) down to the shared FeedbackBanner so it can report each answer's
// correctness to the Learning Agent — without threading props through every
// individual task component. The player screens set the provider value; if no
// provider is present (e.g. a daily-task block), answer reporting is simply
// skipped.
import React, { createContext, useContext } from "react";

export type LessonTelemetry = {
  levelId?: number;
  lessonIndex?: number;
  courseType?: string;
  skillTags?: string[];
};

const LessonTelemetryContext = createContext<LessonTelemetry | null>(null);

export function LessonTelemetryProvider({
  value,
  children,
}: {
  value: LessonTelemetry;
  children: React.ReactNode;
}) {
  return (
    <LessonTelemetryContext.Provider value={value}>
      {children}
    </LessonTelemetryContext.Provider>
  );
}

export function useLessonTelemetry(): LessonTelemetry | null {
  return useContext(LessonTelemetryContext);
}
