import React, { memo, useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Lock } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import type { CourseConfig } from "./types";

const BOX_W = 74;
const BOX_H = BOX_W;
const BOX_DEPTH = 11;

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
  const iconColor = isLocked ? theme.colors.textMuted : "#ffffff";

  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLocked) return;

    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.delay(3200),
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 680,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -2.8,
          duration: 1900,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 2.8,
          duration: 1900,
          useNativeDriver: true,
        }),
      ]),
    );

    const sparkle = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    shimmer.start();
    float.start();
    sparkle.start();

    return () => {
      shimmer.stop();
      float.stop();
      sparkle.stop();
    };
  }, [isLocked, shimmerAnim, floatAnim, sparkleAnim]);

  const sparkleOdd = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.9, 0.15, 0.9],
  });
  
  const sparkleEven = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.15, 0.9, 0.15],
  });

  return (
    <Animated.View style={[s.outer, { transform: [{ scale: pulseScale }] }]}>
      {!isLocked && (
        <>
          <View style={[s.glowOuter, { backgroundColor: course.glowColor }]} />
        </>
      )}

      {/* Main face */}
      <View style={[s.face, { backgroundColor: faceBg }]}>
        <View style={s.topGloss} />

        {!isLocked && (
          <>
            <View
              style={[s.bracketTL, { borderColor: "rgba(255,255,255,0.52)" }]}
            />
            <View
              style={[s.bracketBR, { borderColor: "rgba(255,255,255,0.22)" }]}
            />
          </>
        )}

        <Animated.View
          style={[
            s.iconWrap,
            !isLocked && { transform: [{ translateY: floatAnim }] },
          ]}
        >
          {isLocked ? (
            <Lock size={28} color={iconColor} strokeWidth={2.2} />
          ) : (
            <Icon size={32} color={iconColor} strokeWidth={1.7} />
          )}
        </Animated.View>
      </View>

      {!isLocked && (
        <>
          <Animated.View style={[s.sparkleA, { opacity: sparkleOdd }]} />
          <Animated.View style={[s.sparkleB, { opacity: sparkleEven }]} />
          <Animated.View style={[s.sparkleC, { opacity: sparkleOdd }]} />
        </>
      )}
    </Animated.View>
  );
});

const s = StyleSheet.create({
  outer: {
    width: BOX_W + 6,
    height: BOX_H + BOX_DEPTH + 8,
    flexShrink: 0,
  },
  glowOuter: {
    position: "absolute",
    top: -15,
    left: -15,
    right: -8,
    bottom: 5,
    borderRadius: (BOX_W + 40) / 2,
    opacity: 0.3,
  },
  glowCore: {
    position: "absolute",
    top: -9,
    left: -9,
    right: -5,
    bottom: 4,
    borderRadius: (BOX_W + 18) / 2,
    opacity: 0.16,
  },
  face: {
    position: "absolute",
    top: 0,
    left: 0,
    width: BOX_W,
    height: BOX_H,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 14,
  },
  topGloss: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  bracketTL: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 14,
    height: 14,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRadius: 3,
  },
  bracketBR: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 9,
    height: 9,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderRadius: 2,
  },
  iconWrap: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  sparkleA: {
    position: "absolute",
    top: 4,
    right: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  sparkleB: {
    position: "absolute",
    top: BOX_H / 3,
    right: -2,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  sparkleC: {
    position: "absolute",
    bottom: BOX_DEPTH + 10,
    left: 2,
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
});
