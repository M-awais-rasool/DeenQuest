import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { TactilePressable } from "../../ui";
import { Volume2 } from "lucide-react-native";
import { Speech } from "../../../utils/speech";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";
import { useQuranFont } from "../../../hooks/useQuranFont";
import { FadeInView, ContinueButton } from "./shared";

export function PronunciationComponent({
  lesson,
  onComplete,
}: LessonComponentProps) {
  const { fontFamily } = useQuranFont();
  const data = lesson.data as Record<string, any>;
  const items: Array<{ arabic: string }> = data.items ?? [];
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  const speak = useCallback((text: string, idx: number) => {
    Speech.stop();
    setSpeakingIdx(idx);
    Speech.speak(text, {
      language: "ar",
      rate: 0.75,
      onDone: () => setSpeakingIdx(null),
      onStopped: () => setSpeakingIdx(null),
      onError: () => setSpeakingIdx(null),
    });
  }, []);

  return (
    <View>
      {items.map((item, idx) => (
        <FadeInView key={idx} delay={idx * 80}>
          <TactilePressable
            edgeColor={
              speakingIdx === idx
                ? theme.colors.primary
                : theme.colors.outline
            }
            radius={16}
            haptic="light"
            style={s.cardWrap}
            faceStyle={[s.card, speakingIdx === idx && s.cardActive]}
            onPress={() => speak(item.arabic, idx)}
          >
            <Text style={[s.arabic, { fontFamily }]}>{item.arabic}</Text>
            <View style={s.soundRow}>
              <Volume2
                size={18}
                color={
                  speakingIdx === idx
                    ? theme.colors.secondary
                    : theme.colors.primary
                }
              />
              <Text style={[s.tapHint, speakingIdx === idx && s.tapHintActive]}>
                {speakingIdx === idx ? "Playing…" : "Tap to hear"}
              </Text>
            </View>
          </TactilePressable>
        </FadeInView>
      ))}

      <ContinueButton onPress={onComplete} style={{ marginTop: 24 }} />
    </View>
  );
}

const s = StyleSheet.create({
  cardWrap: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  cardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary08,
  },
  arabic: {
    fontSize: 44,
    color: theme.colors.text,
    marginBottom: 12,
    writingDirection: "rtl",
  },
  soundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tapHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  tapHintActive: {
    color: theme.colors.secondary,
  },
});
