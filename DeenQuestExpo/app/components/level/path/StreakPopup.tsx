import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Flame, Check, X } from "lucide-react-native";
import { theme } from "../../../theme/themes";

export interface StreakOrigin {
  x: number;
  y: number;
}

interface StreakPopupProps {
  visible: boolean;
  onClose: () => void;
  /** Current streak count. */
  streak: number;
  /** 7 booleans — index 0 = 6 days ago, index 6 = today. */
  weekly: boolean[];
  /** Window-space center of the streak chip the popup grows from. */
  origin: StreakOrigin | null;
}

/** Day-of-week letters indexed by Date.getDay() (Sun..Sat). */
const DAY_LETTERS = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];

interface DayCell {
  letter: string;
  completed: boolean;
  isToday: boolean;
}

function buildDays(weekly: boolean[]): DayCell[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return {
      letter: DAY_LETTERS[d.getDay()] ?? "",
      completed: !!weekly[i],
      isToday: i === 6,
    };
  });
}

export function StreakPopup({
  visible,
  onClose,
  streak,
  weekly,
  origin,
}: StreakPopupProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const [cardRect, setCardRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const days = useMemo(() => buildDays(weekly), [weekly]);
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
      if (finished) setMounted(false);
    });
  }, [visible, mounted, progress]);

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
      prev && prev.width === width && prev.height === height ? prev : { x, y, width, height },
    );
  };

  if (!mounted) return null;

  // Translate the card from the chip's center to its resting position as it scales up.
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
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
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
          <View style={s.headerRow}>
            <View style={s.flameWrap}>
              <Flame
                size={72}
                color={theme.colors.warning}
                fill={theme.colors.warning}
                strokeWidth={1.5}
              />
              <Text style={s.flameCount}>{streak}</Text>
            </View>
            <View style={s.headerText}>
              <Text style={s.title}>Streak</Text>
              <Text style={s.subtitle}>
                Finish a game every day to build your streak
              </Text>
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.weekRow}>
            {days.map((d, i) => (
              <View key={i} style={s.day}>
                <Text style={[s.dayLabel, d.isToday && s.dayLabelToday]}>
                  {d.letter}
                </Text>
                <View
                  style={[
                    s.circle,
                    d.completed ? s.circleDone : s.circleMissed,
                    d.isToday && s.circleToday,
                  ]}
                >
                  {d.completed ? (
                    <Check
                      size={18}
                      color={theme.colors.onPrimary}
                      strokeWidth={3}
                    />
                  ) : (
                    <X
                      size={16}
                      color={theme.colors.textMuted}
                      strokeWidth={3}
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  // Full-width sheet flush to the top of the screen, rounded only at the
  // bottom — it drops down from under the status bar like the reference.
  card: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 22,
    paddingBottom: 26,
    borderBottomWidth: 1,
    borderColor: theme.colors.outline + "40",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  flameWrap: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  flameCount: {
    position: "absolute",
    top: 34,
    color: theme.colors.white,
    fontSize: 22,
    fontFamily: "Nunito_900Black",
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: theme.colors.text,
    fontSize: 26,
    fontFamily: "Nunito_900Black",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.outline + "40",
    marginVertical: 18,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  day: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  dayLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontFamily: "Nunito_800ExtraBold",
  },
  dayLabelToday: {
    color: theme.colors.secondary,
  },
  circle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  circleDone: {
    backgroundColor: theme.colors.primary,
  },
  circleMissed: {
    backgroundColor: theme.colors.surfaceHigh,
  },
  circleToday: {
    borderWidth: 2.5,
    borderColor: theme.colors.secondary,
  },
});
