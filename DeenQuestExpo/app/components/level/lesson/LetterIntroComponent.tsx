import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { TactilePressable } from "../../ui";
import { Speech } from "../../../utils/speech";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";
import { useQuranFont } from "../../../hooks/useQuranFont";
import { FadeInView, ContinueButton } from "./shared";
import { haptics } from "../../../utils/haptics";

const TATWEEL = "ـ";
const NON_CONNECTORS = new Set(["ا", "أ", "إ", "آ", "د", "ذ", "ر", "ز", "و", "ؤ", "ة"]);

type LetterItem = {
  letter: string;
  name: string;
  transliteration?: string;
};

export function LetterIntroComponent({
  lesson,
  onComplete,
}: LessonComponentProps) {
  const { fontFamily } = useQuranFont();
  const data = lesson.data as Record<string, any>;
  const [index, setIndex] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  const letters: LetterItem[] = data.letters ?? [
    {
      letter: data.letter,
      name: data.name,
      transliteration: data.transliteration,
    },
  ];

  const item = letters[index];
  const isLast = index >= letters.length - 1;
  const showForms = item && !NON_CONNECTORS.has(item.letter);

  // Gentle float animation on the hero card (mock's dqFloat).
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1750,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1750,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);
  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });

  const speakLetter = useCallback((letter: string) => {
    Speech.stop();
    setSpeaking(true);
    Speech.speak(letter, {
      language: "ar",
      rate: 0.7,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, []);

  const handleContinue = () => {
    if (isLast) {
      onComplete();
      return;
    }
    haptics.light();
    setIndex((i) => i + 1);
  };

  if (!item) return null;

  return (
    <View>
      {/* hero letter card */}
      <FadeInView key={index} style={s.heroWrap}>
        <Animated.View
          style={[s.heroCard, { transform: [{ translateY: floatY }] }]}
        >
          <Text style={[s.heroGlyph, { fontFamily }]}>{item.letter}</Text>
        </Animated.View>

        {!!item.name && <Text style={s.letterName}>{item.name}</Text>}

        <TactilePressable
          edgeColor="#0E2C29"
          radius={16}
          depth={3}
          haptic="light"
          style={s.hearWrap}
          faceStyle={[s.hearChip, speaking && s.hearChipActive]}
          onPress={() => speakLetter(item.letter)}
        >
          <Text style={s.hearIcon}>▶</Text>
          <Text style={s.hearText}>{speaking ? "PLAYING…" : "HEAR IT"}</Text>
        </TactilePressable>
      </FadeInView>

      {/* letter forms strip */}
      {showForms && (
        <FadeInView delay={120} style={s.formsRow}>
          {[
            { form: item.letter, label: "ISOLATED" },
            { form: `${item.letter}${TATWEEL}`, label: "INITIAL" },
            { form: `${TATWEEL}${item.letter}${TATWEEL}`, label: "MEDIAL" },
            { form: `${TATWEEL}${item.letter}`, label: "FINAL" },
          ].map((f) => (
            <View key={f.label} style={s.formCell}>
              <Text style={[s.formGlyph, { fontFamily }]}>{f.form}</Text>
              <Text style={s.formLabel}>{f.label}</Text>
            </View>
          ))}
        </FadeInView>
      )}

      {/* multi-letter progress dots */}
      {letters.length > 1 && (
        <View style={s.dotsRow}>
          {letters.map((_, i) => (
            <View
              key={i}
              style={[s.dot, i <= index ? s.dotDone : s.dotPending]}
            />
          ))}
        </View>
      )}

      <ContinueButton
        label={isLast ? "CONTINUE" : "NEXT LETTER"}
        onPress={handleContinue}
        style={{ marginTop: 26 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  heroWrap: {
    alignItems: "center",
  },
  heroCard: {
    width: 230,
    height: 230,
    borderRadius: 36,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  heroGlyph: {
    fontSize: 130,
    lineHeight: 210,
    color: theme.colors.text,
    writingDirection: "rtl",
    textAlign: "center",
  },
  letterName: {
    fontSize: 20,
    color: theme.colors.text,
    fontFamily: "Nunito_800ExtraBold",
    marginTop: 16,
  },
  hearWrap: {
    marginTop: 14,
  },
  hearChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: theme.colors.primaryContainer,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 20,
  },
  hearChipActive: {
    backgroundColor: theme.colors.primary20,
  },
  hearIcon: {
    fontSize: 14,
    color: "#5EE0CE",
  },
  hearText: {
    fontSize: 13,
    fontFamily: "Nunito_900Black",
    color: "#5EE0CE",
    letterSpacing: 0.8,
  },

  formsRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 26,
  },
  formCell: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: "center",
  },
  formGlyph: {
    fontSize: 26,
    lineHeight: 44,
    color: theme.colors.text,
    writingDirection: "rtl",
  },
  formLabel: {
    fontSize: 9.5,
    fontFamily: "Nunito_800ExtraBold",
    color: "#5F7E7C",
    letterSpacing: 0.8,
    marginTop: 4,
  },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
    marginTop: 22,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotDone: {
    backgroundColor: theme.colors.primary,
  },
  dotPending: {
    borderWidth: 2,
    borderColor: "#2C464C",
  },
});
