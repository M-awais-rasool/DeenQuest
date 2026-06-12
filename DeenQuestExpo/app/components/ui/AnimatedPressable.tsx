import React, { useCallback, useRef } from "react";
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { haptics } from "../../utils/haptics";

/**
 * Centralized press feedback for every tappable element in the app —
 * the same "2D press" used by the level-map nodes: the element sinks
 * down a few px and scales slightly on press-in, then springs back on
 * release (with a haptic tick on touch).
 *
 * It is a drop-in replacement for `TouchableOpacity`: it accepts the same
 * core props (`onPress`, `disabled`, `style`, `hitSlop`, …) and silently
 * ignores `activeOpacity`, so existing call sites can swap the tag name.
 *
 * Performance: a single Animated.Value driven on the native thread
 * (useNativeDriver) and kept in a ref — pressing never re-renders React.
 */

export type PressHaptic =
  | "none"
  | "light"
  | "medium"
  | "heavy"
  | "selection";

const HAPTIC_FN: Record<Exclude<PressHaptic, "none">, () => void> = {
  light: haptics.light,
  medium: haptics.medium,
  heavy: haptics.heavy,
  selection: haptics.selection,
};

export interface AnimatedPressableProps extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>;
  /** How far (px) the element travels down while pressed. */
  pressDepth?: number;
  /** Scale while pressed. 1 disables the scale part. */
  pressScale?: number;
  /** Haptic fired on press-in. Defaults to a light tick. */
  haptic?: PressHaptic;
  /** TouchableOpacity compat — accepted and ignored. */
  activeOpacity?: number;
  children?: React.ReactNode;
}

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export function AnimatedPressable({
  style,
  pressDepth = 3,
  pressScale = 0.97,
  haptic = "light",
  activeOpacity: _activeOpacity,
  disabled,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: AnimatedPressableProps) {
  // 0 = resting, 1 = fully pressed. One value drives both transforms.
  const progress = useRef(new Animated.Value(0)).current;

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      if (haptic !== "none") HAPTIC_FN[haptic]();
      Animated.timing(progress, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }).start();
      onPressIn?.(e);
    },
    [haptic, progress, onPressIn],
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      Animated.spring(progress, {
        toValue: 0,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }).start();
      onPressOut?.(e);
    },
    [progress, onPressOut],
  );

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, pressDepth],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, pressScale],
  });

  return (
    <AnimatedPressableBase
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, { transform: [{ translateY }, { scale }] }]}
    >
      {children}
    </AnimatedPressableBase>
  );
}

export default AnimatedPressable;
