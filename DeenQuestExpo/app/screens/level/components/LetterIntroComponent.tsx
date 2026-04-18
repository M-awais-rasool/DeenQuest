import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Volume2, ChevronRight } from "lucide-react-native";
import { Speech } from "../../../utils/speech";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";

export function LetterIntroComponent({
  lesson,
  onComplete,
}: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  // Single letter or multiple letters
  const letters: Array<{
    letter: string;
    name: string;
    transliteration?: string;
  }> = data.letters ?? [
    {
      letter: data.letter,
      name: data.name,
      transliteration: data.transliteration,
    },
  ];

  const speakLetter = useCallback((letter: string, idx: number) => {
    Speech.stop();
    setSpeakingIdx(idx);
    Speech.speak(letter, {
      language: "ar",
      rate: 0.7,
      onDone: () => setSpeakingIdx(null),
      onStopped: () => setSpeakingIdx(null),
      onError: () => setSpeakingIdx(null),
    });
  }, []);

  return (
    <View>
      {letters.map((item, idx) => (
        <TouchableOpacity
          key={idx}
          style={[s.letterCard, speakingIdx === idx && s.letterCardActive]}
          onPress={() => speakLetter(item.letter, idx)}
          activeOpacity={0.7}
        >
          <Text style={s.arabicLetter}>{item.letter}</Text>
          <Text style={s.letterName}>{item.name}</Text>
          {item.transliteration && (
            <Text style={s.transliteration}>{item.transliteration}</Text>
          )}
          <View style={s.audioRow}>
            <Volume2
              size={16}
              color={
                speakingIdx === idx
                  ? theme.colors.secondary
                  : theme.colors.primary
              }
            />
            <Text style={s.audioLabel}>Tap to hear</Text>
          </View>
        </TouchableOpacity>
      ))}

      {data.audio_hint && (
        <View style={s.hintBox}>
          <Text style={s.hintLabel}>TIP</Text>
          <Text style={s.hintText}>{data.audio_hint}</Text>
        </View>
      )}

      {data.note && (
        <View style={s.hintBox}>
          <Text style={s.hintLabel}>NOTE</Text>
          <Text style={s.hintText}>{data.note}</Text>
        </View>
      )}

      <TouchableOpacity style={s.continueBtn} onPress={onComplete}>
        <Text style={s.continueBtnText}>CONTINUE</Text>
        <ChevronRight size={18} color={theme.colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  letterCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  letterCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(136,217,130,0.08)",
  },
  arabicLetter: {
    fontSize: 72,
    color: theme.colors.primary,
    fontWeight: "300",
    marginBottom: 12,
  },
  letterName: {
    fontSize: 20,
    color: theme.colors.text,
    fontWeight: "800",
  },
  transliteration: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  audioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  audioLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    letterSpacing: 0.3,
  },
  hintBox: {
    backgroundColor: "rgba(136,217,130,0.08)",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  hintLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: theme.colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  hintText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
    gap: 6,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.primaryContainer,
  },
  continueBtnText: {
    color: theme.colors.onPrimary,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },
});
