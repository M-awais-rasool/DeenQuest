import React from "react";
import type { ComponentProps } from "./types";

import { PrayerChecklistComponent } from "./PrayerChecklistComponent";
import { QuranReaderComponent } from "./QuranReaderComponent";
import { CounterComponent } from "./CounterComponent";
import { HadithComponent } from "./HadithComponent";
import { QuizComponent } from "./QuizComponent";
import { AudioPlayerComponent } from "./AudioPlayerComponent";
import { ReflectionComponent } from "./ReflectionComponent";
import { TipsComponent } from "./TipsComponent";
import { ActionComponent } from "./ActionComponent";

export type { ComponentProps } from "./types";
export { CompleteButton } from "./CompleteButton";
export { XPBadge, CategoryBadge } from "./TaskBadges";

export const COMPONENT_MAP: Record<string, React.FC<ComponentProps>> = {
  PrayerChecklistComponent,
  QuranReaderComponent,
  CounterComponent,
  HadithComponent,
  QuizComponent,
  AudioPlayerComponent,
  ReflectionComponent,
  TipsComponent,
  ActionComponent,
};
