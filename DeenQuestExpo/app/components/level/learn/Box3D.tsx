import React, { memo } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Lock } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import type { CourseConfig } from "./types";

const BOX_W = 80;
const BOX_DEPTH = 9;

export const STATIC_ANIM = new Animated.Value(1);

type Props = {
  course: CourseConfig;
  isLocked: boolean;
  pulseScale: Animated.Value;
};

export const Box3D = memo(function Box3D({
  course,
  isLocked,
  pulseScale,
}: Props) {
  const { Icon } = course;
  const faceBg = isLocked ? theme.colors.surfaceHigh : course.accentColor;
  const depthBg = isLocked ? "#282828" : course.depthColor;
  const iconColor = isLocked ? theme.colors.textMuted : "#ffffff";

  return (
    <Animated.View style={[s.outer, { transform: [{ scale: pulseScale }] }]}>
      {!isLocked && (
        <View style={[s.glow, { backgroundColor: course.glowColor }]} />
      )}
      <View style={[s.depthBack, { backgroundColor: depthBg }]} />
      <View style={[s.depthMid, { backgroundColor: depthBg }]} />
      <View style={[s.face, { backgroundColor: faceBg }]}>
        <View style={s.highlight} />
        <View style={s.bottomShade} />
        <View style={s.iconArea}>
          {isLocked ? (
            <Lock size={28} color={iconColor} strokeWidth={2} />
          ) : (
            <Icon size={34} color={iconColor} strokeWidth={1.8} />
          )}
        </View>
      </View>
    </Animated.View>
  );
});

const s = StyleSheet.create({
  outer: {
    width: BOX_W,
    height: BOX_W + BOX_DEPTH,
    flexShrink: 0,
  },
  glow: {
    position: "absolute",
    top: -14,
    left: -14,
    right: -14,
    bottom: -14 + BOX_DEPTH,
    borderRadius: (BOX_W + 28) / 2,
    opacity: 0.55,
  },
  depthBack: {
    position: "absolute",
    top: BOX_DEPTH,
    left: 6,
    right: -6,
    height: BOX_W,
    borderRadius: 18,
    opacity: 0.38,
  },
  depthMid: {
    position: "absolute",
    top: BOX_DEPTH / 2,
    left: 3,
    right: -3,
    height: BOX_W,
    borderRadius: 18,
    opacity: 0.58,
  },
  face: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: BOX_W,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  highlight: {
    position: "absolute",
    top: 9,
    left: 10,
    right: 10,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 6,
  },
  bottomShade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  iconArea: {
    justifyContent: "center",
    alignItems: "center",
  },
});
