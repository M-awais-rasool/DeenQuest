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
import { MCQComponent } from "./MCQComponent";
import { FillBlankComponent } from "./FillBlankComponent";
import { AyahBuilderComponent } from "./AyahBuilderComponent";
import { MatchPairsComponent } from "./MatchPairsComponent";
import { ListenChooseComponent } from "./ListenChooseComponent";
import { TrueFalseComponent } from "./TrueFalseComponent";
import { LetterHuntComponent } from "./LetterHuntComponent";
import { SortBucketsComponent } from "./SortBucketsComponent";
import { LightningRoundComponent } from "./LightningRoundComponent";

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
  // New interactive task types
  MCQComponent,
  FillBlankComponent,
  AyahBuilderComponent,
  MatchPairsComponent,
  ListenChooseComponent,
  TrueFalseComponent,
  LetterHuntComponent,
  SortBucketsComponent,
  LightningRoundComponent,
};

export type { LessonComponentProps } from "./types";
