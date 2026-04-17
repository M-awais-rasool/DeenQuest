import React from "react";
import type { Lesson } from "../../../store/services/api";

export interface LessonComponentProps {
  lesson: Lesson;
  onComplete: () => void;
}
