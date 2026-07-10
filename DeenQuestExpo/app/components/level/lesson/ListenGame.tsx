import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { TactilePressable } from "../../ui";
import { Volume2 } from "lucide-react-native";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { Speech } from "../../../utils/speech";
import { theme } from "../../../theme/themes";
import type { MiniGame } from "../../../store/services/api";
import {
  ArabicChip,
  type ChipState,
  FeedbackBanner,
  type FeedbackStatus,
} from "./shared";

type Q = { audio: string; options: string[]; correct: number };

export function ListenGame({
  game,
  onFinish,
}: {
  game: MiniGame;
  onFinish: (stats: { accuracy: number }) => void;
}) {
  const data = game.data as Record<string, any>;
  const questions = useMemo<Q[]>(() => {
    const raw = data.questions ?? data.items;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((q: any) => ({
        audio: q.audio ?? q.word ?? q.text ?? "",
        options: q.options ?? [],
        correct: q.correct ?? 0,
      }));
    }
    return [
      {
        audio: data.audio ?? data.text ?? "",
        options: data.options ?? [],
        correct: data.correct ?? 0,
      },
    ];
  }, [data]);

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  const q = questions[qIndex];
  const answered = selected !== null;
  const isCorrect = answered && selected === q.correct;
  const isLast = qIndex >= questions.length - 1;

  const speak = useCallback(() => {
    if (!q.audio) return;
    Speech.stop();
    setSpeaking(true);
    Speech.speak(q.audio, {
      language: "ar",
      rate: 0.6,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [q.audio]);

  useEffect(() => {
    const t = setTimeout(speak, 350);
    return () => {
      clearTimeout(t);
      Speech.stop();
    };
  }, [speak]);

  const select = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    if (idx === q.correct) {
      setScore((sc) => sc + 1);
      haptics.success();
      sfx.correct();
    } else {
      haptics.error();
      sfx.wrong();
    }
  };

  const cont = () => {
    if (isLast) {
      const accuracy = Math.round((score / questions.length) * 100);
      sfx.complete();
      onFinish({ accuracy });
      return;
    }
    setQIndex((i) => i + 1);
    setSelected(null);
  };

  const optState = (idx: number): ChipState => {
    if (!answered) return "idle";
    if (idx === q.correct) return "correct";
    if (idx === selected) return "wrong";
    return "disabled";
  };

  const status: FeedbackStatus = answered ? (isCorrect ? "correct" : "wrong") : null;

  return (
    <View>
      {questions.length > 1 && (
        <Text style={s.counter}>
          {qIndex + 1} / {questions.length}
        </Text>
      )}
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
        {q.options.map((opt, idx) => (
          <ArabicChip
            key={`${qIndex}-${idx}`}
            label={opt}
            size="md"
            fullWidth
            state={optState(idx)}
            onPress={answered ? undefined : () => select(idx)}
          />
        ))}
      </View>

      <FeedbackBanner
        status={status}
        wrongText="The correct one is highlighted above."
        continueLabel={isLast ? "FINISH" : "NEXT"}
        onContinue={cont}
      />
    </View>
  );
}

const s = StyleSheet.create({
  counter: {
    fontSize: 12,
    fontFamily: "Nunito_800ExtraBold",
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  speakerWrap: {
    marginBottom: 22,
  },
  speaker: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingVertical: 30,
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
  },
  options: { gap: 10 },
});

export default ListenGame;
