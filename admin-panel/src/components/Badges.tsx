import type { ContentStatus } from "../types";

const statusClasses: Record<ContentStatus, string> = {
  draft: "dq-badge-medium",
  published: "dq-badge-easy",
  archived: "dq-badge-neutral",
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span className={`dq-badge ${statusClasses[status] ?? "dq-badge-neutral"}`}>
      {status}
    </span>
  );
}

const difficultyClasses: Record<string, string> = {
  easy: "dq-badge-easy",
  medium: "dq-badge-medium",
  hard: "dq-badge-hard",
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <span
      className={`dq-badge capitalize ${
        difficultyClasses[difficulty] ?? "dq-badge-neutral"
      }`}
    >
      {difficulty || "—"}
    </span>
  );
}

/** Neutral pill used for categories and other free-form tags. */
export function TagBadge({ label }: { label: string }) {
  return (
    <span className="dq-badge dq-badge-neutral capitalize">{label || "—"}</span>
  );
}
