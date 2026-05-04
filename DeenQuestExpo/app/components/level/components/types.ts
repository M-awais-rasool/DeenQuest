import React from "react";
import type { Lesson } from "../../../store/services/api";

export interface LessonComponentProps {
  lesson: Lesson;
  onComplete: () => void;
  /** Provided when rendered inside LessonPlayerScreen for recitation navigation */
  levelId?: number;
  lessonIndex?: number;
}
