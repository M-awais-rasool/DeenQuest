import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";
import {
  CoachCorrectionSheet,
  FeedbackBanner,
  type FeedbackStatus,
  HintCard,
  OptionGrid,
  OptionRow,
  type OptionState,
  useGridLayout,
} from "./shared";
import { containsArabic } from "./shared";

type Question = {
  question: string;
  options: string[];
  correct: number;
  hint?: string;
  hintArabic?: string;
};

function normalize(data: Record<string, any>): Question[] {
  if (Array.isArray(data.questions) && data.questions.length > 0) {
    return data.questions.map((q: any) => ({
      question: q.question ?? "",
      options: q.options ?? [],
      correct: q.correct ?? 0,
      hint: q.hint ?? data.hint,
      hintArabic: q.hintArabic ?? data.hintArabic,
    }));
  }
  return [
    {
      question: data.question ?? "",
      options: data.options ?? [],
      correct: data.correct ?? 0,
      hint: data.hint,
      hintArabic: data.hintArabic,
    },
  ];
}

export function MCQComponent({ lesson, onComplete }: LessonComponentProps) {
  const questions = useMemo(
    () => normalize(lesson.data as Record<string, any>),
    [lesson.data],
  );

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  const q = questions[qIndex];
  const answered = selected !== null;
  const isCorrect = answered && selected === q.correct;
  const isLast = qIndex >= questions.length - 1;
  const gridLayout = useGridLayout(q.options);

  // G3: the coach steps in (instead of the plain "wrong" banner) when an
  // Arabic answer was confused with another Arabic answer.
  const coachEligible =
    answered &&
    !isCorrect &&
    selected !== null &&
    containsArabic(q.options[selected] ?? "") &&
    containsArabic(q.options[q.correct] ?? "");

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    if (idx === q.correct) {
      haptics.success();
      sfx.correct();
    } else {
      haptics.error();
      sfx.wrong();
      setWrongAttempts((n) => n + 1);
    }
  };

  const handleTryAgain = () => {
    setSelected(null);
  };

  const handleContinue = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setQIndex((i) => i + 1);
    setSelected(null);
    setWrongAttempts(0);
  };

  const optState = (idx: number): OptionState => {
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

      {!answered && <HintCard text={q.hint} arabic={q.hintArabic} />}

      {gridLayout ? (
        <OptionGrid
          key={qIndex}
          options={q.options}
          state={optState}
          disabled={answered}
          onSelect={handleSelect}
        />
      ) : (
        q.options.map((opt, idx) => (
          <OptionRow
            key={`${qIndex}-${idx}`}
            text={opt}
            state={optState(idx)}
            disabled={answered}
            onPress={() => handleSelect(idx)}
          />
        ))
      )}

      {coachEligible ? (
        <CoachCorrectionSheet
          picked={q.options[selected!]}
          correct={q.options[q.correct]}
          attempt={wrongAttempts}
          onTryAgain={handleTryAgain}
        />
      ) : (
        <FeedbackBanner
          status={status}
          wrongText={`The correct answer is highlighted above.`}
          continueLabel={isLast ? "CONTINUE" : "NEXT"}
          onContinue={handleContinue}
        />
      )}
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
  question: {
    fontSize: 18,
    color: theme.colors.text,
    fontFamily: "Nunito_800ExtraBold",
    marginBottom: 20,
    lineHeight: 26,
  },
});

export default MCQComponent;
