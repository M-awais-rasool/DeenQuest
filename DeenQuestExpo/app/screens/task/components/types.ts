import type { DailyTask } from "../../../store/services/api";

export interface ComponentProps {
  task: DailyTask;
  onComplete: () => void;
  loading: boolean;
}
