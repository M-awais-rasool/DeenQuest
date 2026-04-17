import React from "react";
import type { LessonComponentProps } from "./types";
import { LetterIntroComponent } from "./LetterIntroComponent";
import { PronunciationComponent } from "./PronunciationComponent";
import { DuaCardComponent } from "./DuaCardComponent";
import { HadithComponent } from "./HadithComponent";
import { QuizComponent } from "./QuizComponent";
import { TipsComponent } from "./TipsComponent";
import { LetterFormsComponent } from "./LetterFormsComponent";
import { QuranReaderComponent } from "./QuranReaderComponent";
import { ReflectionComponent } from "./ReflectionComponent";
import { PrayerChecklistComponent } from "./PrayerChecklistComponent";
import { CertificateComponent } from "./CertificateComponent";

export type LessonComponent = React.FC<LessonComponentProps>;

export const LESSON_COMPONENT_MAP: Record<string, LessonComponent> = {
  LetterIntroComponent,
  PronunciationComponent,
  DuaCardComponent,
  HadithComponent,
  QuizComponent,
  TipsComponent,
  LetterFormsComponent,
  QuranReaderComponent,
  ReflectionComponent,
  PrayerChecklistComponent,
  CertificateComponent,
};

export type { LessonComponentProps } from "./types";
