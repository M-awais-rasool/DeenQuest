import React, { memo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronDown, Flame } from "lucide-react-native";

import { WORLD, type WorldFamily } from "./worldTheme";
import type { StreakOrigin } from "./StreakPopup";

/**
 * Menu button, the course the learner is inside, and the streak.
 *
 * The course chip is centred rather than left-aligned because it is the one
 * control here that changes what the whole screen shows — the mockup gives it
 * the middle of the bar and a badge, and treats the streak as a counter off to
 * the side rather than a peer.
 */
export const PathTopBar = memo(function PathTopBar({
  title,
  badge,
  streak,
  family,
  onStreakPress,
  onCoursesPress,
}: {
  title: string;
  /** Single letter in the chip's badge. */
  badge: string;
  streak: number;
  family: WorldFamily;
  onStreakPress?: (origin: StreakOrigin) => void;
  onCoursesPress?: (origin: StreakOrigin) => void;
}) {
  const streakRef = useRef<View>(null);
  const coursesRef = useRef<View>(null);

  const measureThen = (
    ref: React.RefObject<View | null>,
    cb?: (origin: StreakOrigin) => void,
  ) => {
    if (!cb) return;
    ref.current?.measureInWindow((x, y, w, h) => {
      cb({ x: x + w / 2, y: y + h / 2 });
    });
  };

  return (
    <View style={s.row}>
      {/* The mockup opens with a hamburger. There is no drawer behind it in
          this app, so the chip takes the full width instead of sitting next to
          a control that does nothing. */}
      <View style={s.chipHost}>
        <Pressable
          ref={coursesRef}
          onPress={() => measureThen(coursesRef, onCoursesPress)}
          style={({ pressed }) => [
            s.chip,
            { borderColor: family.chipBorder },
            pressed && s.pressed,
          ]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Course: ${title}. Tap to switch.`}
        >
          <View style={[s.badge, { backgroundColor: family.chipBadge }]}>
            <Text style={[s.badgeText, { color: family.chipBadgeInk }]}>{badge}</Text>
          </View>
          <Text style={s.chipTitle} numberOfLines={1}>
            {title}
          </Text>
          <ChevronDown size={14} color={family.chipBadge} strokeWidth={2.5} />
        </Pressable>
      </View>

      <Pressable
        ref={streakRef}
        onPress={() => measureThen(streakRef, onStreakPress)}
        style={({ pressed }) => [s.streak, pressed && s.pressed]}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`${streak} day streak`}
      >
        <Flame size={14} color={WORLD.gold} fill={WORLD.gold} />
        <Text style={s.streakValue}>{streak}</Text>
      </Pressable>
    </View>
  );
});

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  chipHost: {
    flex: 1,
    alignItems: "flex-start",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: WORLD.panel,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Nunito_900Black",
    includeFontPadding: false,
  },
  chipTitle: {
    color: WORLD.text,
    fontSize: 16,
    fontFamily: "Nunito_900Black",
  },
  streak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: WORLD.panel,
    borderWidth: 1,
    borderColor: "rgba(239,182,90,0.4)",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  streakValue: {
    color: WORLD.gold,
    fontSize: 13,
    fontFamily: "Nunito_900Black",
  },
  pressed: {
    opacity: 0.65,
  },
});
