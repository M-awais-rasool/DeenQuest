import React, { memo, useRef } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Flame, Zap } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import type { StreakOrigin } from "./StreakPopup";

interface PathTopBarProps {
  title: string;
  streak: number;
  xp: number;
  /** Fired when the streak chip is tapped, with its window-space center. */
  onStreakPress?: (origin: StreakOrigin) => void;
}

export const PathTopBar = memo(function PathTopBar({
  title,
  streak,
  xp,
  onStreakPress,
}: PathTopBarProps) {
  const streakRef = useRef<View>(null);

  const handleStreakPress = () => {
    if (!onStreakPress) return;
    streakRef.current?.measureInWindow((x, y, w, h) => {
      onStreakPress({ x: x + w / 2, y: y + h / 2 });
    });
  };

  return (
    <View style={s.wrap}>
      <View style={s.row}>
        <View style={s.titleBlock}>
          <Text style={s.label}>LEARNING PATH</Text>
          <Text style={s.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={s.stats}>
          <Pressable
            ref={streakRef}
            onPress={handleStreakPress}
            style={({ pressed }) => [s.stat, s.streakChip, pressed && s.statPressed]}
            hitSlop={6}
          >
            <Flame
              size={15}
              color={theme.colors.secondary}
              fill={theme.colors.secondary}
            />
            <Text style={[s.statValue, s.streakValue]}>{streak}</Text>
          </Pressable>
          <Stat
            icon={
              <Zap
                size={15}
                color={theme.colors.secondary}
                fill={theme.colors.secondary}
              />
            }
            value={xp}
          />
        </View>
      </View>
    </View>
  );
});

function Stat({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <View style={s.stat}>
      {icon}
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline + "40",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleBlock: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    color: theme.colors.primary,
    fontSize: 10,
    fontFamily: "Nunito_900Black",
    letterSpacing: 2,
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontFamily: "Nunito_900Black",
    letterSpacing: 0.2,
    marginTop: 2,
  },
  stats: {
    flexDirection: "row",
    gap: 8,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  streakChip: {
    backgroundColor: "#3A2F16",
    borderWidth: 1.5,
    borderColor: theme.colors.secondary,
  },
  statPressed: {
    opacity: 0.6,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: "Nunito_900Black",
  },
  streakValue: {
    color: theme.colors.secondary,
  },
});
