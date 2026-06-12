import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { Zap } from "lucide-react-native";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";
import {
  FeedbackBanner,
  type FeedbackStatus,
  OptionRow,
  type OptionState,
  StreakBadge,
} from "./shared";

type Question = { question: string; options: string[]; correct: number };

const DEFAULT_SECONDS = 8;

/**
 * Timed quiz round: every question runs against a draining countdown bar.
 * Answering stops the clock; running out counts as a wrong answer. Builds
 * urgency + streaks for an arcade feel, ends with a score summary.
 */
export function LightningRoundComponent({ lesson, onComplete }: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;
  const seconds: number = data.seconds ?? DEFAULT_SECONDS;
  const questions = useMemo<Question[]>(
    () =>
      (data.questions ?? []).map((q: any) => ({
        question: q.question ?? "",
        options: q.options ?? [],
        correct: q.correct ?? 0,
      })),
    [data],
  );

  const [qIndex, setQIndex] = useState(0);
  // null = unanswered, -1 = timed out, otherwise the chosen option index.
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [barWidth, setBarWidth] = useState(0);

  const timer = useRef(new Animated.Value(1)).current;
  const answeredRef = useRef(false);

  const q = questions[qIndex];
  const answered = selected !== null;
  const isCorrect = answered && selected === q?.correct;
  const isLast = qIndex >= questions.length - 1;

  useEffect(() => {
    answeredRef.current = false;
    timer.setValue(1);
    const anim = Animated.timing(timer, {
      toValue: 0,
      duration: seconds * 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished && !answeredRef.current) {
        answeredRef.current = true;
        setSelected(-1);
        setStreak(0);
        haptics.error();
        sfx.wrong();
      }
    });
    return () => anim.stop();
  }, [qIndex, seconds, timer]);

  const handleSelect = (idx: number) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    timer.stopAnimation();
    setSelected(idx);
    if (idx === q.correct) {
      haptics.success();
      sfx.correct();
      setScore((n) => n + 1);
      setStreak((n) => n + 1);
    } else {
      haptics.error();
      sfx.wrong();
      setStreak(0);
    }
  };

  const handleContinue = () => {
    if (isLast) {
      sfx.complete();
      onComplete();
      return;
    }
    setSelected(null);
    setQIndex((i) => i + 1);
  };

  const optState = (idx: number): OptionState => {
    if (!answered) return "idle";
    if (idx === q.correct) return idx === selected ? "correct" : "reveal";
    if (idx === selected) return "wrong";
    return "idle";
  };

  if (!q) return null;

  // Left-anchored shrink: scale around center + compensating translate.
  const translateX = timer.interpolate({
    inputRange: [0, 1],
    outputRange: [-barWidth / 2, 0],
  });

  const status: FeedbackStatus = answered
    ? isCorrect
      ? "correct"
      : "wrong"
    : null;

  return (
    <View>
      <View style={s.headerRow}>
        <View style={s.scorePill}>
          <Zap
            size={14}
            color={theme.colors.secondary}
            fill={theme.colors.secondary}
          />
          <Text style={s.scoreText}>
            {score} / {questions.length}
          </Text>
        </View>
        <StreakBadge streak={streak} />
        <Text style={s.counter}>
          {qIndex + 1} of {questions.length}
        </Text>
      </View>

      <View
        style={s.timerTrack}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View
          style={[
            s.timerFill,
            { transform: [{ translateX }, { scaleX: timer }] },
          ]}
        />
      </View>

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
        correctText={
          isLast
            ? `Lightning round complete — ${score} / ${questions.length} ⚡`
            : streak >= 2
              ? `Fast and right! ${streak} in a row 🔥`
              : "Fast and right! ⚡"
        }
        wrongText={
          selected === -1
            ? "Time's up! The correct answer is highlighted."
            : "Not quite — the correct answer is highlighted."
        }
        continueLabel={isLast ? "CONTINUE" : "NEXT"}
        onContinue={handleContinue}
      />
    </View>
  );
}

const s = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  scorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.colors.secondary12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreText: {
    color: theme.colors.secondary,
    fontSize: 13,
    fontWeight: "900",
  },
  counter: {
    marginLeft: "auto",
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  timerTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceHigh,
    overflow: "hidden",
    marginBottom: 18,
  },
  timerFill: {
    flex: 1,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary,
  },
  question: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: "800",
    marginBottom: 20,
    lineHeight: 26,
  },
});

export default LightningRoundComponent;
