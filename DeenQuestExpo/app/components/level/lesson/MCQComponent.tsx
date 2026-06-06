import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { CheckCircle2, XCircle } from "lucide-react-native";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { theme } from "../../../theme/themes";
import { useQuranFont } from "../../../hooks/useQuranFont";
import type { LessonComponentProps } from "./types";
import {
  FeedbackBanner,
  type FeedbackStatus,
  useFeedbackAnim,
  containsArabic,
} from "./shared";

type Question = { question: string; options: string[]; correct: number };

function normalize(data: Record<string, any>): Question[] {
  if (Array.isArray(data.questions) && data.questions.length > 0) {
    return data.questions.map((q: any) => ({
      question: q.question ?? "",
      options: q.options ?? [],
      correct: q.correct ?? 0,
    }));
  }
  return [
    {
      question: data.question ?? "",
      options: data.options ?? [],
      correct: data.correct ?? 0,
    },
  ];
}

type OptState = "idle" | "correct" | "wrong" | "reveal";

function OptionRow({
  text,
  state,
  onPress,
  disabled,
}: {
  text: string;
  state: OptState;
  onPress: () => void;
  disabled: boolean;
}) {
  const { fontFamily } = useQuranFont();
  const { shake, pop, style: animStyle } = useFeedbackAnim();
  const isAr = containsArabic(text);

  useEffect(() => {
    if (state === "wrong") shake();
    else if (state === "correct") pop();
  }, [state, shake, pop]);

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[
          s.option,
          state === "correct" && s.optionCorrect,
          state === "wrong" && s.optionWrong,
          state === "reveal" && s.optionReveal,
        ]}
        activeOpacity={0.8}
        disabled={disabled}
        onPress={onPress}
      >
        <Text
          style={[
            s.optionText,
            isAr && { fontFamily, fontSize: 26, writingDirection: "rtl" },
            state === "correct" && { color: theme.colors.primary },
            state === "wrong" && { color: theme.colors.error },
          ]}
        >
          {text}
        </Text>
        {state === "correct" && (
          <CheckCircle2 size={20} color={theme.colors.primary} />
        )}
        {state === "wrong" && <XCircle size={20} color={theme.colors.error} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function MCQComponent({ lesson, onComplete }: LessonComponentProps) {
  const questions = useMemo(
    () => normalize(lesson.data as Record<string, any>),
    [lesson.data],
  );

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const q = questions[qIndex];
  const answered = selected !== null;
  const isCorrect = answered && selected === q.correct;
  const isLast = qIndex >= questions.length - 1;

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    if (idx === q.correct) {
      haptics.success();
      sfx.correct();
    } else {
      haptics.error();
      sfx.wrong();
    }
  };

  const handleContinue = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setQIndex((i) => i + 1);
    setSelected(null);
  };

  const optState = (idx: number): OptState => {
    if (!answered) return "idle";
    if (idx === q.correct) return idx === selected ? "correct" : "reveal";
    if (idx === selected) return "wrong";
    return "idle";
  };

  const status: FeedbackStatus = answered ? (isCorrect ? "correct" : "wrong") : null;

  return (
    <View>
      {questions.length > 1 && (
        <Text style={s.counter}>
          Question {qIndex + 1} of {questions.length}
        </Text>
      )}
      <Text style={s.question}>{q.question}</Text>

      {q.options.map((opt, idx) => (
        <OptionRow
          key={`${qIndex}-${idx}`}
          text={opt}
          state={optState(idx)}
          disabled={answered}
          onPress={() => handleSelect(idx)}
        />
      ))}

      <FeedbackBanner
        status={status}
        wrongText={`The correct answer is highlighted above.`}
        continueLabel={isLast ? "CONTINUE" : "NEXT"}
        onContinue={handleContinue}
      />
    </View>
  );
}

const s = StyleSheet.create({
  counter: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  question: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: "800",
    marginBottom: 20,
    lineHeight: 26,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: theme.colors.outline,
  },
  optionCorrect: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary10,
  },
  optionWrong: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.errorSoft10,
  },
  optionReveal: {
    borderColor: theme.colors.primary30,
    backgroundColor: theme.colors.primary05,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "600",
    flex: 1,
  },
});

export default MCQComponent;
