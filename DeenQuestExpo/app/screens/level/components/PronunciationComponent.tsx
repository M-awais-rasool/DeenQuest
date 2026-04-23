import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Volume2, ChevronRight } from "lucide-react-native";
import { Speech } from "../../../utils/speech";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";

export function PronunciationComponent({
  lesson,
  onComplete,
}: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;
  const items: Array<{ arabic: string; sound: string }> = data.items ?? [];
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
        <TouchableOpacity
          key={idx}
          style={[s.card, speakingIdx === idx && s.cardActive]}
          onPress={() => speak(item.arabic, idx)}
          activeOpacity={0.7}
        >
          <Text style={s.arabic}>{item.arabic}</Text>
          <View style={s.soundRow}>
            <Volume2
              size={18}
              color={
                speakingIdx === idx
                  ? theme.colors.secondary
                  : theme.colors.primary
              }
            />
            <Text style={[s.sound, speakingIdx === idx && s.soundActive]}>
              {item.sound}
            </Text>
          </View>
          <Text style={s.tapHint}>Tap to hear</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={s.continueBtn} onPress={onComplete}>
        <Text style={s.continueBtnText}>CONTINUE</Text>
        <ChevronRight size={18} color={theme.colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 12,
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
  },
  soundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sound: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  soundActive: {
    color: theme.colors.secondary,
  },
  tapHint: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 8,
    letterSpacing: 0.5,
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
