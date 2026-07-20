import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createMMKV } from "react-native-mmkv";
import { API_BASE_URL } from "../store/services/api";
import { STORAGE_KEYS } from "../store/storage/authStorage";

export type TelemetryEventType =
  | "lesson_started"
  | "question_answered"
  | "lesson_completed"
  | "recitation_scored"
  | "session_end"
  | "coach_card_shown"
  | "coach_cta_tapped";

export interface TelemetryEvent {
  type: TelemetryEventType;
  /** Epoch millis — stamped by track() when omitted. */
  ts?: number;
  level_id?: number;
  lesson_index?: number;
  interaction?: string;
  skill_tags?: string[];
  correct?: boolean;
  expected?: string;
  chosen?: string;
  attempt?: number;
  latency_ms?: number;
}

const FLUSH_AT = 20; // queue length that forces a flush
const FLUSH_INTERVAL_MS = 15_000;
const MAX_QUEUE = 500; // hard cap — oldest events drop first
const MAX_BATCH = 100; // events per POST (server caps at 200)

const storage = createMMKV({ id: "telemetry" });
const QUEUE_KEY = "queue";
const PENDING_KEY = "pending"; // batch cut but not yet acked (with its key)

interface PendingBatch {
  idempotency_key: string;
  events: TelemetryEvent[];
}

function readJSON<T>(key: string): T | null {
  try {
    const raw = storage.getString(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown | null) {
  if (value === null) {
    storage.remove(key);
    return;
  }
  storage.set(key, JSON.stringify(value));
}

function newIdempotencyKey(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

let timer: ReturnType<typeof setInterval> | null = null;
let flushing = false;
let started = false;

function ensureStarted() {
  if (started) return;
  started = true;
  timer = setInterval(() => {
    void flush();
  }, FLUSH_INTERVAL_MS);
  AppState.addEventListener("change", (state) => {
    if (state === "background" || state === "inactive") {
      void flush();
    }
  });
}

/** Queue one event. Synchronous and safe to call from render handlers. */
export function track(event: TelemetryEvent) {
  ensureStarted();
  const queue = readJSON<TelemetryEvent[]>(QUEUE_KEY) ?? [];
  queue.push({ ...event, ts: event.ts ?? Date.now() });
  while (queue.length > MAX_QUEUE) queue.shift();
  writeJSON(QUEUE_KEY, queue);
  if (queue.length >= FLUSH_AT) {
    void flush();
  }
}

export async function flush(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    // 1. Retry a previously cut batch first (same key ⇒ server dedupes).
    const pending = readJSON<PendingBatch>(PENDING_KEY);
    if (pending) {
      if (!(await send(pending))) return;
      writeJSON(PENDING_KEY, null);
    }

    // 2. Cut the live queue into a new batch.
    const queue = readJSON<TelemetryEvent[]>(QUEUE_KEY) ?? [];
    if (queue.length === 0) return;
    const batch: PendingBatch = {
      idempotency_key: newIdempotencyKey(),
      events: queue.slice(0, MAX_BATCH),
    };
    // Persist batch + remainder BEFORE sending so a crash can't double-send.
    writeJSON(PENDING_KEY, batch);
    writeJSON(QUEUE_KEY, queue.slice(batch.events.length));

    if (await send(batch)) {
      writeJSON(PENDING_KEY, null);
    }
  } finally {
    flushing = false;
  }
}

async function send(batch: PendingBatch): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.accessToken);
    if (!token) return false; // not logged in — keep events for later

    const res = await fetch(`${API_BASE_URL}/api/v1/telemetry/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(batch),
    });
    if (res.status >= 400 && res.status < 500 && res.status !== 429) {
      return res.status !== 401; // on 401 keep the batch — token may refresh
    }
    return res.ok;
  } catch {
    return false; // offline — the batch stays pending
  }
}

/* ── Convenience emitters (keep call sites one-liners) ── */

export function trackLessonStarted(levelId: number, lessonIndex: number) {
  track({ type: "lesson_started", level_id: levelId, lesson_index: lessonIndex });
}

export function trackLessonCompleted(levelId: number, lessonIndex: number) {
  track({
    type: "lesson_completed",
    level_id: levelId,
    lesson_index: lessonIndex,
  });
}

export interface AnswerEvent {
  interaction: "choice" | "hunt" | "match" | "sequence" | "sort" | "blank";
  skillTags?: string[];
  correct: boolean;
  /** Arabic tokens for confusion tracking (choice/hunt with a wrong pick). */
  expected?: string;
  chosen?: string;
  attempt?: number;
  latencyMs?: number;
  levelId?: number;
  lessonIndex?: number;
}

export function trackAnswer(a: AnswerEvent) {
  track({
    type: "question_answered",
    level_id: a.levelId,
    lesson_index: a.lessonIndex,
    interaction: a.interaction,
    skill_tags: a.skillTags,
    correct: a.correct,
    expected: a.expected,
    chosen: a.chosen,
    attempt: a.attempt,
    latency_ms: a.latencyMs,
  });
}

export function trackCoachCardShown() {
  track({ type: "coach_card_shown" });
}

export function trackCoachCTATapped() {
  track({ type: "coach_cta_tapped" });
}
