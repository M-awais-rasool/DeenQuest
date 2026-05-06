import React, { memo, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Lock, ChevronRight, Zap } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import { Box3D, STATIC_ANIM } from "./Box3D";
import type { CourseConfig } from "./types";

type Props = {
  course: CourseConfig;
  index: number;
  onPress: () => void;
};

export const CourseCard = memo(function CourseCard({
  course,
  index,
  onPress,
}: Props) {
  const isLocked = course.status === "locked";
  const isAvailable = course.status === "available";

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(36)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        delay: index * 110,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay: index * 110,
        tension: 55,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  useEffect(() => {
    if (!isAvailable) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1700,
          useNativeDriver: true,
        }),
      ]),
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1700,
          useNativeDriver: true,
        }),
      ]),
    );

    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 720,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    glow.start();
    shimmer.start();

    return () => {
      pulse.stop();
      glow.stop();
      shimmer.stop();
    };
  }, [isAvailable, pulseAnim, glowAnim, shimmerAnim]);

  const handlePressIn = useCallback(() => {
    if (isLocked) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  }, [isLocked, scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const shimmerX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 440],
  });

  return (
    <Animated.View
      style={[
        s.wrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      {isAvailable && (
        <Animated.View
          style={[
            s.glowRing,
            {
              borderColor: course.accentColor,
              shadowColor: course.accentColor,
              opacity: glowAnim,
            },
          ]}
        />
      )}

      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLocked}
        activeOpacity={1}
        style={[
          s.card,
          isAvailable && {
            backgroundColor: course.cardTint,
            borderColor: course.accentColor + "44",
          },
          isLocked && s.cardLocked,
        ]}
      >
        {isAvailable && (
          <Animated.View
            style={[
              s.shimmerStrip,
              {
                transform: [{ translateX: shimmerX }, { rotate: "20deg" }],
              },
            ]}
          />
        )}

        {/* Decorative 3×3 dot grid — top-right corner */}
        <View style={s.dotGrid} pointerEvents="none">
          {Array.from({ length: 9 }).map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                isAvailable && { backgroundColor: course.accentColor },
              ]}
            />
          ))}
        </View>

        <View style={s.inner}>
          <Box3D
            course={course}
            isLocked={isLocked}
            pulseScale={isAvailable ? pulseAnim : STATIC_ANIM}
          />

          <View style={s.body}>
            {/* "AVAILABLE" status pill */}
            {isAvailable && (
              <View
                style={[
                  s.statusPill,
                  {
                    backgroundColor: course.accentColor + "1C",
                    borderColor: course.accentColor + "55",
                  },
                ]}
              >
                <Zap
                  size={8}
                  color={course.accentColor}
                  strokeWidth={2.5}
                  fill={course.accentColor}
                />
                <Text style={[s.statusText, { color: course.accentColor }]}>
                  AVAILABLE
                </Text>
              </View>
            )}

            <Text
              style={[s.title, isLocked && s.titleLocked]}
              numberOfLines={1}
            >
              {course.title}
            </Text>
            <Text style={[s.sub, isLocked && s.subLocked]} numberOfLines={1}>
              {course.subtitle}
            </Text>

            {/* Subtle rule */}
            <View
              style={[
                s.rule,
                isAvailable && {
                  backgroundColor: course.accentColor + "30",
                },
              ]}
            />

            <View style={s.footer}>
              <Text style={[s.levelCount, isLocked && s.levelCountLocked]}>
                {course.levelCount}
              </Text>

              {isAvailable ? (
                <View
                  style={[s.ctaChip, { backgroundColor: course.accentColor }]}
                >
                  <Text style={s.ctaText}>START</Text>
                  <ChevronRight size={12} color="#fff" strokeWidth={3} />
                </View>
              ) : (
                <View style={s.lockedChip}>
                  <Lock
                    size={9}
                    color={theme.colors.textMuted}
                    strokeWidth={2.5}
                  />
                  <Text style={s.lockedChipText}>LOCKED</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const s = StyleSheet.create({
  wrapper: {
    position: "relative",
  },

  /* Outer glow ring — sits behind the card */
  glowRing: {
    position: "absolute",
    top: -1.5,
    left: -1.5,
    right: -1.5,
    bottom: -1.5,
    borderRadius: 22.5,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 14,
  },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
    overflow: "hidden",
  },
  cardLocked: {
    opacity: 0.5,
  },

  /* Shimmer — clipped by card overflow:hidden */
  shimmerStrip: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 70,
    backgroundColor: "rgba(255,255,255,0.038)",
    zIndex: 0,
  },

  /* Dot grid decoration */
  dotGrid: {
    position: "absolute",
    top: 12,
    right: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    width: 27,
    gap: 6,
    opacity: 0.13,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.text,
  },

  inner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    gap: 16,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },

  /* Status pill */
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 7,
  },
  statusText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.15,
  },
  titleLocked: {
    color: theme.colors.textMuted,
  },
  sub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  subLocked: {
    opacity: 0.55,
  },

  /* Thin horizontal rule between text and footer */
  rule: {
    height: 1,
    backgroundColor: theme.colors.outline,
    marginTop: 10,
    borderRadius: 1,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  levelCount: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  levelCountLocked: {
    color: theme.colors.textMuted,
  },

  ctaChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    gap: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },

  lockedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceHigh,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  lockedChipText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
