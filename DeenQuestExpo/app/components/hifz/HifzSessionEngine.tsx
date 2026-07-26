import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { OutlineButton, hz } from "./ui";
import { ListenStage } from "./ListenStage";
import { ShadowStage } from "./ShadowStage";
import { ReciteStage } from "./ReciteStage";
import { resolveChallenge } from "./challenges/registry";
import type { ChallengeOutcome } from "./challenges/types";
import {
  useSubmitHifzStageMutation,
  type HifzQueue,
  type HifzSessionView,
  type HifzStage,
} from "../../store/services/api";

export interface SessionHeaderMeta {
  tag?: { label: string; bg: string; color: string };
  title: string;
  sub?: string;
  hearts?: number;
  railLabels?: boolean;
}

const QUEUE_TAGS: Record<HifzQueue, { label: string; bg: string; color: string }> = {
  sabaq: { label: "SABAQ", bg: hz.violetTint, color: hz.violetBright },
  sabqi: { label: "SABQI", bg: hz.tealTint, color: hz.tealBright },
  manzil: { label: "MANZIL", bg: hz.goldTint, color: hz.gold },
};

const KIND_LABELS: Record<string, string> = {
  cloze_word: "Fill the Gaps",
  ayah_order: "Put in Order",
  progressive_fade: "Fading Ayah",
  next_ayah: "What Comes Next",
  first_letter: "First Letters",
};

export function HifzSessionEngine({
  view,
  reciterName,
  onStageChange,
  onMeta,
  onFinished,
}: {
  view: HifzSessionView;
  reciterName: string;
  onStageChange?: (stage: HifzStage) => void;
  onMeta?: (meta: SessionHeaderMeta) => void;
  onFinished: () => void;
}) {
  const [stage, setStageRaw] = useState<HifzStage>(view.session.stage);
  const [challengeIdx, setChallengeIdx] = useState(view.session.challenge_idx);
  const [hearts, setHearts] = useState(3);
  const [resultMeta, setResultMeta] = useState<SessionHeaderMeta | null>(null);
  const [submitStage] = useSubmitHifzStageMutation();

  const { session, rules, ayahs } = view;
  const challenges = session.challenges ?? [];
  const queue = session.queue;

  const surahEnglish = session.portion.label.split("·")[0]?.trim() ?? "";
  const surahRef = useMemo(
    () => ({ englishName: surahEnglish, surahId: session.portion.surah_id }),
    [surahEnglish, session.portion.surah_id],
  );

  const setStage = useCallback(
    (next: HifzStage) => {
      setStageRaw(next);
      onStageChange?.(next);
    },
    [onStageChange],
  );

  const currentChallenge = challenges[challengeIdx];
  useEffect(() => {
    if (!onMeta) return;
    if (resultMeta) {
      onMeta(resultMeta);
      return;
    }
    const portion = session.portion.label;
    switch (stage) {
      case "listen":
        onMeta({ tag: QUEUE_TAGS[queue], title: "Listen", sub: portion, railLabels: true });
        break;
      case "shadow":
        onMeta({ tag: QUEUE_TAGS[queue], title: "Repeat", sub: portion });
        break;
      case "open_recite":
        onMeta({ tag: QUEUE_TAGS[queue], title: "Recite · open mushaf", sub: portion });
        break;
      case "blind_recite":
        onMeta({
          tag: { label: "FINAL", bg: hz.goldTint, color: hz.gold },
          title: "Recite from memory",
          sub: `${portion} · text hidden`,
        });
        break;
      case "challenges": {
        const kind = currentChallenge?.kind ?? "";
        onMeta({
          tag: {
            label: `CHALLENGE ${Math.min(challengeIdx + 1, challenges.length)}/${challenges.length}`,
            bg: hz.violetTint,
            color: hz.violetBright,
          },
          title: KIND_LABELS[kind] ?? currentChallenge?.title ?? "Challenge",
          sub:
            kind === "progressive_fade"
              ? "The same ayah, less each time"
              : kind === "next_ayah"
                ? undefined
                : portion,
          hearts,
        });
        break;
      }
      default:
        onMeta({ tag: QUEUE_TAGS[queue], title: "Done", sub: portion });
    }
  }, [
    stage,
    challengeIdx,
    hearts,
    resultMeta,
    onMeta,
    queue,
    session.portion.label,
    challenges.length,
    currentChallenge,
  ]);

  const loseHeart = useCallback(() => setHearts((h) => Math.max(0, h - 1)), []);

  // ── submissions ─────────────────────────────────────────────────────────────
  const submittingRef = useRef(false);
  const advance = useCallback(
    async (
      submitted: HifzStage,
      outcome: ChallengeOutcome,
      challengeType?: string,
    ) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      try {
        const res = await submitStage({
          sessionId: session.id,
          stage: submitted,
          challenge_type: challengeType,
          raw_score: outcome.rawScore,
          hints_used: outcome.hintsUsed,
          latency_ms: outcome.latencyMs,
        }).unwrap();

        const next = res.data;
        if (!next || next.stage === "sealed") {
          onFinished();
          return;
        }
        setChallengeIdx(next.challenge_idx);
        setStage(next.stage as HifzStage);
      } catch {
        // A dropped submission must not trap the learner mid-session.
        onFinished();
      } finally {
        submittingRef.current = false;
      }
    },
    [session.id, submitStage, onFinished, setStage],
  );

  const ChallengeComponent = useMemo(
    () => (currentChallenge ? resolveChallenge(currentChallenge.component) : null),
    [currentChallenge],
  );

  const handleResultView = useCallback(
    (showing: boolean, ayahNumber?: number) => {
      if (!showing) {
        setResultMeta(null);
        return;
      }
      setResultMeta({
        title: "How you did",
        sub: `${surahEnglish} ${ayahNumber ?? ""} · ${
          stage === "blind_recite" ? "from memory" : "open mushaf"
        }`.trim(),
      });
    },
    [surahEnglish, stage],
  );

  switch (stage) {
    case "listen":
      return (
        <ListenStage
          surahId={session.portion.surah_id}
          ayahs={ayahs}
          repeats={rules.listen_repeats}
          reciterName={reciterName}
          reciterId={view.reciter_id}
          onDone={() =>
            advance("listen", { rawScore: 100, hintsUsed: 0, latencyMs: 0 })
          }
        />
      );

    case "shadow":
      return (
        <ShadowStage
          surahId={session.portion.surah_id}
          ayahs={ayahs}
          reciterId={view.reciter_id}
          onDone={() =>
            advance("shadow", { rawScore: 100, hintsUsed: 0, latencyMs: 0 })
          }
        />
      );

    case "open_recite":
      return (
        <ReciteStage
          sessionId={session.id}
          ayahs={ayahs}
          blind={false}
          passScore={rules.open_recite_pass}
          onResultView={handleResultView}
          onDone={(next) => (next === "sealed" ? onFinished() : setStage(next))}
        />
      );

    case "blind_recite":
      return (
        <ReciteStage
          sessionId={session.id}
          ayahs={ayahs}
          blind
          passScore={rules.blind_recite_pass}
          onResultView={handleResultView}
          onDone={() => onFinished()}
        />
      );

    case "challenges": {
      if (!currentChallenge) {
        return (
          <StageFallback
            title="No challenges for this portion"
            body="This portion is too short to build drills from. Move on to reciting it."
            action="CONTINUE"
            onPress={() =>
              advance("challenges", { rawScore: 100, hintsUsed: 0, latencyMs: 0 })
            }
          />
        );
      }
      if (!ChallengeComponent) {
        return (
          <StageFallback
            title="Update needed"
            body={`This session includes a "${currentChallenge.kind}" challenge your app version can't show yet.`}
            action="SKIP THIS ONE"
            onPress={() =>
              advance(
                "challenges",
                { rawScore: 0, hintsUsed: 0, latencyMs: 0 },
                currentChallenge.kind,
              )
            }
          />
        );
      }
      return (
        <ChallengeComponent
          key={currentChallenge.id}
          challenge={currentChallenge}
          allowHints={rules.allow_hints}
          surahRef={surahRef}
          onWrong={loseHeart}
          onDone={(outcome) =>
            advance("challenges", outcome, currentChallenge.kind)
          }
        />
      );
    }

    default:
      return (
        <StageFallback
          title="All done"
          body="This portion is finished."
          action="SEE RESULTS"
          onPress={onFinished}
        />
      );
  }
}

function StageFallback({
  title,
  body,
  action,
  onPress,
}: {
  title: string;
  body: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View style={s.fallback}>
      <Text style={s.fallbackTitle}>{title}</Text>
      <Text style={s.fallbackBody}>{body}</Text>
      <OutlineButton label={action} onPress={onPress} style={{ marginTop: 18 }} />
    </View>
  );
}

const s = StyleSheet.create({
  fallback: { flex: 1, justifyContent: "center", paddingHorizontal: 8 },
  fallbackTitle: {
    fontFamily: "Nunito_900Black",
    fontSize: 18,
    color: hz.text,
    textAlign: "center",
  },
  fallbackBody: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    lineHeight: 20,
    color: hz.muted,
    textAlign: "center",
    marginTop: 8,
  },
});
