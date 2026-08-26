import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Volume2 } from "lucide-react-native";
import { TactilePressable } from "../../ui";
import { theme } from "../../../theme/themes";
import { Speech } from "../../../utils/speech";
import { useQuranFont } from "../../../hooks/useQuranFont";
import type { LessonComponentProps } from "./types";
import { FadeInView, ContinueButton } from "./shared";
import { haptics } from "../../../utils/haptics";
import { PoseIllustration, type PoseId } from "./posture/PoseIllustration";

const BLUE = "#6EC1E8";
const BLUE_LIGHT = "#9AD5F2";
const BLUE_DARK = "#0E2A3A";
const BLUE_EDGE = "#3E8AB3";
const BLUE_TINT = "rgba(110,193,232,0.05)";

interface PostureStep {
  pose: PoseId;
  title: string;
  detail?: string;
  dua_arabic?: string;
  dua_translation?: string;
}

export function PostureStepComponent({
  lesson,
  onComplete,
}: LessonComponentProps) {
  const { fontFamily } = useQuranFont();
  const data = lesson.data as Record<string, any>;
  const steps: PostureStep[] = data.steps ?? [];
  const [done, setDone] = useState(0);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  const finished = done >= steps.length;

  const advance = () => {
    if (finished) return;
    haptics.light();
    setDone((prev) => Math.min(prev + 1, steps.length));
  };

  const speak = useCallback((text: string, idx: number) => {
    Speech.stop();
    setSpeakingIdx(idx);
    Speech.speak(text, {
      language: "ar",
      rate: 0.75,
      onDone: () => setSpeakingIdx(null),
      onStopped: () => setSpeakingIdx(null),
      onError: () => setSpeakingIdx(null),
    });
  }, []);

  const pct = steps.length > 0 ? Math.round((done / steps.length) * 100) : 0;

  return (
    <View>
      <FadeInView style={s.card}>
        {steps.map((step, idx) => {
          const isDone = idx < done;
          const isCurrent = idx === done;
          const isLast = idx === steps.length - 1;
          const showDua = isCurrent && !!step.dua_arabic;

          return (
            <View
              key={idx}
              style={[
                s.row,
                !isLast && s.rowBorder,
                isCurrent && s.rowCurrent,
                !isDone && !isCurrent && s.rowUpcoming,
              ]}
            >
              <View style={s.rowTop}>
                <View
                  style={[
                    s.poseWrap,
                    isCurrent && s.poseWrapCurrent,
                    isDone && s.poseWrapDone,
                  ]}
                >
                  <PoseIllustration
                    pose={step.pose}
                    size={40}
                    color={
                      isDone
                        ? theme.colors.primary
                        : isCurrent
                          ? BLUE
                          : theme.colors.textMuted
                    }
                  />
                </View>
                <View style={s.rowBody}>
                  <Text
                    style={[
                      s.rowTitle,
                      isCurrent && s.rowTitleCurrent,
                      !isDone && !isCurrent && s.rowTitleUpcoming,
                    ]}
                  >
                    {step.title}
                  </Text>
                  {isCurrent ? (
                    <Text style={s.youAreHere}>You are here</Text>
                  ) : step.detail && isDone ? (
                    <Text style={s.rowDetail}>{step.detail}</Text>
                  ) : null}
                </View>
                {isDone && (
                  <View style={s.dotDone}>
                    <Text style={s.dotDoneText}>✓</Text>
                  </View>
                )}
              </View>

              {isCurrent && step.detail ? (
                <Text style={s.currentDetail}>{step.detail}</Text>
              ) : null}

              {showDua && (
                <TactilePressable
                  edgeColor={
                    speakingIdx === idx ? theme.colors.primary : BLUE_EDGE
                  }
                  radius={14}
                  haptic="light"
                  style={s.duaWrap}
                  faceStyle={[s.duaCard, speakingIdx === idx && s.duaCardActive]}
                  onPress={() => speak(step.dua_arabic!, idx)}
                >
                  <Text style={[s.duaArabic, { fontFamily }]}>
                    {step.dua_arabic}
                  </Text>
                  {step.dua_translation ? (
                    <Text style={s.duaTranslation}>
                      "{step.dua_translation}"
                    </Text>
                  ) : null}
                  <View style={s.soundRow}>
                    <Volume2
                      size={15}
                      color={
                        speakingIdx === idx
                          ? theme.colors.secondary
                          : BLUE
                      }
                    />
                    <Text
                      style={[
                        s.tapHint,
                        speakingIdx === idx && s.tapHintActive,
                      ]}
                    >
                      {speakingIdx === idx ? "Playing…" : "Tap to hear"}
                    </Text>
                  </View>
                </TactilePressable>
              )}
            </View>
          );
        })}
      </FadeInView>

      <View style={s.progressCard}>
        <Text style={s.progressLabel}>
          {done} OF {steps.length}
        </Text>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>

      {finished ? (
        <ContinueButton onPress={onComplete} style={{ marginTop: 18 }} />
      ) : (
        <TactilePressable
          edgeColor={BLUE_EDGE}
          radius={18}
          haptic="light"
          style={{ marginTop: 18 }}
          faceStyle={s.nextBtn}
          onPress={advance}
        >
          <Text style={s.nextBtnText}>NEXT STEP</Text>
        </TactilePressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 22,
    overflow: "hidden",
  },
  row: {
    paddingVertical: 15,
    paddingHorizontal: 17,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#1E3238",
  },
  rowCurrent: {
    backgroundColor: BLUE_TINT,
  },
  rowUpcoming: {
    opacity: 0.55,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  poseWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surfaceLow,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  poseWrapCurrent: {
    borderColor: BLUE,
    borderWidth: 1.5,
  },
  poseWrapDone: {
    borderColor: theme.colors.primary,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 14.5,
    fontFamily: "Nunito_800ExtraBold",
    color: theme.colors.text,
  },
  rowTitleCurrent: {
    color: BLUE_LIGHT,
  },
  rowTitleUpcoming: {
    color: theme.colors.textMuted,
  },
  rowDetail: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: "#5F7E7C",
    marginTop: 1,
  },
  currentDetail: {
    fontSize: 12.5,
    fontFamily: "Nunito_600SemiBold",
    color: theme.colors.textMuted,
    marginTop: 8,
    marginLeft: 61,
  },
  youAreHere: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: BLUE,
    marginTop: 1,
  },
  dotDone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDoneText: {
    fontSize: 12,
    fontFamily: "Nunito_900Black",
    color: theme.colors.onPrimary,
  },

  duaWrap: {
    marginTop: 12,
    marginLeft: 61,
  },
  duaCard: {
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  duaCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary08,
  },
  duaArabic: {
    fontSize: 20,
    color: theme.colors.text,
    writingDirection: "rtl",
    lineHeight: 34,
  },
  duaTranslation: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: theme.colors.textMuted,
    marginTop: 6,
  },
  soundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  tapHint: {
    fontSize: 11.5,
    color: theme.colors.textMuted,
    letterSpacing: 0.3,
    fontFamily: "Nunito_700Bold",
  },
  tapHintActive: {
    color: theme.colors.secondary,
  },

  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 18,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: "Nunito_800ExtraBold",
    color: theme.colors.textMuted,
    letterSpacing: 0.9,
  },
  progressTrack: {
    flex: 1,
    height: 9,
    borderRadius: 5,
    backgroundColor: theme.colors.background,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: BLUE,
  },

  nextBtn: {
    backgroundColor: BLUE,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: "center",
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: "Nunito_900Black",
    color: BLUE_DARK,
    letterSpacing: 1.3,
  },
});
