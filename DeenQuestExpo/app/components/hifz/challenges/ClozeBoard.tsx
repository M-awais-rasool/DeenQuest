import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  AYAH_FONT,
  FeedbackSheet,
  OutlineButton,
  SectionLabel,
  SolidButton,
  hz,
} from "../ui";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { shuffle } from "../../level/lesson/shared";
import type { HifzClozeToken } from "../../../store/services/api";

export interface ClozeResult {
  rawScore: number;
  hintsUsed: number;
  latencyMs: number;
}

export function ClozeBoard({
  tokens,
  bank,
  allowHints = true,
  reference,
  title,
  subtitle,
  onWrong,
  onDone,
}: {
  tokens: HifzClozeToken[];
  bank: string[];
  allowHints?: boolean;
  /** "AN-NABA · 78:24" caption under the ayah. */
  reference?: string;
  title: string;
  subtitle?: string;
  onWrong?: () => void;
  onDone: (result: ClozeResult) => void;
}) {
  const blankIndices = useMemo(
    () => tokens.map((t, i) => (t.blank ? i : -1)).filter((i) => i >= 0),
    [tokens],
  );

  const bankItems = useMemo(
    () => shuffle(bank.map((text, id) => ({ id, text }))),
    [bank],
  );

  const [placed, setPlaced] = useState<Record<number, number>>({});
  const [status, setStatus] = useState<"correct" | "wrong" | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startedAt] = useState(() => Date.now());

  const boardKey = `${tokens.length}:${blankIndices.length}`;
  useEffect(() => {
    setPlaced({});
    setStatus(null);
  }, [boardKey]);

  const usedBankIds = useMemo(() => new Set(Object.values(placed)), [placed]);
  const nextEmptyBlank = blankIndices.find((i) => placed[i] === undefined);
  const allFilled = nextEmptyBlank === undefined;

  const place = useCallback(
    (bankId: number) => {
      if (status === "correct" || nextEmptyBlank === undefined) return;
      haptics.selection();
      sfx.pick();
      setPlaced((prev) => ({ ...prev, [nextEmptyBlank]: bankId }));
    },
    [status, nextEmptyBlank],
  );

  const unplace = useCallback(
    (tokenIndex: number) => {
      if (status === "correct") return;
      haptics.light();
      setPlaced((prev) => {
        const next = { ...prev };
        delete next[tokenIndex];
        return next;
      });
    },
    [status],
  );

  const useHint = () => {
    if (status === "correct" || nextEmptyBlank === undefined) return;
    haptics.medium();
    const answer = tokens[nextEmptyBlank].answer;
    const match = bankItems.find(
      (b) => b.text === answer && !usedBankIds.has(b.id),
    );
    if (!match) return;
    setHintsUsed((n) => n + 1);
    setPlaced((prev) => ({ ...prev, [nextEmptyBlank]: match.id }));
  };

  const isRight = (i: number) => {
    const bankId = placed[i];
    return (
      bankId !== undefined &&
      bankItems.find((b) => b.id === bankId)?.text === tokens[i].answer
    );
  };

  const check = () => {
    const all = blankIndices.every(isRight);
    if (all) {
      sfx.correct();
      setStatus("correct");
    } else {
      sfx.wrong();
      setStatus("wrong");
      onWrong?.();
    }
  };

  const retry = () => {
    setPlaced((prev) => {
      const next: Record<number, number> = {};
      for (const i of blankIndices) {
        if (isRight(i) && prev[i] !== undefined) next[i] = prev[i];
      }
      return next;
    });
    setStatus(null);
  };

  const finish = () => {
    const correct = blankIndices.filter(isRight).length;
    onDone({
      rawScore: blankIndices.length
        ? Math.round((correct / blankIndices.length) * 100)
        : 100,
      hintsUsed,
      latencyMs: Date.now() - startedAt,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* title (J9) */}
        <View style={s.titleBlock}>
          <Text style={s.title}>{title}</Text>
          {!!subtitle && <Text style={s.sub}>{subtitle}</Text>}
        </View>

        {/* ayah card with gaps */}
        <View style={s.ayahCard}>
          <View style={s.flow}>
            {tokens.map((token, i) => {
              if (!token.blank) {
                return (
                  <Text key={i} style={s.word}>
                    {token.text}
                  </Text>
                );
              }
              const bankId = placed[i];
              const filledText =
                bankId !== undefined
                  ? bankItems.find((b) => b.id === bankId)?.text
                  : undefined;

              if (filledText !== undefined) {
                return (
                  <Pressable key={i} onPress={() => unplace(i)} style={s.filledSlot}>
                    <Text style={s.filledText}>{filledText}</Text>
                  </Pressable>
                );
              }
              const isNext = i === nextEmptyBlank;
              return (
                <View key={i} style={s.emptySlot}>
                  {token.hint ? (
                    <Text style={s.hintLetter}>{token.hint}</Text>
                  ) : isNext ? (
                    <Text style={s.slotText}>tap a word</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
          {!!reference && <Text style={s.reference}>{reference}</Text>}
        </View>

        {/* word bank */}
        <SectionLabel style={s.bankLabel}>WORD BANK</SectionLabel>
        <View style={s.bank}>
          {bankItems.map((item) => {
            const used = usedBankIds.has(item.id);
            return (
              <Pressable
                key={item.id}
                disabled={used || allFilled}
                onPress={() => place(item.id)}
                style={[s.bankChip, used && s.bankChipUsed]}
              >
                <Text style={[s.bankText, used && { color: hz.faint }]}>
                  {item.text}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* bottom (J9) */}
      <View style={{ gap: 10, paddingTop: 8 }}>
        {allowHints && !allFilled && (
          <OutlineButton
            label="SHOW A HINT · costs 5 pts"
            onPress={useHint}
            size="md"
            icon={<Text style={s.hintStar}>✦</Text>}
          />
        )}
        <SolidButton label="CHECK" onPress={check} disabled={!allFilled} />
      </View>

      <FeedbackSheet
        status={status}
        message={
          status === "correct"
            ? hintsUsed > 0
              ? "Every word back in place — try it hint-free next time."
              : "Every word back in place."
            : "The wrong words went back to the bank."
        }
        actionLabel={status === "correct" ? "CONTINUE" : "TRY AGAIN"}
        onAction={status === "correct" ? finish : retry}
      />
    </View>
  );
}

const s = StyleSheet.create({
  titleBlock: { alignItems: "center", paddingTop: 10, paddingHorizontal: 6 },
  title: { fontFamily: "Nunito_900Black", fontSize: 20, color: hz.text },
  sub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: hz.muted,
    textAlign: "center",
    marginTop: 5,
  },

  ayahCard: {
    backgroundColor: hz.card,
    borderWidth: 1,
    borderColor: hz.cardBorder,
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 18,
    marginTop: 20,
  },
  flow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  word: {
    fontFamily: AYAH_FONT,
    fontSize: 28,
    lineHeight: 48,
    color: hz.text,
    writingDirection: "rtl",
  },
  emptySlot: {
    minWidth: 96,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: hz.violetDash,
    backgroundColor: hz.violetWell,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  slotText: { fontFamily: "Nunito_700Bold", fontSize: 12, color: hz.violetMuted },
  hintLetter: { fontFamily: AYAH_FONT, fontSize: 24, lineHeight: 40, color: hz.gold },
  filledSlot: {
    minWidth: 88,
    height: 48,
    borderRadius: 12,
    backgroundColor: hz.violetTint,
    borderWidth: 2,
    borderColor: hz.violet,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  filledText: {
    fontFamily: AYAH_FONT,
    fontSize: 26,
    lineHeight: 42,
    color: hz.violetBright,
  },
  reference: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 10,
    letterSpacing: 1.3,
    color: hz.faint,
    textAlign: "center",
    marginTop: 16,
  },

  bankLabel: { marginTop: 22, marginLeft: 6 },
  bank: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 10,
    paddingTop: 12,
  },
  bankChip: {
    backgroundColor: hz.card,
    borderWidth: 1.5,
    borderColor: hz.cardBorder,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  bankChipUsed: {
    backgroundColor: hz.well,
    borderColor: hz.rowBorder,
    opacity: 0.5,
  },
  bankText: {
    fontFamily: AYAH_FONT,
    fontSize: 26,
    lineHeight: 42,
    color: hz.text,
    writingDirection: "rtl",
  },
  hintStar: { fontSize: 14, color: hz.gold },
});
