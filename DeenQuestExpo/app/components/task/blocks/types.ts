export interface BlockComponentProps {
  content: Record<string, any>;
  /** True when the parent task is already marked complete. */
  completed: boolean;
  loading: boolean;
  /** Called by interactive blocks (counter, checklist) when the user finishes. */
  onAutoComplete: () => void;
  /** Called by choice blocks (quiz/reflection) when the user makes a selection. */
  onReady: (ready: boolean) => void;
}
