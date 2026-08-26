import { createMMKV } from "react-native-mmkv";
import type { CourseType } from "../services/api";
import {
  DEFAULT_COURSE,
  isKnownCourse,
} from "../../components/level/path/courseCatalog";

const storage = createMMKV({ id: "path" });
const SELECTED_COURSE_KEY = "selectedCourse";

export function loadSelectedCourse(): CourseType {
  try {
    const raw = storage.getString(SELECTED_COURSE_KEY) ?? null;
    return isKnownCourse(raw) ? raw : DEFAULT_COURSE;
  } catch {
    return DEFAULT_COURSE;
  }
}

export function saveSelectedCourse(courseType: CourseType): void {
  try {
    storage.set(SELECTED_COURSE_KEY, courseType);
  } catch {
  }
}
