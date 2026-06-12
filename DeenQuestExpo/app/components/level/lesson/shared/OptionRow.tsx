import React, { useEffect } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { CheckCircle2, XCircle } from "lucide-react-native";
import { theme } from "../../../../theme/themes";
import { useQuranFont } from "../../../../hooks/useQuranFont";
import { TactilePressable } from "../../../ui";
import { useFeedbackAnim } from "./animations";
import { containsArabic } from "./text";

export type OptionState = "idle" | "correct" | "wrong" | "reveal";

/**
 * Standard answer row shared by the choice-based tasks (MCQ, lightning
 * round…): tactile press, Arabic-aware typography, and the pop/shake
 * feedback driven declaratively from `state`.
 */
export function OptionRow({
  text,
  state,
  onPress,
  disabled,
}: {
  text: string;
  state: OptionState;
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

  const edgeColor =
    state === "correct"
      ? theme.colors.primary
      : state === "wrong"
        ? theme.colors.error
        : theme.colors.outline;

  return (
    <Animated.View style={animStyle}>
      <TactilePressable
        edgeColor={edgeColor}
        radius={14}
        haptic="none"
        disabled={disabled}
        dimWhenDisabled={false}
        onPress={onPress}
        style={s.optionWrap}
        faceStyle={[
          s.option,
          state === "correct" && s.optionCorrect,
          state === "wrong" && s.optionWrong,
          state === "reveal" && s.optionReveal,
        ]}
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
      </TactilePressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  optionWrap: {
    marginBottom: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
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

export default OptionRow;
