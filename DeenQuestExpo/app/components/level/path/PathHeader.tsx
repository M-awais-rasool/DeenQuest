import React, { memo, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Flame } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import type { StreakOrigin } from "./StreakPopup";

const MOON = require("../../../../assets/level/moon.png");

interface PathHeaderProps {
  streak: number;
  onStreakPress?: (origin: StreakOrigin) => void;
}

export const PathHeader = memo(function PathHeader({
  streak,
  onStreakPress,
}: PathHeaderProps) {
  const streakRef = useRef<View>(null);

  const openStreak = () => {
    if (!onStreakPress) return;
    streakRef.current?.measureInWindow((x, y, w, h) => {
      onStreakPress({ x: x + w / 2, y: y + h / 2 });
    });
  };

  return (
    <View style={s.wrap}>
      <Image source={MOON} style={s.moon} resizeMode="contain" />

      <View style={s.titles}>
        <Text style={s.title} numberOfLines={1}>
          Your Learning Journey
        </Text>
        <Text style={s.sub} numberOfLines={1}>
          Small steps. Big rewards.
        </Text>
      </View>

      <Pressable
        ref={streakRef}
        onPress={openStreak}
        hitSlop={8}
        style={({ pressed }) => [s.streak, pressed && s.pressed]}
      >
        <Flame
          size={15}
          color={theme.colors.secondary}
          fill={theme.colors.secondary}
        />
        <Text style={s.streakText}>Day {streak}</Text>
      </Pressable>
    </View>
  );
});

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 10,
  },
  moon: {
    width: 38,
    height: 38,
  },
  titles: {
    flex: 1,
  },
  title: {
    color: theme.colors.white,
    fontSize: 17.5,
    fontFamily: "Nunito_900Black",
    letterSpacing: 0,
  },
  sub: {
    color: "#93ADB3",
    fontSize: 12.5,
    fontFamily: "Nunito_500Medium",
    marginTop: 1,
  },
  streak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(58, 45, 20, 0.62)",
    borderWidth: 1.5,
    borderColor: "rgba(239, 182, 90, 0.55)",
  },
  pressed: {
    opacity: 0.65,
  },
  streakText: {
    color: "#F3E7C8",
    fontSize: 14,
    fontFamily: "Nunito_900Black",
  },
});
