import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { TactilePressable } from "../../ui";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";
import { FadeInView, ContinueButton } from "./shared";
import { haptics } from "../../../utils/haptics";

const BLUE = "#6EC1E8";
const BLUE_LIGHT = "#9AD5F2";
const BLUE_DARK = "#0E2A3A";
const BLUE_EDGE = "#3E8AB3";
const BLUE_TINT = "rgba(110,193,232,0.05)";

function splitStep(step: string): { title: string; detail?: string } {
  const parts = step.split(/\s+—\s+/);
  if (parts.length >= 2) {
    return { title: parts[0], detail: parts.slice(1).join(" — ") };
  }
  return { title: step };
}

export function PrayerChecklistComponent({
  lesson,
  onComplete,
}: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;
  const steps: string[] = data.steps ?? [];
  const [done, setDone] = useState(0);

  const finished = done >= steps.length;

  const advance = () => {
    if (finished) return;
    haptics.light();
    setDone((prev) => Math.min(prev + 1, steps.length));
  };

  const pct =
    steps.length > 0 ? Math.round((done / steps.length) * 100) : 0;

  return (
    <View>
      {/* steps card (C15 mock) */}
      <FadeInView style={s.card}>
        {steps.map((step, idx) => {
          const { title, detail } = splitStep(step);
          const isDone = idx < done;
          const isCurrent = idx === done;
          const isLast = idx === steps.length - 1;

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
              {isDone ? (
                <View style={s.dotDone}>
                  <Text style={s.dotDoneText}>✓</Text>
                </View>
              ) : (
                <View style={[s.dotIdle, isCurrent && s.dotCurrent]}>
                  <Text
                    style={[s.dotIdleText, isCurrent && s.dotCurrentText]}
                  >
                    {idx + 1}
                  </Text>
                </View>
              )}
              <View style={s.rowBody}>
                <Text
                  style={[
                    s.rowTitle,
                    isCurrent && s.rowTitleCurrent,
                    !isDone && !isCurrent && s.rowTitleUpcoming,
                  ]}
                >
                  {title}
                </Text>
                {isCurrent ? (
                  <Text style={s.youAreHere}>You are here</Text>
                ) : detail && isDone ? (
                  <Text style={s.rowDetail}>{detail}</Text>
                ) : null}
              </View>
              {isCurrent && <Text style={s.chevron}>›</Text>}
            </View>
          );
        })}
      </FadeInView>

      {/* progress strip */}
      <View style={s.progressCard}>
        <Text style={s.progressLabel}>
          {done} OF {steps.length}
        </Text>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>

      {/* CTA */}
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
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
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
  dotDone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDoneText: {
    fontSize: 13,
    fontFamily: "Nunito_900Black",
    color: theme.colors.onPrimary,
  },
  dotIdle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#2C464C",
    alignItems: "center",
    justifyContent: "center",
  },
  dotCurrent: {
    borderWidth: 2.5,
    borderColor: BLUE,
  },
  dotIdleText: {
    fontSize: 12,
    fontFamily: "Nunito_900Black",
    color: "#5F7E7C",
  },
  dotCurrentText: {
    color: BLUE,
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
  youAreHere: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: BLUE,
    marginTop: 1,
  },
  chevron: {
    fontSize: 16,
    fontFamily: "Nunito_800ExtraBold",
    color: BLUE,
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
