import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ArrowDown } from "lucide-react-native";
import { AYAH_FONT, FeedbackSheet, hz } from "../ui";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import type { HifzChallengeProps } from "./types";

export function HifzNextAyahChallenge({
  challenge,
  onWrong,
  onDone,
}: HifzChallengeProps) {
  const prompt = (challenge.content.prompt ?? "") as string;
  const promptAyah = challenge.content.prompt_ayah as number | undefined;
  const options = (challenge.content.options ?? []) as string[];
  const correct = (challenge.content.correct ?? 0) as number;

  const [wrongPicks, setWrongPicks] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [sheet, setSheet] = useState<"correct" | "wrong" | null>(null);
  const [startedAt] = useState(() => Date.now());

  const choose = (index: number) => {
    if (solved || sheet) return;
    if (index === correct) {
      sfx.correct();
      setSolved(true);
      setSheet("correct");
    } else {
      sfx.wrong();
      if (!wrongPicks.includes(index)) {
        setWrongPicks((prev) => [...prev, index]);
      }
      setSheet("wrong");
      onWrong?.();
    }
  };

  const finish = () => {
    const score =
      wrongPicks.length === 0 ? 100 : wrongPicks.length === 1 ? 50 : 20;
    onDone({ rawScore: score, hintsUsed: 0, latencyMs: Date.now() - startedAt });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* title (J12) */}
        <View style={s.titleBlock}>
          <Text style={s.title}>Which ayah follows?</Text>
        </View>

        {/* prompt card — sky (J12) */}
        <View style={s.promptCard}>
          {promptAyah !== undefined && (
            <Text style={s.promptLabel}>AYAH {promptAyah}</Text>
          )}
          <Text style={s.promptArabic}>{prompt}</Text>
        </View>

        <View style={s.arrowRow}>
          <ArrowDown size={22} color={hz.faint} strokeWidth={2.4} />
        </View>

        {/* options */}
        <View style={{ gap: 11 }}>
          {options.map((option, i) => {
            const isWrong = wrongPicks.includes(i);
            const isCorrect = solved && i === correct;
            return (
              <Pressable
                key={i}
                disabled={solved || isWrong}
                onPress={() => {
                  haptics.selection();
                  choose(i);
                }}
                style={[
                  s.option,
                  isWrong && s.optionWrong,
                  isCorrect && s.optionCorrect,
                ]}
              >
                <Text
                  style={[
                    s.optionText,
                    isWrong && { color: hz.rose },
                    isCorrect && { color: hz.tealBright },
                  ]}
                >
                  {option}
                </Text>
                {(isWrong || isCorrect) && (
                  <View
                    style={[
                      s.markCircle,
                      { backgroundColor: isCorrect ? hz.teal : hz.rose },
                    ]}
                  >
                    <Text
                      style={[
                        s.markGlyph,
                        { color: isCorrect ? hz.onTeal : hz.onRose },
                      ]}
                    >
                      {isCorrect ? "✓" : "✕"}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <FeedbackSheet
        status={sheet}
        message={
          sheet === "correct"
            ? "That's the one that follows."
            : "That one comes from elsewhere in the portion."
        }
        actionLabel={sheet === "correct" ? "CONTINUE" : "TRY AGAIN"}
        onAction={sheet === "correct" ? finish : () => setSheet(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  titleBlock: { alignItems: "center", paddingTop: 8 },
  title: { fontFamily: "Nunito_900Black", fontSize: 20, color: hz.text },

  promptCard: {
    backgroundColor: hz.skyCard,
    borderWidth: 1,
    borderColor: hz.skyEdge,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  promptLabel: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 10,
    letterSpacing: 1.2,
    color: hz.sky,
    textAlign: "center",
  },
  promptArabic: {
    fontFamily: AYAH_FONT,
    fontSize: 26,
    lineHeight: 49,
    color: hz.text,
    textAlign: "center",
    writingDirection: "rtl",
    marginTop: 6,
  },

  arrowRow: { alignItems: "center", paddingVertical: 12 },

  option: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    backgroundColor: hz.card,
    borderWidth: 2,
    borderColor: hz.cardBorder,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionWrong: {
    backgroundColor: hz.roseTint,
    borderWidth: 2.5,
    borderColor: hz.rose,
  },
  optionCorrect: {
    backgroundColor: hz.tealTint,
    borderWidth: 2.5,
    borderColor: hz.teal,
  },
  optionText: {
    flex: 1,
    fontFamily: AYAH_FONT,
    fontSize: 24,
    lineHeight: 43,
    color: hz.text,
    textAlign: "right",
    writingDirection: "rtl",
  },
  markCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  markGlyph: { fontFamily: "Nunito_900Black", fontSize: 13 },
});
