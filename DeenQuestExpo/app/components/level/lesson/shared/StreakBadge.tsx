import React, { useEffect } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { Flame } from "lucide-react-native";
import { theme } from "../../../../theme/themes";
import { usePop } from "./animations";

/**
 * In-task combo counter ("🔥 ×3"). Hidden until the learner chains two or
 * more correct answers, then pops on every increase. Multi-round tasks use
 * it to make consecutive wins feel like a streak worth protecting.
 */
export function StreakBadge({ streak }: { streak: number }) {
  const { pop, style } = usePop();

  useEffect(() => {
    if (streak >= 2) pop();
  }, [streak, pop]);

  if (streak < 2) return null;

  return (
    <Animated.View style={[s.badge, style]}>
      <Flame
        size={14}
        color={theme.colors.secondary}
        fill={theme.colors.secondary}
      />
      <Text style={s.text}>×{streak}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.secondary15,
    borderColor: theme.colors.secondary35,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  text: {
    color: theme.colors.secondary,
    fontSize: 13,
    fontWeight: "900",
  },
});

export default StreakBadge;
