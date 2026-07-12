import React, { useEffect } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { theme } from "../../../../theme/themes";
import { useQuranFont } from "../../../../hooks/useQuranFont";
import { TactilePressable } from "../../../ui";
import { useFeedbackAnim } from "./animations";
import { containsArabic } from "./text";
import type { OptionState } from "./OptionRow";

export function useGridLayout(options: string[]): boolean {
  return (
    options.length >= 2 &&
    options.length <= 4 &&
    options.every((o) => containsArabic(o) && o.trim().length <= 12)
  );
}

function GridTile({
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

  useEffect(() => {
    if (state === "wrong") shake();
    else if (state === "correct") pop();
  }, [state, shake, pop]);

  const edgeColor =
    state === "correct"
      ? "#0E2C29"
      : state === "wrong"
        ? theme.colors.error
        : theme.colors.outline;

  return (
    <Animated.View style={[s.tileWrap, animStyle]}>
      <TactilePressable
        edgeColor={edgeColor}
        radius={20}
        depth={state === "correct" ? 5 : 3}
        haptic="none"
        disabled={disabled}
        dimWhenDisabled={false}
        onPress={onPress}
        faceStyle={[
          s.tile,
          state === "correct" && s.tileCorrect,
          state === "wrong" && s.tileWrong,
          state === "reveal" && s.tileReveal,
        ]}
      >
        <Text
          style={[
            s.glyph,
            { fontFamily },
            state === "correct" && s.glyphCorrect,
            state === "wrong" && s.glyphWrong,
          ]}
        >
          {text}
        </Text>
      </TactilePressable>
    </Animated.View>
  );
}

/** 2×2 grid of large Arabic answer tiles (C3 Lesson MCQ / C16 mocks). */
export function OptionGrid({
  options,
  state,
  disabled,
  onSelect,
}: {
  options: string[];
  state: (index: number) => OptionState;
  disabled: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={s.grid}>
      {options.map((opt, idx) => (
        <GridTile
          key={idx}
          text={opt}
          state={state(idx)}
          disabled={disabled}
          onPress={() => onSelect(idx)}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  tileWrap: {
    flexBasis: "47%",
    flexGrow: 1,
  },
  tile: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2.5,
    borderColor: theme.colors.outline,
    borderRadius: 20,
    paddingVertical: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  tileCorrect: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
  },
  tileWrong: {
    backgroundColor: theme.colors.errorSoft10,
    borderColor: theme.colors.error,
  },
  tileReveal: {
    backgroundColor: theme.colors.primary05,
    borderColor: theme.colors.primary30,
  },
  glyph: {
    fontSize: 54,
    lineHeight: 80,
    color: theme.colors.text,
    writingDirection: "rtl",
    textAlign: "center",
  },
  glyphCorrect: {
    color: "#5EE0CE",
  },
  glyphWrong: {
    color: theme.colors.error,
  },
});

export default OptionGrid;
