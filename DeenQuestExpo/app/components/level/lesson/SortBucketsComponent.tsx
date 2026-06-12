import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { theme } from "../../../theme/themes";
import { useQuranFont } from "../../../hooks/useQuranFont";
import { TactilePressable } from "../../ui";
import type { LessonComponentProps } from "./types";
import {
  FeedbackBanner,
  type FeedbackStatus,
  StreakBadge,
  useShake,
  usePop,
  shuffle,
} from "./shared";

type SortItem = { text: string; bucket: number };

/**
 * Categorisation game: one Arabic token at a time is dropped into one of
 * two labelled buckets (e.g. "dot above" vs "dot below"). Correct sorts
 * pop the token into the bucket's collection row; wrong taps shake the
 * token. A streak builds across consecutive correct sorts.
 */
export function SortBucketsComponent({ lesson, onComplete }: LessonComponentProps) {
  const { fontFamily } = useQuranFont();
  const data = lesson.data as Record<string, any>;
  const buckets: string[] = data.buckets ?? [];
  const instruction: string = data.instruction ?? "Sort each one into its group";

  const items = useMemo<SortItem[]>(
    () =>
      shuffle(
        (data.items ?? []).map((it: any) => ({
          text: it.text ?? "",
          bucket: it.bucket ?? 0,
        })),
      ),
    [data],
  );

  const [index, setIndex] = useState(0);
  const [collected, setCollected] = useState<string[][]>(
    () => buckets.map(() => []) as string[][],
  );
  const [streak, setStreak] = useState(0);

  const { shake, style: shakeStyle } = useShake();
  const { pop, style: popStyle } = usePop();

  const current = items[index];
  const done = index >= items.length;

  const handleBucket = (bucketIdx: number) => {
    if (done) return;
    if (bucketIdx === current.bucket) {
      const last = index + 1 >= items.length;
      if (last) {
        haptics.success();
        sfx.correct();
      } else {
        haptics.light();
        sfx.pick();
      }
      pop();
      setCollected((prev) =>
        prev.map((arr, i) => (i === bucketIdx ? [...arr, current.text] : arr)),
      );
      setStreak((n) => n + 1);
      setIndex((i) => i + 1);
    } else {
      haptics.error();
      sfx.wrong();
      shake();
      setStreak(0);
    }
  };

  const status: FeedbackStatus = done ? "correct" : null;

  return (
    <View>
      <View style={s.headerRow}>
        <Text style={s.instruction}>{instruction}</Text>
        <StreakBadge streak={streak} />
      </View>

      <View style={s.stage}>
        {done ? (
          <Text style={s.doneMark}>🎉</Text>
        ) : (
          <Animated.View style={[shakeStyle]}>
            <Animated.View style={[s.currentCard, popStyle]}>
              <Text style={[s.currentText, { fontFamily }]}>
                {current.text}
              </Text>
            </Animated.View>
          </Animated.View>
        )}
        {!done && (
          <Text style={s.progress}>
            {index + 1} / {items.length}
          </Text>
        )}
      </View>

      <View style={s.bucketRow}>
        {buckets.map((label, i) => (
          <View key={i} style={s.bucketHalf}>
            <TactilePressable
              edgeColor={theme.colors.outline}
              radius={16}
              haptic="none"
              disabled={done}
              dimWhenDisabled={false}
              onPress={() => handleBucket(i)}
              faceStyle={s.bucketFace}
            >
              <Text style={[s.bucketLabel, { fontFamily }]}>{label}</Text>
              <Text style={[s.bucketItems, { fontFamily }]} numberOfLines={2}>
                {collected[i].length > 0 ? collected[i].join("  ") : "—"}
              </Text>
            </TactilePressable>
          </View>
        ))}
      </View>

      <FeedbackBanner
        status={status}
        correctText={`MashaAllah! All ${items.length} sorted correctly 🎉`}
        onContinue={onComplete}
      />
    </View>
  );
}

const s = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
  },
  instruction: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: "700",
  },
  stage: {
    alignItems: "center",
    marginBottom: 20,
    minHeight: 120,
    justifyContent: "center",
  },
  currentCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.secondary35,
    paddingHorizontal: 34,
    paddingVertical: 14,
  },
  currentText: {
    fontSize: 52,
    color: theme.colors.text,
    writingDirection: "rtl",
  },
  doneMark: {
    fontSize: 48,
  },
  progress: {
    marginTop: 8,
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  bucketRow: {
    flexDirection: "row",
    gap: 12,
  },
  bucketHalf: {
    flex: 1,
  },
  bucketFace: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 6,
    minHeight: 96,
  },
  bucketLabel: {
    fontSize: 22,
    color: theme.colors.primary,
    textAlign: "center",
    writingDirection: "rtl",
  },
  bucketItems: {
    fontSize: 18,
    color: theme.colors.textMuted,
    textAlign: "center",
    writingDirection: "rtl",
  },
});

export default SortBucketsComponent;
