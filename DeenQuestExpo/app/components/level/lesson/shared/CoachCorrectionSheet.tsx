import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";
import { theme } from "../../../../theme/themes";
import { useQuranFont } from "../../../../hooks/useQuranFont";
import { TactilePressable, AnimatedPressable } from "../../../ui";
import { Speech } from "../../../../utils/speech";
import { haptics } from "../../../../utils/haptics";

const LETTER_INFO: Record<string, { name: string; dots: string }> = {
  "ا": { name: "ALIF", dots: "NO DOTS" },
  "ب": { name: "BA", dots: "1 DOT BELOW" },
  "ت": { name: "TA", dots: "2 DOTS" },
  "ث": { name: "THA", dots: "3 DOTS" },
  "ج": { name: "JEEM", dots: "1 DOT INSIDE" },
  "ح": { name: "HHA", dots: "NO DOTS" },
  "خ": { name: "KHA", dots: "1 DOT ABOVE" },
  "د": { name: "DAL", dots: "NO DOTS" },
  "ذ": { name: "DHAL", dots: "1 DOT ABOVE" },
  "ر": { name: "RA", dots: "NO DOTS" },
  "ز": { name: "ZAY", dots: "1 DOT ABOVE" },
  "س": { name: "SEEN", dots: "NO DOTS" },
  "ش": { name: "SHEEN", dots: "3 DOTS" },
  "ص": { name: "SAD", dots: "NO DOTS" },
  "ض": { name: "DAD", dots: "1 DOT ABOVE" },
  "ط": { name: "TTA", dots: "NO DOTS" },
  "ظ": { name: "DHA", dots: "1 DOT ABOVE" },
  "ع": { name: "AYN", dots: "NO DOTS" },
  "غ": { name: "GHAYN", dots: "1 DOT ABOVE" },
  "ف": { name: "FA", dots: "1 DOT ABOVE" },
  "ق": { name: "QAF", dots: "2 DOTS" },
  "ك": { name: "KAF", dots: "NO DOTS" },
  "ل": { name: "LAM", dots: "NO DOTS" },
  "م": { name: "MEEM", dots: "NO DOTS" },
  "ن": { name: "NUN", dots: "1 DOT ABOVE" },
  "ه": { name: "HA", dots: "NO DOTS" },
  "و": { name: "WAW", dots: "NO DOTS" },
  "ي": { name: "YA", dots: "2 DOTS BELOW" },
};

function tileLabel(letter: string): string {
  const info = LETTER_INFO[letter];
  if (!info) return "CORRECT ONE";
  return `${info.name} · ${info.dots}`;
}

export function CoachCorrectionSheet({
  picked,
  correct,
  attempt,
  onTryAgain,
}: {
  /** The wrong Arabic answer the learner tapped. */
  picked: string;
  /** The correct Arabic answer. */
  correct: string;
  /** How many wrong tries on this question so far (1-based). */
  attempt: number;
  onTryAgain: () => void;
}) {
  const { fontFamily } = useQuranFont();
  const insets = useSafeAreaInsets();
  const [speaking, setSpeaking] = useState(false);
  const slide = useRef(new Animated.Value(420)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    haptics.error();
    Animated.parallel([
      Animated.timing(slide, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slide, backdrop]);

  const hearBoth = () => {
    if (speaking) return;
    setSpeaking(true);
    Speech.stop();
    Speech.speak(picked, {
      language: "ar",
      rate: 0.65,
      onDone: () => {
        Speech.speak(correct, {
          language: "ar",
          rate: 0.65,
          onDone: () => setSpeaking(false),
          onStopped: () => setSpeaking(false),
          onError: () => setSpeaking(false),
        });
      },
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const pickedInfo = LETTER_INFO[picked];
  const correctInfo = LETTER_INFO[correct];
  const subtitle =
    attempt >= 2
      ? `${attempt} tries on this one — let's slow down`
      : "Let's slow down and look closely";

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onTryAgain}
    >
      {/* dimmed quiz behind the sheet (mock fades the page to 35%) */}
      <Animated.View style={[s.backdrop, { opacity: backdrop }]} />

      <View style={s.sheetAnchor} pointerEvents="box-none">
        <Animated.View
          style={[
            s.sheet,
            { paddingBottom: Math.max(insets.bottom, 20) + 10 },
            { transform: [{ translateY: slide }] },
          ]}
        >
          {/* coach header */}
      <View style={s.headerRow}>
        <LinearGradient
          colors={["#2ED9C0", "#0E6B5E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={s.coachIcon}
        >
          <Sparkles size={21} color="#06302B" strokeWidth={2} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <View style={s.titleRow}>
            <Text style={s.title}>Coach</Text>
            <View style={s.aiChip}>
              <Text style={s.aiChipText}>AI</Text>
            </View>
          </View>
          <Text style={s.subtitle}>{subtitle}</Text>
        </View>
      </View>

      {/* message + comparison tiles */}
      <View style={s.msgBox}>
        <Text style={s.msg}>
          You picked{" "}
          <Text style={[s.msgArabic, { fontFamily }]}>{picked}</Text>
          {pickedInfo ? ` (${pickedInfo.name})` : ""} — but the answer is{" "}
          <Text style={[s.msgArabicCorrect, { fontFamily }]}>{correct}</Text>
          {correctInfo ? ` (${correctInfo.name})` : ""}. Look ↓
        </Text>
        <View style={s.tileRow}>
          <View style={[s.tile, s.tileWrong]}>
            <Text style={[s.tileGlyph, { fontFamily }, s.tileGlyphWrong]}>
              {picked}
            </Text>
            <Text style={[s.tileLabel, { color: theme.colors.error }]}>
              {tileLabel(picked)}
            </Text>
          </View>
          <View style={[s.tile, s.tileCorrect]}>
            <Text style={[s.tileGlyph, { fontFamily }, s.tileGlyphCorrect]}>
              {correct}
            </Text>
            <Text style={[s.tileLabel, { color: "#5EE0CE" }]}>
              {tileLabel(correct)}
            </Text>
          </View>
        </View>
      </View>

          {/* actions */}
          <View style={s.btnRow}>
            <TactilePressable
              style={{ flex: 1 }}
              faceStyle={s.tryBtn}
              edgeColor={theme.colors.shadowGreen}
              radius={16}
              depth={4}
              haptic="medium"
              onPress={onTryAgain}
            >
              <Text style={s.tryBtnText}>TRY AGAIN</Text>
            </TactilePressable>
            <AnimatedPressable style={s.hearBtn} onPress={hearBoth}>
              <Text style={s.hearIcon}>▶</Text>
              <Text style={s.hearBtnText}>
                {speaking ? "PLAYING…" : "HEAR BOTH"}
              </Text>
            </AnimatedPressable>
          </View>

          {/* grab bar (mock's home-indicator strip) */}
          <View style={s.grabBar} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,13,15,0.65)",
  },
  sheetAnchor: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0F2A2C",
    borderTopWidth: 2,
    borderTopColor: theme.colors.primary,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingTop: 22,
    paddingHorizontal: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 24,
  },
  grabBar: {
    width: 130,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#1B9484",
    alignSelf: "center",
    marginTop: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  coachIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  title: { fontSize: 14.5, fontFamily: "Nunito_900Black", color: theme.colors.text },
  aiChip: {
    backgroundColor: theme.colors.primaryContainer,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiChipText: {
    fontSize: 8.5,
    fontFamily: "Nunito_900Black",
    color: "#5EE0CE",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Nunito_600SemiBold",
    color: "#7FB5AD",
    marginTop: 1,
  },

  msgBox: {
    backgroundColor: "rgba(11,21,23,0.6)",
    borderWidth: 1,
    borderColor: "#1E4A44",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 15,
    marginTop: 13,
  },
  msg: {
    fontSize: 13,
    lineHeight: 21,
    fontFamily: "Nunito_700Bold",
    color: "#D7E7E5",
  },
  msgArabic: {
    fontSize: 17,
    color: theme.colors.error,
  },
  msgArabicCorrect: {
    fontSize: 17,
    color: "#5EE0CE",
  },
  tileRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  tile: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  tileWrong: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.error,
  },
  tileCorrect: {
    backgroundColor: theme.colors.primaryContainer,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  tileGlyph: {
    fontSize: 34,
    lineHeight: 52,
    writingDirection: "rtl",
  },
  tileGlyphWrong: { color: theme.colors.error },
  tileGlyphCorrect: { color: "#5EE0CE" },
  tileLabel: {
    fontSize: 10,
    fontFamily: "Nunito_800ExtraBold",
    letterSpacing: 0.6,
    marginTop: 6,
  },

  btnRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 14,
  },
  tryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  tryBtnText: {
    fontSize: 13.5,
    fontFamily: "Nunito_900Black",
    color: theme.colors.onPrimary,
    letterSpacing: 0.7,
  },
  hearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  hearIcon: { fontSize: 12, color: theme.colors.textMuted },
  hearBtnText: {
    fontSize: 13.5,
    fontFamily: "Nunito_900Black",
    color: theme.colors.textMuted,
  },
});

export default CoachCorrectionSheet;
