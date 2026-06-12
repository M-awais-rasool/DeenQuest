import React, { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { AnimatedPressable } from "../../ui";
import { RotateCcw } from "lucide-react-native";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";
import {
  ArabicChip,
  ContinueButton,
  FeedbackBanner,
  type FeedbackStatus,
  useShake,
  shuffle,
} from "./shared";

type Item = { id: number; text: string };

/**
 * Arrange shuffled Arabic parts into the correct order to complete the ayah.
 * Tap a tile in the bank → it lands (right-to-left) in the answer row;
 * tap a placed tile → it returns. Wrong order shakes & clears; correct
 * order celebrates and reveals the meaning.
 *
 * `data.distractors` (optional) mixes decoy words into the bank that do
 * not belong in the answer — the bank can hold more tiles than the ayah.
 */
export function AyahBuilderComponent({ lesson, onComplete }: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;
  const parts: string[] = data.parts ?? [];
  const distractors: string[] = data.distractors ?? [];
  const meaning: string | undefined = data.meaning;
  const instruction: string =
    data.instruction ?? "Tap the words in the correct order";

  const items = useMemo<Item[]>(
    () => [...parts, ...distractors].map((text, id) => ({ id, text })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );
  const shuffledIds = useMemo(() => shuffle(items.map((i) => i.id)), [items]);

  const [order, setOrder] = useState<number[]>([]);
  const [result, setResult] = useState<FeedbackStatus>(null);
  const { shake, style: shakeStyle } = useShake();

  const byId = (id: number) => items[id];
  const bankIds = shuffledIds.filter((id) => !order.includes(id));
  const isFull = order.length === parts.length && parts.length > 0;
  const solved = result === "correct";

  const addToAnswer = (id: number) => {
    if (solved || order.length >= parts.length) return;
    haptics.selection();
    sfx.pick();
    setOrder((prev) => [...prev, id]);
    if (result === "wrong") setResult(null);
  };

  const removeFromAnswer = (id: number) => {
    if (solved) return;
    haptics.light();
    setOrder((prev) => prev.filter((x) => x !== id));
    if (result === "wrong") setResult(null);
  };

  const reset = () => {
    if (solved) return;
    setOrder([]);
    setResult(null);
  };

  const check = () => {
    const correct =
      order.length === parts.length &&
      order.every((id, idx) => byId(id).text === parts[idx]);
    if (correct) {
      setResult("correct");
      haptics.success();
      sfx.correct();
    } else {
      setResult("wrong");
      haptics.error();
      sfx.wrong();
      shake();
      // Clear after the shake so the learner can try again.
      setTimeout(() => {
        setOrder([]);
        setResult(null);
      }, 700);
    }
  };

  const placedState = (): "selected" | "correct" | "wrong" => {
    if (result === "correct") return "correct";
    if (result === "wrong") return "wrong";
    return "selected";
  };

  return (
    <View>
      <Text style={s.instruction}>{instruction}</Text>

      {/* Answer row (RTL) */}
      <Animated.View style={[s.answerBox, shakeStyle]}>
        {order.length === 0 ? (
          <Text style={s.answerPlaceholder}>…</Text>
        ) : (
          <View style={s.rowRtl}>
            {order.map((id) => (
              <ArabicChip
                key={id}
                label={byId(id).text}
                size="md"
                state={placedState()}
                onPress={solved ? undefined : () => removeFromAnswer(id)}
              />
            ))}
          </View>
        )}
      </Animated.View>

      {/* Word bank */}
      <View style={s.bank}>
        <View style={s.rowRtl}>
          {bankIds.map((id) => (
            <ArabicChip
              key={id}
              label={byId(id).text}
              size="md"
              state="idle"
              onPress={() => addToAnswer(id)}
            />
          ))}
          {bankIds.length === 0 && !solved && (
            <Text style={s.bankEmpty}>All words placed — tap CHECK</Text>
          )}
          {bankIds.length > 0 && isFull && !solved && (
            <Text style={s.bankEmpty}>Answer full — tap CHECK or remove a word</Text>
          )}
        </View>
      </View>

      {!solved && order.length > 0 && (
        <AnimatedPressable style={s.resetBtn} onPress={reset} activeOpacity={0.7}>
          <RotateCcw size={14} color={theme.colors.textMuted} />
          <Text style={s.resetText}>Reset</Text>
        </AnimatedPressable>
      )}

      {!solved && (
        <ContinueButton
          label="CHECK"
          haptic="none"
          variant="primary"
          showChevron={false}
          disabled={!isFull}
          onPress={check}
          style={{ marginTop: 16 }}
        />
      )}

      <FeedbackBanner
        status={solved ? "correct" : null}
        correctText={
          meaning ? `MashaAllah! 🎉\n${meaning}` : "MashaAllah! Correct 🎉"
        }
        continueLabel="CONTINUE"
        onContinue={onComplete}
      />
    </View>
  );
}

const s = StyleSheet.create({
  instruction: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: "700",
    marginBottom: 16,
  },
  answerBox: {
    minHeight: 92,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    borderStyle: "dashed",
    backgroundColor: theme.colors.surfaceLow,
    padding: 12,
    justifyContent: "center",
    marginBottom: 20,
  },
  rowRtl: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
  },
  answerPlaceholder: {
    color: theme.colors.textMuted,
    fontSize: 22,
    textAlign: "center",
    opacity: 0.5,
  },
  bank: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    minHeight: 70,
    justifyContent: "center",
  },
  bankEmpty: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
    paddingVertical: 10,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resetText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
});

export default AyahBuilderComponent;
