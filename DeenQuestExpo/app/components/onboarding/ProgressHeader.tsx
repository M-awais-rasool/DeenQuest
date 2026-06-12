import React from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "../ui";
import { ArrowLeft } from "lucide-react-native";
import { COLORS} from "./constants";

interface Props {
  currentStep: number;
  isTransitioning: boolean;
  onBack: () => void;
  progressAnim: Animated.Value;
}

export default function ProgressHeader({ currentStep, isTransitioning, onBack, progressAnim }: Props) {
  const canGoBack = currentStep > 0;

  return (
    <View style={styles.header}>
      <AnimatedPressable
        style={[styles.backButton, !canGoBack && styles.backButtonHidden]}
        onPress={onBack}
        disabled={!canGoBack || isTransitioning}
        activeOpacity={0.7}
      >
        <ArrowLeft size={22} color={COLORS.text} />
      </AnimatedPressable>

      <View style={styles.barContainer}>
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.fill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonHidden: {
    opacity: 0,
  },
  barContainer: {
    flex: 1,
    gap: 8,
  },
  track: {
    width: "100%",
    height: 20,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  fill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.outline,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
});
