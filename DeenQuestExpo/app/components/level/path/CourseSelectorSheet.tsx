import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, ChevronRight } from "lucide-react-native";

import type { CourseType } from "../../../store/services/api";
import { theme } from "../../../theme/themes";
import { hexToRgba } from "../map/constants";
import { COURSE_CATALOG } from "./courseCatalog";
import type { StreakOrigin } from "./StreakPopup";

interface CourseSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
  onClosed?: () => void;
  activeCourse: CourseType;
  onSelectCourse: (courseType: CourseType) => void;
  origin: StreakOrigin | null;
}

export function CourseSelectorSheet({
  visible,
  onClose,
  onClosed,
  activeCourse,
  onSelectCourse,
  origin,
}: CourseSelectorSheetProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const [cardRect, setCardRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const insets = useSafeAreaInsets();

  // Mount on open; on close, animate out then unmount.
  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    Animated.timing(progress, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setMounted(false);
      onClosed?.();
    });
  }, [visible, mounted, progress, onClosed]);

  // Spring open once we know where the card sits (so it can grow from the chip).
  useEffect(() => {
    if (!visible || !mounted || !cardRect) return;
    progress.setValue(0);
    Animated.spring(progress, {
      toValue: 1,
      friction: 8,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [visible, mounted, cardRect, progress]);

  const onCardLayout = (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    setCardRect((prev) =>
      prev && prev.width === width && prev.height === height
        ? prev
        : { x, y, width, height },
    );
  };

  if (!mounted) return null;

  const startTX =
    origin && cardRect ? origin.x - (cardRect.x + cardRect.width / 2) : 0;
  const startTY =
    origin && cardRect ? origin.y - (cardRect.y + cardRect.height / 2) : 0;

  const opacity = progress.interpolate({
    inputRange: [0, 0.18, 1],
    outputRange: [0, 1, 1],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [startTX, 0],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [startTY, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 1],
  });

  return (
    <View style={s.overlay}>
      <Animated.View
        style={[s.backdrop, { opacity: progress }]}
        pointerEvents="none"
      />
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <Animated.View
        style={[
          s.card,
          { paddingTop: insets.top + 18 },
          { opacity, transform: [{ translateX }, { translateY }, { scale }] },
        ]}
        onLayout={onCardLayout}
        onStartShouldSetResponder={() => true}
      >
        <Text style={s.title}>Courses</Text>
        <Text style={s.subtitle}>
          Pick a journey — your progress in each is kept separately
        </Text>

        <View style={s.list}>
          {COURSE_CATALOG.map((course) => {
            const isActive = course.courseType === activeCourse;
            const accent = course.palette[0].accent;
            const { Icon } = course;

            return (
              <Pressable
                key={course.courseType}
                onPress={() => {
                  if (isActive) {
                    onClose();
                    return;
                  }
                  onSelectCourse(course.courseType);
                }}
                style={({ pressed }) => [
                  s.row,
                  isActive && {
                    borderColor: accent,
                    backgroundColor: hexToRgba(accent, 0.08),
                  },
                  pressed && s.rowPressed,
                ]}
              >
                <View
                  style={[
                    s.iconBadge,
                    {
                      backgroundColor: hexToRgba(accent, 0.16),
                      borderColor: hexToRgba(accent, 0.45),
                    },
                  ]}
                >
                  <Icon size={22} color={accent} strokeWidth={2.4} />
                </View>

                <View style={s.rowText}>
                  <Text style={s.rowTitle} numberOfLines={1}>
                    {course.title}
                  </Text>
                  <Text style={s.rowSubtitle} numberOfLines={2}>
                    {course.subtitle}
                  </Text>
                </View>

                {isActive ? (
                  <View style={[s.checkBadge, { backgroundColor: accent }]}>
                    <Check
                      size={15}
                      color={course.palette[0].deep}
                      strokeWidth={3.4}
                    />
                  </View>
                ) : (
                  <ChevronRight
                    size={20}
                    color={theme.colors.textMuted}
                    strokeWidth={2.6}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 22,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderColor: theme.colors.outline + "40",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 14,
  },
  title: {
    color: theme.colors.text,
    fontSize: 26,
    fontFamily: "Nunito_900Black",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 3,
  },
  list: {
    marginTop: 18,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceLow,
  },
  rowPressed: {
    opacity: 0.65,
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: theme.colors.text,
    fontSize: 16.5,
    fontFamily: "Nunito_900Black",
  },
  rowSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 2,
    fontFamily: "Nunito_600SemiBold",
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
});
