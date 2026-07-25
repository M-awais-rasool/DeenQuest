import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import {
  AYAH_FONT,
  OutlineButton,
  PulseRing,
  SolidButton,
  hz,
} from "../ui";
import { haptics } from "../../../utils/haptics";
import { referenceFor, type HifzChallengeProps } from "./types";
import type { HifzClozeToken } from "../../../store/services/api";

interface FadeRound {
  sentence: HifzClozeToken[];
  bank: string[];
  hidden_pct: number;
}

function MicIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="3" width="6" height="11" rx="3" stroke={color} strokeWidth={2.2} />
      <Path
        d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function slotWidth(answer: string | undefined): number {
  const len = answer?.length ?? 5;
  return Math.max(64, Math.min(112, 40 + len * 9));
}

export function HifzFadeChallenge({
  challenge,
  allowHints,
  surahRef,
  onDone,
}: HifzChallengeProps) {
  const rounds = (challenge.content.rounds ?? []) as FadeRound[];
  const [index, setIndex] = useState(0);
  const [peeking, setPeeking] = useState(false);
  const [holding, setHolding] = useState(false);
  const [peeks, setPeeks] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [startedAt] = useState(() => Date.now());

  const round = rounds[index];

  useEffect(() => {
    if (!round) onDone({ rawScore: 0, hintsUsed: 0, latencyMs: 0 });
  }, [round]);

  const roundPeekedRef = useRef(false);
  useEffect(() => {
    roundPeekedRef.current = false;
    setPeeking(false);
  }, [index]);

  const tokens = round?.sentence ?? [];

  if (!round) return null;

  const peek = () => {
    haptics.light();
    setPeeking((p) => !p);
    if (!roundPeekedRef.current) {
      roundPeekedRef.current = true;
      setPeeks((n) => n + 1);
    }
  };

  const recited = () => {
    haptics.success();
    const roundScore = roundPeekedRef.current ? 80 : 100;
    const all = [...scores, roundScore];
    if (index + 1 < rounds.length) {
      setScores(all);
      setIndex(index + 1);
      return;
    }
    onDone({
      rawScore: Math.round(all.reduce((sum, v) => sum + v, 0) / all.length),
      hintsUsed: peeks,
      latencyMs: Date.now() - startedAt,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* fade ramp (J11) */}
        <View style={s.ramp}>
          {rounds.map((r, i) => {
            const state = i < index ? "done" : i === index ? "current" : "todo";
            return (
              <View key={i} style={s.rampCol}>
                <View
                  style={[
                    s.rampBar,
                    {
                      backgroundColor:
                        state === "done"
                          ? hz.teal
                          : state === "current"
                            ? hz.violet
                            : hz.track,
                    },
                  ]}
                />
                <Text
                  style={[
                    s.rampLabel,
                    state === "done" && { color: hz.tealBright },
                    state === "current" && {
                      color: hz.violetBright,
                      fontFamily: "Nunito_900Black",
                    },
                  ]}
                >
                  {r.hidden_pct}%
                </Text>
              </View>
            );
          })}
        </View>

        {/* title */}
        <View style={s.titleBlock}>
          <Text style={s.title}>Recite what's hidden</Text>
          <Text style={s.sub}>
            Round {index + 1} — {round.hidden_pct}% of the ayah is gone.
          </Text>
        </View>

        {/* ayah card: visible words + blank boxes */}
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
              return (
                <View key={i} style={[s.blankSlot, { width: slotWidth(token.answer) }]}>
                  {peeking && !!token.answer && (
                    <Text style={s.peekLetter}>
                      {Array.from(token.answer)[0] ?? ""}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
          {!!referenceFor(surahRef, challenge.ayah_number) && (
            <Text style={s.reference}>
              {referenceFor(surahRef, challenge.ayah_number)}
            </Text>
          )}
        </View>

        {/* hold-to-recite circle (J11) */}
        <View style={s.micArea}>
          <View style={s.micHolder}>
            <PulseRing size={84} color={hz.violet} active={holding} />
            <Pressable
              onPressIn={() => {
                haptics.medium();
                setHolding(true);
              }}
              onPressOut={() => setHolding(false)}
              style={[s.micCircle, holding && { backgroundColor: hz.violetWell }]}
            >
              <MicIcon size={32} color={hz.violetBright} />
            </Pressable>
          </View>
          <Text style={s.micCaption}>
            {holding ? "RECITING…" : "HOLD TO RECITE"}
          </Text>
        </View>
      </ScrollView>

      {/* bottom (J11) */}
      <View style={{ gap: 10, paddingTop: 8 }}>
        {allowHints && (
          <OutlineButton
            label={peeking ? "HIDE FIRST LETTERS" : "PEEK AT FIRST LETTERS"}
            onPress={peek}
            size="md"
          />
        )}
        <SolidButton
          label="I RECITED IT"
          onPress={recited}
          color={hz.violet}
          shadowColor={hz.violetShadow}
          textColor={hz.onViolet}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  ramp: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 6 },
  rampCol: { flex: 1, alignItems: "center", gap: 6 },
  rampBar: { width: "100%", height: 8, borderRadius: 5 },
  rampLabel: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 9.5,
    color: hz.faint,
  },

  titleBlock: { alignItems: "center", paddingTop: 20, paddingHorizontal: 6 },
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
    paddingVertical: 26,
    paddingHorizontal: 18,
    marginTop: 20,
    minHeight: 150,
    justifyContent: "center",
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
  blankSlot: {
    height: 44,
    borderRadius: 12,
    backgroundColor: hz.well,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: hz.wellDash,
    alignItems: "center",
    justifyContent: "center",
  },
  peekLetter: {
    fontFamily: AYAH_FONT,
    fontSize: 22,
    lineHeight: 36,
    color: hz.gold,
  },
  reference: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 10,
    letterSpacing: 1.3,
    color: hz.faint,
    textAlign: "center",
    marginTop: 20,
  },

  micArea: { alignItems: "center", gap: 12, marginTop: 26, paddingBottom: 12 },
  micHolder: { alignItems: "center", justifyContent: "center" },
  micCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: hz.violetTint,
    borderWidth: 3,
    borderColor: hz.violet,
    alignItems: "center",
    justifyContent: "center",
  },
  micCaption: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12,
    letterSpacing: 1.4,
    color: hz.violetBright,
  },
});
