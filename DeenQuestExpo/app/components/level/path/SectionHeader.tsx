import React, { memo, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BookOpen, Lock, CircleCheckBig } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import { hexToRgba } from "../map/constants";
import type { PathSection } from "./types";

interface SectionHeaderProps {
  section: PathSection;
}

export const SectionHeader = memo(function SectionHeader({
  section,
}: SectionHeaderProps) {
  const { colors, status, number, title, subtitle, completed, total } = section;
  const isLocked = status === "locked";
  const isComplete = status === "completed";
  const pct = total > 0 ? completed / total : 0;

  const fill = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fill, {
      toValue: pct,
      duration: 450,
      useNativeDriver: false,
    }).start();
  }, [pct, fill]);

  if (isLocked) {
    return (
      <View style={s.wrap}>
        <View style={[s.bar, s.lockedBar]}>
          <View style={s.textBlock}>
            <Text style={s.lockedLabel}>SECTION {number}</Text>
            <Text style={s.lockedTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={s.lockedSub} numberOfLines={1}>
              Finish Section {number - 1} to unlock
            </Text>
          </View>
          <View style={s.lockedBadge}>
            <Lock size={18} color={theme.colors.textMuted} strokeWidth={2.4} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <LinearGradient
        colors={[colors.deep, theme.colors.surfaceLow]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.bar, { borderColor: hexToRgba(colors.base, 0.4) }]}
      >
        <View style={s.textBlock}>
          <View style={s.labelRow}>
            <Text style={[s.label, { color: colors.accent }]}>
              SECTION {number}
            </Text>
            <View style={s.labelDot} />
            <Text style={[s.label, { color: colors.accent }]}>
              {isComplete ? "COMPLETE" : `${completed} / ${total}`}
            </Text>
          </View>
          <Text style={s.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={s.sub} numberOfLines={1}>
            {subtitle}
          </Text>

          {!isComplete && (
            <View style={s.track}>
              <Animated.View
                style={[
                  s.trackFill,
                  {
                    width: fill.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
          )}
        </View>

        <View style={s.badge}>
          {isComplete ? (
            <CircleCheckBig
              size={20}
              color={theme.colors.white}
              strokeWidth={2.5}
            />
          ) : (
            <BookOpen size={18} color={theme.colors.white} strokeWidth={2.5} />
          )}
        </View>
      </LinearGradient>
    </View>
  );
});

const s = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.background,
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 84,
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  lockedBar: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  textBlock: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 3,
  },
  label: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontFamily: "Nunito_900Black",
    letterSpacing: 1.5,
  },
  labelDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  title: {
    color: theme.colors.white,
    fontSize: 19,
    fontFamily: "Nunito_900Black",
    letterSpacing: 0.2,
  },
  sub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12.5,
    marginTop: 2,
  },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.18)",
    marginTop: 10,
    overflow: "hidden",
  },
  trackFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  lockedLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontFamily: "Nunito_900Black",
    letterSpacing: 1.5,
    marginBottom: 3,
    opacity: 0.7,
  },
  lockedTitle: {
    color: theme.colors.textMuted,
    fontSize: 18,
    fontFamily: "Nunito_900Black",
  },
  lockedSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  lockedBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceHigh,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
});
