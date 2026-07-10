import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { theme } from "../../../theme/themes";
import { useQuranFont } from "../../../hooks/useQuranFont";
import type { LessonComponentProps } from "./types";
import {
  ArabicChip,
  ContinueButton,
  FeedbackBanner,
  type FeedbackStatus,
  useShake,
  shuffle,
} from "./shared";

type Token = { text?: string; blank?: boolean; answer?: string };
type BankItem = { id: number; text: string };

/**
 * Fill-in-the-blank: an Arabic phrase with one or more blanks. Tap a word
 * from the bank to drop it into the next blank; tap a filled blank to take
 * it back. Wrong answers shake the blanks; correct reveals the meaning.
 */
export function FillBlankComponent({ lesson, onComplete }: LessonComponentProps) {
  const { fontFamily } = useQuranFont();
  const data = lesson.data as Record<string, any>;
  const tokens: Token[] = (data.sentence ?? []).map((t: any) =>
    typeof t === "string" ? { text: t } : t,
  );
  const meaning: string | undefined = data.meaning;
  const instruction: string =
    data.instruction ?? "Tap the correct word to fill the blank";

  const bankItems = useMemo<BankItem[]>(
    () => (data.bank ?? []).map((text: string, id: number) => ({ id, text })),
    [data.bank],
  );
  const shuffledBank = useMemo(() => shuffle(bankItems), [bankItems]);

  const blankIndices = useMemo(
    () => tokens.map((t, i) => (t.blank ? i : -1)).filter((i) => i >= 0),
    [tokens],
  );

  // filled: token index -> bank item id
  const [filled, setFilled] = useState<Record<number, number>>({});
  const [result, setResult] = useState<FeedbackStatus>(null);
  const { shake, style: shakeStyle } = useShake();

  const usedIds = Object.values(filled);
  const availableBank = shuffledBank.filter((b) => !usedIds.includes(b.id));
  const nextBlank = blankIndices.find((i) => filled[i] === undefined);
  const allFilled = blankIndices.every((i) => filled[i] !== undefined);
  const solved = result === "correct";
  const textById = (id: number) => bankItems[id]?.text ?? "";

  const placeWord = (bankId: number) => {
    if (solved || nextBlank === undefined) return;
    haptics.selection();
    sfx.pick();
    setFilled((prev) => ({ ...prev, [nextBlank]: bankId }));
    if (result === "wrong") setResult(null);
  };

  const clearBlank = (tokenIndex: number) => {
    if (solved) return;
    haptics.light();
    setFilled((prev) => {
      const next = { ...prev };
      delete next[tokenIndex];
      return next;
    });
    if (result === "wrong") setResult(null);
  };

  const check = () => {
    const correct = blankIndices.every(
      (i) => textById(filled[i]) === tokens[i].answer,
    );
    if (correct) {
      setResult("correct");
      haptics.success();
      sfx.correct();
    } else {
      setResult("wrong");
      haptics.error();
      sfx.wrong();
      shake();
      setTimeout(() => {
        // Remove only the wrong words so the learner keeps the right ones.
        setFilled((prev) => {
          const next = { ...prev };
          blankIndices.forEach((i) => {
            if (textById(next[i]) !== tokens[i].answer) delete next[i];
          });
          return next;
        });
        setResult(null);
      }, 700);
    }
  };

  return (
    <View>
      <Text style={s.instruction}>{instruction}</Text>

      {/* Sentence with inline blanks (RTL) */}
      <Animated.View style={[s.sentenceBox, shakeStyle]}>
        <View style={s.rowRtl}>
          {tokens.map((t, i) => {
            if (!t.blank) {
              return (
                <Text key={i} style={[s.word, { fontFamily }]}>
                  {t.text}
                </Text>
              );
            }
            const fid = filled[i];
            if (fid === undefined) {
              const isActive = nextBlank === i;
              return (
                <View
                  key={i}
                  style={[s.blankEmpty, isActive && s.blankActive]}
                />
              );
            }
            return (
              <ArabicChip
                key={i}
                label={textById(fid)}
                size="sm"
                state={solved ? "correct" : "selected"}
                onPress={solved ? undefined : () => clearBlank(i)}
              />
            );
          })}
        </View>
      </Animated.View>

      {/* Word bank */}
      <View style={s.bank}>
        <View style={s.rowRtl}>
          {availableBank.map((b) => (
            <ArabicChip
              key={b.id}
              label={b.text}
              size="sm"
              state="idle"
              onPress={() => placeWord(b.id)}
            />
          ))}
          {availableBank.length === 0 && !solved && (
            <Text style={s.bankEmpty}>Tap CHECK to confirm</Text>
          )}
        </View>
      </View>

      {!solved && (
        <ContinueButton
          label="CHECK"
          haptic="none"
          variant="primary"
          showChevron={false}
          disabled={!allFilled}
          onPress={check}
          style={{ marginTop: 16 }}
        />
      )}

      <FeedbackBanner
        status={solved ? "correct" : null}
        correctText={
          meaning ? `MashaAllah! 🎉\n${meaning}` : "MashaAllah! Correct 🎉"
        }
        onContinue={onComplete}
      />
    </View>
  );
}

const s = StyleSheet.create({
  instruction: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontFamily: "Nunito_700Bold",
    marginBottom: 16,
  },
  sentenceBox: {
    minHeight: 96,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceLow,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: 16,
    justifyContent: "center",
    marginBottom: 20,
  },
  rowRtl: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    justifyContent: "flex-start",
  },
  word: {
    fontSize: 30,
    color: theme.colors.text,
    writingDirection: "rtl",
  },
  blankEmpty: {
    width: 76,
    height: 46,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  blankActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary08,
  },
  bank: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    minHeight: 66,
    justifyContent: "center",
  },
  bankEmpty: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    textAlign: "center",
    width: "100%",
    paddingVertical: 10,
  },
});

export default FillBlankComponent;
