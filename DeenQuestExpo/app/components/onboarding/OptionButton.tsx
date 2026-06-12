import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "../ui";
import {
  BookMarked,
  BookOpen,
  Calendar,
  CircleDot,
  Flame,
  Gem,
  Hand,
  Heart,
  HelpCircle,
  Landmark,
  Leaf,
  Library,
  Medal,
  Moon,
  ScrollText,
  Search,
  Share2,
  Smartphone,
  Sprout,
  Type,
  Users,
  Zap,
} from "lucide-react-native";
import { haptics } from "../../utils/haptics";
import { theme } from "../../theme/themes";
import { COLORS, FONTS } from "./constants";
import type { OnboardingOption } from "../../utils/onboardingConfig";

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Sprout,
  BookOpen,
  Library,
  Medal,
  BookMarked,
  Landmark,
  Hand,
  ScrollText,
  Gem,
  Type,
  Zap,
  Leaf,
  Flame,
  CircleDot,
  Users,
  Heart,
  Calendar,
  Moon,
  Share2,
  Search,
  Smartphone,
  HelpCircle,
};

interface Props {
  option: OnboardingOption;
  selected: boolean;
  onPress: () => void;
  delayIndex: number;
  stepKey: number;
}

export default function OptionButton({ option, selected, onPress, delayIndex, stepKey }: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressDepth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      delay: 550 + delayIndex * 80,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  }, [stepKey, delayIndex, anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
    extrapolate: "clamp",
  });

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const handlePressIn = () => {
    haptics.selection(); 
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 20,
        bounciness: 0,
      }),
      Animated.timing(pressDepth, {
        toValue: 4,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
        tension: 120,
      }),
      Animated.spring(pressDepth, {
        toValue: 0,
        useNativeDriver: true,
        friction: 4,
        tension: 120,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { transform: [{ translateY }, { scale: scaleAnim }], opacity },
      ]}
    >
      <AnimatedPressable
        pressDepth={0}
        pressScale={1}
        haptic="none"
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        <View style={[styles.rim, selected && styles.rimSelected]} />
        <Animated.View
          style={[
            styles.cap,
            selected && styles.capSelected,
            { transform: [{ translateY: pressDepth }] },
          ]}
        >
          {(() => {
            const IconComponent = ICON_MAP[option.icon];
            return IconComponent ? (
              <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                <IconComponent
                  size={selected ? 24 : 22}
                  color={selected ? COLORS.text : COLORS.textMuted}
                />
              </View>
            ) : null;
          })()}
          <Text
            style={[styles.label, selected && styles.labelSelected]}
            numberOfLines={2}
          >
            {option.label}
          </Text>
        </Animated.View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    height: 64,
  },
  touchable: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  rim: {
    position: "absolute",
    top: 4,
    left: 0,
    right: 0,
    height: 60,
    borderRadius: 16,
    backgroundColor: COLORS.outline,
  },
  rimSelected: {
    backgroundColor: COLORS.primaryContainer,
  },
  cap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.outline,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  capSelected: {
    borderColor: COLORS.primary,
  },
  iconWrap: {
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapSelected: {
    width: 24,
    height: 24,
  },
  label: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  labelSelected: {
    color: COLORS.text,
    fontWeight: "700",
  },
});
