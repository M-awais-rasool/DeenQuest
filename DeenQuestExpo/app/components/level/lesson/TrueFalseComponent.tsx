import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Check, X } from "lucide-react-native";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { theme } from "../../../theme/themes";
import { useQuranFont } from "../../../hooks/useQuranFont";
import { TactilePressable } from "../../ui";
import type { LessonComponentProps } from "./types";
import {
  FeedbackBanner,
  type FeedbackStatus,
  StreakBadge,
  useFeedbackAnim,
  useEntrance,
} from "./shared";

type Round = { prompt: string; arabic?: string; answer: boolean };

/**
 * Quick-fire true/false rounds: a statement (optionally with a large
 * Arabic display) and two big tactile YES/NO buttons. Consecutive correct
 * answers build a streak; the banner advances between rounds.
 */
export function TrueFalseComponent({ lesson, onComplete }: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;
  const rounds = useMemo<Round[]>(
    () =>
      (data.rounds ?? []).map((r: any) => ({
        prompt: r.prompt ?? "",
        arabic: r.arabic,
        answer: !!r.answer,
      })),
    [data],
  );
  const instruction: string = data.instruction ?? "True or false?";

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);

  const round = rounds[index];
  const answered = selected !== null;
  const isCorrect = answered && selected === round.answer;
  const isLast = index >= rounds.length - 1;

  const handleSelect = (value: boolean) => {
    if (answered) return;
    setSelected(value);
    if (value === round.answer) {
      haptics.success();
      sfx.correct();
      setStreak((n) => n + 1);
    } else {
      haptics.error();
      sfx.wrong();
      setStreak(0);
    }
  };

  const handleContinue = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  };

  const status: FeedbackStatus = answered
    ? isCorrect
      ? "correct"
      : "wrong"
    : null;

  if (!round) return null;

  return (
    <View>
      <View style={s.headerRow}>
        <Text style={s.counter}>
          {index + 1} of {rounds.length}
        </Text>
        <StreakBadge streak={streak} />
      </View>

      <Text style={s.question}>{round.prompt || instruction}</Text>

      {round.arabic ? <ArabicCard key={index} text={round.arabic} /> : null}

      <View style={s.btnRow}>
        <AnswerButton
          label="TRUE"
          value={true}
          icon="check"
          selected={selected}
          correctAnswer={answered ? round.answer : null}
          onPress={() => handleSelect(true)}
        />
        <AnswerButton
          label="FALSE"
          value={false}
          icon="x"
          selected={selected}
          correctAnswer={answered ? round.answer : null}
          onPress={() => handleSelect(false)}
        />
      </View>

      <FeedbackBanner
        status={status}
        correctText={streak >= 2 ? `MashaAllah! ${streak} in a row 🔥` : undefined}
        wrongText={`The correct answer was ${round.answer ? "TRUE" : "FALSE"}.`}
        continueLabel={isLast ? "CONTINUE" : "NEXT"}
        onContinue={handleContinue}
      />
    </View>
  );
}

function ArabicCard({ text }: { text: string }) {
  const { fontFamily } = useQuranFont();
  const entrance = useEntrance();
  return (
    <Animated.View style={[s.arabicCard, entrance]}>
      <Text style={[s.arabicText, { fontFamily }]}>{text}</Text>
    </Animated.View>
  );
}

function AnswerButton({
  label,
  value,
  icon,
  selected,
  correctAnswer,
  onPress,
}: {
  label: string;
  value: boolean;
  icon: "check" | "x";
  selected: boolean | null;
  correctAnswer: boolean | null;
  onPress: () => void;
}) {
  const { shake, pop, style: animStyle } = useFeedbackAnim();
  const answered = selected !== null;
  const isChosen = selected === value;
  const isRight = correctAnswer === value;

  React.useEffect(() => {
    if (!answered || !isChosen) return;
    if (isRight) pop();
    else shake();
  }, [answered, isChosen, isRight, pop, shake]);

  const showCorrect = answered && isRight;
  const showWrong = answered && isChosen && !isRight;

  const edgeColor = showCorrect
    ? theme.colors.primaryContainer
    : showWrong
      ? theme.colors.errorStrong
      : theme.colors.outline;
  const fg = showCorrect
    ? theme.colors.primary
    : showWrong
      ? theme.colors.error
      : theme.colors.text;
  const IconCmp = icon === "check" ? Check : X;

  return (
    <Animated.View style={[s.btnHalf, animStyle]}>
      <TactilePressable
        edgeColor={edgeColor}
        radius={16}
        haptic="none"
        disabled={answered}
        dimWhenDisabled={false}
        onPress={onPress}
        faceStyle={[
          s.answerFace,
          showCorrect && s.answerCorrect,
          showWrong && s.answerWrong,
        ]}
      >
        <IconCmp size={26} color={fg} strokeWidth={3} />
        <Text style={[s.answerLabel, { color: fg }]}>{label}</Text>
      </TactilePressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  counter: {
    fontSize: 12,
    fontFamily: "Nunito_800ExtraBold",
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  question: {
    fontSize: 18,
    color: theme.colors.text,
    fontFamily: "Nunito_800ExtraBold",
    marginBottom: 18,
    lineHeight: 26,
  },
  arabicCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    paddingVertical: 28,
    alignItems: "center",
    marginBottom: 20,
  },
  arabicText: {
    fontSize: 64,
    color: theme.colors.text,
    writingDirection: "rtl",
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
  },
  btnHalf: {
    flex: 1,
  },
  answerFace: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  answerCorrect: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary10,
  },
  answerWrong: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.errorSoft10,
  },
  answerLabel: {
    fontSize: 16,
    fontFamily: "Nunito_900Black",
    letterSpacing: 1,
  },
});

export default TrueFalseComponent;
