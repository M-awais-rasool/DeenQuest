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
  const slideAnim = useRef(new Animated.Value(28)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  /* Staggered entrance */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 480,
        delay: index * 90,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 480,
        delay: index * 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  /* Gentle pulse for the unlocked / available course */
  useEffect(() => {
    if (!isAvailable) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
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
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View
      style={[
        s.card,
        isAvailable && {
          borderColor: course.accentColor,
          backgroundColor: course.cardTint,
        },
        isLocked && s.cardLocked,
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
        style={s.inner}
      >
        <Box3D
          course={course}
          isLocked={isLocked}
          pulseScale={isAvailable ? pulseAnim : STATIC_ANIM}
        />

        <View style={s.body}>
          <Text style={[s.title, isLocked && s.titleLocked]} numberOfLines={1}>
            {course.title}
          </Text>
          <Text style={[s.sub, isLocked && s.subLocked]} numberOfLines={1}>
            {course.subtitle}
          </Text>

          <View style={s.footer}>
            <Text style={[s.levelCount, isLocked && s.levelCountLocked]}>
              {course.levelCount}
            </Text>
            {isAvailable ? (
              <View
                style={[s.ctaChip, { backgroundColor: course.accentColor }]}
              >
                <Text style={s.ctaChipText}>START</Text>
                <ChevronRight size={11} color="#fff" strokeWidth={2.5} />
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
      </TouchableOpacity>
    </Animated.View>
  );
});

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
    overflow: "hidden",
  },
  cardLocked: {
    opacity: 0.55,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 18,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  titleLocked: {
    color: theme.colors.textMuted,
  },
  sub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  subLocked: {
    opacity: 0.65,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 3,
  },
  ctaChipText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
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
