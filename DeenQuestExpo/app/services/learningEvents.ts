// learningEvents is a tiny, decoupled telemetry queue for the Learning Agent.
// Components call track.*(...) to record behavior; events are batched and flushed
// to POST /api/v1/events. It is fire-and-forget: failures are dropped silently so
// the UI is never blocked or affected by the learning pipeline.
import { store } from "../store/store";
import { API, type BehaviorEventInput } from "../store/services/api";

const FLUSH_INTERVAL_MS = 4000;
const MAX_BATCH = 20;

let queue: BehaviorEventInput[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

export function flushEvents(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  try {
    const res: any = store.dispatch(
      API.endpoints.logEvents.initiate({ events: batch })
    );
    // MutationActionCreatorResult is thenable; swallow any error.
    if (res?.unwrap) res.unwrap().catch(() => {});
  } catch {
    // ignore — telemetry must never throw into the UI
  }
}

function scheduleFlush() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    flushEvents();
  }, FLUSH_INTERVAL_MS);
}

export function trackEvent(event: BehaviorEventInput): void {
  queue.push(event);
  if (queue.length >= MAX_BATCH) {
    flushEvents();
  } else {
    scheduleFlush();
  }
}

type Opts = Partial<BehaviorEventInput>;

// Convenience wrappers for the common signals.
export const track = {
  sessionStart: () => trackEvent({ type: "session_start" }),
  taskStarted: (o: Opts = {}) => trackEvent({ type: "task_started", ...o }),
  taskCompleted: (o: Opts = {}) => trackEvent({ type: "task_completed", ...o }),
  taskAbandoned: (o: Opts = {}) => trackEvent({ type: "task_abandoned", ...o }),
  hintUsed: (o: Opts = {}) => trackEvent({ type: "hint_used", ...o }),
  timeSpent: (durationMs: number, o: Opts = {}) =>
    trackEvent({ type: "time_spent", duration_ms: durationMs, ...o }),
  answer: (correct: boolean, o: Opts = {}) =>
    trackEvent({
      type: correct ? "answer_correct" : "answer_wrong",
      correct,
      ...o,
    }),
};
