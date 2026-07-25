import type { ComponentType } from "react";
import {
  HifzClozeChallenge,
  HifzFirstLetterChallenge,
} from "./HifzClozeChallenge";
import { HifzFadeChallenge } from "./HifzFadeChallenge";
import { HifzOrderChallenge } from "./HifzOrderChallenge";
import { HifzNextAyahChallenge } from "./HifzNextAyahChallenge";
import type { HifzChallengeProps } from "./types";

export const CHALLENGE_REGISTRY: Record<
  string,
  ComponentType<HifzChallengeProps>
> = {
  HifzClozeChallenge,
  HifzFadeChallenge,
  HifzFirstLetterChallenge,
  HifzOrderChallenge,
  HifzNextAyahChallenge,
};

export function resolveChallenge(component: string) {
  return CHALLENGE_REGISTRY[component] ?? null;
}
