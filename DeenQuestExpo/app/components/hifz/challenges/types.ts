import type { HifzChallenge } from "../../../store/services/api";

export interface ChallengeOutcome {
  rawScore: number;
  hintsUsed: number;
  latencyMs: number;
}

export interface HifzChallengeProps {
  challenge: HifzChallenge;
  allowHints: boolean;
  surahRef?: { englishName: string; surahId: number };
  onWrong?: () => void;
  onDone: (outcome: ChallengeOutcome) => void;
}

export function referenceFor(
  surahRef: HifzChallengeProps["surahRef"],
  ayahNumber?: number,
): string | undefined {
  if (!surahRef || !ayahNumber) return undefined;
  return `${surahRef.englishName.toUpperCase()} · ${surahRef.surahId}:${ayahNumber}`;
}
