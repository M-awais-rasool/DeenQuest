import React, { memo, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Lock, ChevronRight } from "lucide-react-native";
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
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay: index * 100,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  useEffect(() => {
    if (!isAvailable) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    return () => pulse.stop();
  }, [isAvailable, pulseAnim]);

  const handlePressIn = useCallback(() => {
    if (isLocked) return;
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  }, [isLocked, scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

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
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLocked}
        activeOpacity={1}
        style={[s.card, isLocked && s.cardLocked]}
      >
        {/* Top accent line — very subtle */}
        {isAvailable && (
          <View
            style={[s.topAccent, { backgroundColor: course.accentColor }]}
          />
        )}

        <View style={s.inner}>
          {/* Left: Icon in soft circle */}
          <View
            style={[
              s.iconCircle,
              isAvailable
                ? { backgroundColor: course.accentColor + "18" }
                : s.iconCircleLocked,
            ]}
          >
            <Box3D
              course={course}
              isLocked={isLocked}
              pulseScale={isAvailable ? pulseAnim : STATIC_ANIM}
            />
          </View>

          {/* Center: Content */}
          <View style={s.content}>
            <Text
              style={[s.title, isLocked && s.titleLocked]}
              numberOfLines={1}
            >
              {course.title}
            </Text>
            <Text style={[s.subtitle, isLocked && s.subtitleLocked]}>
              {course.subtitle}
            </Text>

            <View style={s.metaRow}>
              <Text
                style={[
                  s.levelCount,
                  isAvailable
                    ? { color: course.accentColor }
                    : s.levelCountLocked,
                ]}
              >
                {course.levelCount}
              </Text>
            </View>
          </View>

          {/* Right: Action */}
          <View style={s.action}>
            {isAvailable ? (
              <View
                style={[s.startBtn, { backgroundColor: course.accentColor }]}
              >
                <Text style={s.startText}>Start</Text>
                <ChevronRight size={14} color="#fff" strokeWidth={2.5} />
              </View>
            ) : (
              <View style={s.lockWrap}>
                <Lock
                  size={16}
                  color={theme.colors.textMuted}
                  strokeWidth={2}
                />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const s = StyleSheet.create({
  wrapper: {
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.outline + "40",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  cardLocked: {
    opacity: 0.5,
    shadowOpacity: 0.08,
    elevation: 2,
    borderColor: theme.colors.outline + "25",
  },

  /* Very subtle top accent for available cards */
  topAccent: {
    height: 3,
    width: "100%",
    opacity: 0.8,
  },

  inner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },

  iconCircle: {
    marginTop: 10,
    width: 67,
    height: 67,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  iconCircleLocked: {
    backgroundColor: theme.colors.surfaceHigh + "50",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    gap: 2,
  },

  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  titleLocked: {
    color: theme.colors.textMuted,
  },

  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 1,
  },
  subtitleLocked: {
    opacity: 0.6,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  levelCount: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: theme.colors.primary,
  },
  levelCountLocked: {
    color: theme.colors.textMuted,
    opacity: 0.5,
  },

  action: {
    flexShrink: 0,
    justifyContent: "center",
  },

  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  startText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  lockWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceHigh,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
});
