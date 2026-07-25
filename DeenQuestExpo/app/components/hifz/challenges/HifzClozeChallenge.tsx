import React from "react";
import { ClozeBoard } from "./ClozeBoard";
import { referenceFor, type HifzChallengeProps } from "./types";
import type { HifzClozeToken } from "../../../store/services/api";

export function HifzClozeChallenge({
  challenge,
  allowHints,
  surahRef,
  onWrong,
  onDone,
}: HifzChallengeProps) {
  const tokens = (challenge.content.sentence ?? []) as HifzClozeToken[];
  const bank = (challenge.content.bank ?? []) as string[];
  const blanks = tokens.filter((t) => t.blank).length;

  return (
    <ClozeBoard
      tokens={tokens}
      bank={bank}
      allowHints={allowHints && challenge.content.allow_hints !== false}
      reference={referenceFor(surahRef, challenge.ayah_number)}
      title="Put the missing words back"
      subtitle={`${blanks === 1 ? "One word was" : `${blanks} words were`} removed from this ayah.`}
      onWrong={onWrong}
      onDone={onDone}
    />
  );
}

export function HifzFirstLetterChallenge({
  challenge,
  surahRef,
  onWrong,
  onDone,
}: HifzChallengeProps) {
  const tokens = (challenge.content.sentence ?? []) as HifzClozeToken[];
  const bank = (challenge.content.bank ?? []) as string[];

  return (
    <ClozeBoard
      tokens={tokens}
      bank={bank}
      allowHints={false}
      reference={referenceFor(surahRef, challenge.ayah_number)}
      title="Rebuild it from first letters"
      subtitle="Each gap shows only how its word begins."
      onWrong={onWrong}
      onDone={onDone}
    />
  );
}
