import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { TactilePressable } from "../../ui";
import { Volume2 } from "lucide-react-native";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { trackAnswer } from "../../../services/telemetry";
import { Speech } from "../../../utils/speech";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";
import {
  ArabicChip,
  type ChipState,
  FeedbackBanner,
  type FeedbackStatus,
} from "./shared";

export function ListenChooseComponent({
  lesson,
  onComplete,
  levelId,
  lessonIndex,
}: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;
  const audio: string = data.audio ?? data.text ?? "";
  const options: string[] = data.options ?? [];
  const correct: number = data.correct ?? 0;
  const meaning: string | undefined = data.meaning;
  const instruction: string = data.instruction ?? "Listen, then choose what you heard";

  const [selected, setSelected] = useState<number | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const answered = selected !== null;
  const isCorrect = answered && selected === correct;
  const shownAtRef = useRef(Date.now());

  const speak = useCallback(() => {
    if (!audio) return;
    Speech.stop();
    setSpeaking(true);
    Speech.speak(audio, {
      language: "ar",
      rate: 0.6,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [audio]);

  // Auto-play once on mount.
  useEffect(() => {
    const t = setTimeout(speak, 350);
    return () => {
      clearTimeout(t);
      Speech.stop();
    };
  }, [speak]);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    trackAnswer({
      interaction: "choice",
      skillTags: lesson.skill_tags,
      correct: idx === correct,
      expected: options[correct],
      chosen: options[idx],
      latencyMs: Date.now() - shownAtRef.current,
      levelId,
      lessonIndex,
    });
    if (idx === correct) {
      haptics.success();
      sfx.correct();
    } else {
      haptics.error();
      sfx.wrong();
    }
  };

  const optState = (idx: number): ChipState => {
    if (!answered) return "idle";
    if (idx === correct) return "correct";
    if (idx === selected) return "wrong";
    return "disabled";
  };

  const status: FeedbackStatus = answered ? (isCorrect ? "correct" : "wrong") : null;

  return (
    <View>
      <Text style={s.instruction}>{instruction}</Text>

      <TactilePressable
        edgeColor={speaking ? theme.colors.secondary : theme.colors.outline}
        radius={20}
        haptic="light"
        style={s.speakerWrap}
        faceStyle={[s.speaker, speaking && s.speakerActive]}
        onPress={speak}
      >
        <Volume2
          size={40}
          color={speaking ? theme.colors.secondary : theme.colors.primary}
        />
        <Text style={s.speakerLabel}>
          {speaking ? "Playing…" : "Tap to listen again"}
        </Text>
      </TactilePressable>

      <View style={s.options}>
        {options.map((opt, idx) => (
          <ArabicChip
            key={idx}
            label={opt}
            size="md"
            fullWidth
            state={optState(idx)}
            onPress={answered ? undefined : () => handleSelect(idx)}
          />
        ))}
      </View>

      <FeedbackBanner
        status={status}
        correctText={meaning ? `Correct! 🎉\n${meaning}` : "MashaAllah! Correct 🎉"}
        wrongText="The correct one is highlighted above."
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
    textAlign: "center",
  },
  speakerWrap: {
    marginBottom: 24,
  },
  speaker: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingVertical: 32,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    gap: 10,
  },
  speakerActive: {
    borderColor: theme.colors.secondary,
    backgroundColor: theme.colors.secondary08,
  },
  speakerLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontFamily: "Nunito_700Bold",
    letterSpacing: 0.3,
  },
  options: {
    gap: 10,
  },
});

export default ListenChooseComponent;
