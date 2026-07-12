import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";
import {
  FeedbackBanner,
  type FeedbackStatus,
  OptionGrid,
  OptionRow,
  type OptionState,
  StreakBadge,
  useGridLayout,
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
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  // Per-question outcome for the result dots row (C16 mock).
  const [results, setResults] = useState<boolean[]>([]);

  const timer = useRef(new Animated.Value(1)).current;
  const answeredRef = useRef(false);

  const q = questions[qIndex];
  const answered = selected !== null;
  const isCorrect = answered && selected === q?.correct;
  const isLast = qIndex >= questions.length - 1;
  const gridLayout = useGridLayout(q?.options ?? []);

  useEffect(() => {
    answeredRef.current = false;
    timer.setValue(1);
    setSecondsLeft(seconds);
    const countdown = setInterval(
      () => setSecondsLeft((v) => Math.max(0, v - 1)),
      1000,
    );
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
        setResults((r) => [...r, false]);
        haptics.error();
        sfx.wrong();
      }
    });
    return () => {
      clearInterval(countdown);
      anim.stop();
    };
  }, [qIndex, seconds, timer]);

  const handleSelect = (idx: number) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    timer.stopAnimation();
    setSelected(idx);
    const right = idx === q.correct;
    setResults((r) => [...r, right]);
    if (right) {
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
      {/* timer bar + countdown (C16 mock) */}
      <View style={s.timerRow}>
        <View
          style={s.timerTrack}
          onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View
            style={[
              s.timerFill,
              { transform: [{ translateX }, { scaleX: timer }] },
            ]}
          >
            <LinearGradient
              colors={["#F0838C", "#F79A59"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Text style={s.timerText}>
          0:{String(secondsLeft).padStart(2, "0")}
        </Text>
      </View>

      {/* Q / CORRECT stats */}
      <View style={s.statsRow}>
        <View>
          <Text style={s.statValue}>Q{qIndex + 1}</Text>
          <Text style={s.statLabel}>QUESTION</Text>
        </View>
        <View style={s.streakSlot}>
          <StreakBadge streak={streak} />
        </View>
        <View style={s.statRight}>
          <Text style={[s.statValue, { color: "#5EE0CE" }]}>{score}</Text>
          <Text style={s.statLabel}>CORRECT</Text>
        </View>
      </View>

      <Text style={s.question}>{q.question}</Text>

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

      {/* per-question result dots */}
      <View style={s.dotsRow}>
        {questions.map((_, idx) => {
          const result = results[idx];
          const answeredDot = idx < results.length;
          return (
            <View
              key={idx}
              style={[
                s.dot,
                answeredDot
                  ? result
                    ? s.dotRight
                    : s.dotWrong
                  : s.dotPending,
              ]}
            />
          );
        })}
      </View>

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
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  timerTrack: {
    flex: 1,
    height: 12,
    borderRadius: 7,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  timerFill: {
    flex: 1,
    borderRadius: 7,
    overflow: "hidden",
  },
  timerText: {
    fontSize: 18,
    fontFamily: "Nunito_900Black",
    color: "#F79A59",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 16,
  },
  streakSlot: {
    alignItems: "center",
  },
  statRight: {
    alignItems: "flex-end",
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Nunito_900Black",
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 10.5,
    fontFamily: "Nunito_800ExtraBold",
    color: "#5F7E7C",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  question: {
    fontSize: 21,
    color: theme.colors.text,
    fontFamily: "Nunito_900Black",
    marginBottom: 20,
    lineHeight: 28,
    textAlign: "center",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
    marginTop: 22,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotRight: {
    backgroundColor: theme.colors.primary,
  },
  dotWrong: {
    backgroundColor: theme.colors.error,
  },
  dotPending: {
    borderWidth: 2,
    borderColor: "#2C464C",
  },
});

export default LightningRoundComponent;
