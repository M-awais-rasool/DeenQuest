import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  AYAH_FONT,
  FeedbackSheet,
  SectionLabel,
  SolidButton,
  hz,
  toArabicDigits,
} from "../ui";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { shuffle } from "../../level/lesson/shared";
import type { HifzChallengeProps } from "./types";

function HandleIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8h16M4 16h16"
        stroke={hz.faint}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function HifzOrderChallenge({
  challenge,
  onWrong,
  onDone,
}: HifzChallengeProps) {
  const parts = (challenge.content.parts ?? []) as string[];
  const items = useMemo(() => parts.map((text, id) => ({ id, text })), [parts]);
  const shuffled = useMemo(() => shuffle(items), [items]);

  const [order, setOrder] = useState<number[]>([]);
  const [status, setStatus] = useState<"correct" | "wrong" | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [startedAt] = useState(() => Date.now());

  const remaining = shuffled.filter((i) => !order.includes(i.id));
  const complete = order.length === items.length && items.length > 0;

  const place = (id: number) => {
    if (status === "correct") return;
    haptics.selection();
    sfx.pick();
    setOrder((prev) => [...prev, id]);
  };

  const unplace = (id: number) => {
    if (status === "correct") return;
    haptics.light();
    setOrder((prev) => prev.filter((x) => x !== id));
  };

  const check = () => {
    const right = order.every((id, idx) => id === idx);
    setAttempts((n) => n + 1);
    if (right) {
      sfx.correct();
      setStatus("correct");
    } else {
      sfx.wrong();
      setStatus("wrong");
      onWrong?.();
    }
  };

  const finish = () => {
    onDone({
      rawScore: Math.max(20, Math.round(100 / Math.max(1, attempts))),
      hintsUsed: 0,
      latencyMs: Date.now() - startedAt,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* title (J10) */}
        <View style={s.titleBlock}>
          <Text style={s.title}>Rebuild the portion</Text>
          <Text style={s.sub}>Drag each ayah into its slot, first to last.</Text>
        </View>

        {/* numbered slots */}
        <View style={{ gap: 9, marginTop: 18 }}>
          {items.map((_, slotIdx) => {
            const placedId = order[slotIdx];
            const isNext = slotIdx === order.length;

            if (placedId !== undefined) {
              const solved = status === "correct";
              return (
                <Pressable
                  key={slotIdx}
                  onPress={() => unplace(placedId)}
                  style={s.slotPlaced}
                >
                  <View style={s.slotNumPlaced}>
                    <Text style={s.slotNumPlacedText}>
                      {toArabicDigits(slotIdx + 1)}
                    </Text>
                  </View>
                  <Text style={[s.slotAyah, solved && { color: hz.tealBright }]}>
                    {items[placedId].text}
                  </Text>
                </Pressable>
              );
            }
            return (
              <View
                key={slotIdx}
                style={[s.slotEmpty, isNext && s.slotEmptyNext]}
              >
                <View
                  style={[s.slotNumEmpty, isNext && { backgroundColor: hz.violetTint }]}
                >
                  <Text
                    style={[
                      s.slotNumEmptyText,
                      isNext && { color: hz.violetBright },
                    ]}
                  >
                    {toArabicDigits(slotIdx + 1)}
                  </Text>
                </View>
                {isNext && (
                  <Text style={s.slotDropText}>drop the next ayah here</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* bank (J10) */}
        {remaining.length > 0 && (
          <>
            <SectionLabel style={s.bankLabel}>STILL TO PLACE</SectionLabel>
            <View style={{ gap: 9, marginTop: 12 }}>
              {remaining.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => place(item.id)}
                  style={({ pressed }) => [s.bankCard, pressed && { opacity: 0.8 }]}
                >
                  <HandleIcon />
                  <Text style={s.slotAyah}>{item.text}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <SolidButton
        label="CHECK ORDER"
        onPress={check}
        disabled={!complete}
        style={{ marginTop: 8 }}
      />

      <FeedbackSheet
        status={status}
        message={
          status === "correct"
            ? "That's the order — sequence is half of hifz."
            : "Not that order — listen for how one ayah leads into the next."
        }
        actionLabel={status === "correct" ? "CONTINUE" : "TRY AGAIN"}
        onAction={
          status === "correct"
            ? finish
            : () => {
                setOrder([]);
                setStatus(null);
              }
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  titleBlock: { alignItems: "center", paddingTop: 8, paddingHorizontal: 6 },
  title: { fontFamily: "Nunito_900Black", fontSize: 20, color: hz.text },
  sub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: hz.muted,
    textAlign: "center",
    marginTop: 5,
  },

  slotPlaced: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 11,
    backgroundColor: hz.tealTint,
    borderWidth: 1.5,
    borderColor: hz.teal,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  slotNumPlaced: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: hz.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  slotNumPlacedText: {
    fontFamily: "Nunito_900Black",
    fontSize: 12,
    color: hz.onTeal,
  },
  slotAyah: {
    flex: 1,
    fontFamily: AYAH_FONT,
    fontSize: 23,
    lineHeight: 39,
    color: hz.text,
    textAlign: "right",
    writingDirection: "rtl",
  },

  slotEmpty: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 11,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: hz.cardBorder,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  slotEmptyNext: {
    borderColor: hz.violetDash,
    backgroundColor: hz.violetWell,
  },
  slotNumEmpty: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: hz.card,
    alignItems: "center",
    justifyContent: "center",
  },
  slotNumEmptyText: { fontFamily: "Nunito_900Black", fontSize: 12, color: hz.faint },
  slotDropText: {
    flex: 1,
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: hz.violetMuted,
    textAlign: "right",
  },

  bankLabel: { marginTop: 20, marginLeft: 6 },
  bankCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 11,
    backgroundColor: hz.card,
    borderWidth: 1.5,
    borderColor: hz.cardBorder,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
});
