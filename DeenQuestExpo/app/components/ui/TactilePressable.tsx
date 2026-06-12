import React, { useCallback, useRef } from "react";
import {
  Animated,
  Pressable,
  View,
  StyleSheet,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { haptics } from "../../utils/haptics";
import { theme } from "../../theme/themes";
import type { PressHaptic } from "./AnimatedPressable";

/**
 * The full 3D "level node" press effect, generalized for any button:
 * a colored edge layer sits `depth` px below the face, and the face
 * translates down over it while pressed — exactly the interaction on
 * the level-map nodes (50ms press-in, springy release, haptic tick).
 *
 * Layout: the wrapper reserves `depth` px of bottom padding; the edge
 * fills that gap so the face + edge read as one solid button.
 *
 * Performance: one native-driven Animated.Value in a ref — no re-renders.
 */

const HAPTIC_FN: Record<Exclude<PressHaptic, "none">, () => void> = {
  light: haptics.light,
  medium: haptics.medium,
  heavy: haptics.heavy,
  selection: haptics.selection,
};

export interface TactilePressableProps
  extends Omit<PressableProps, "style"> {
  /** Color of the bottom edge revealed below the face. */
  edgeColor: string;
  /** Styles for the face (background, border, padding…). */
  faceStyle?: StyleProp<ViewStyle>;
  /** Outer wrapper styles (margins, alignSelf, width…). */
  style?: StyleProp<ViewStyle>;
  /** Edge height in px — how far the face sinks when pressed. */
  depth?: number;
  /** Border radius shared by face and edge. */
  radius?: number;
  /** Haptic fired on press-in. */
  haptic?: PressHaptic;
  /** Extra scale-down while pressed (1 = none). */
  pressScale?: number;
  /** Fade the button while disabled (turn off when a parent styles disabled states itself). */
  dimWhenDisabled?: boolean;
  /**
   * Opaque backing painted beneath the face so translucent face tints
   * composite over it rather than over the edge. Defaults to the surface
   * color; match it to the screen behind the button if that differs.
   */
  faceUnderlayColor?: string;
  children?: React.ReactNode;
}

export function TactilePressable({
  edgeColor,
  faceStyle,
  style,
  depth = 4,
  radius = 16,
  haptic = "medium",
  pressScale = 1,
  dimWhenDisabled = true,
  faceUnderlayColor = theme.colors.surface,
  disabled,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: TactilePressableProps) {
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
    outputRange: [0, depth],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, pressScale],
  });

  // The edge sits behind the face, so a translucent face background would
  // let the (often bright) edge bleed through and wreck text contrast.
  // Render the face on an opaque underlay so tints composite over the
  // surface color instead — the edge stays visible only below the face.
  const flatFace = StyleSheet.flatten(faceStyle) ?? {};

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        style,
        { paddingBottom: depth },
        disabled && dimWhenDisabled && s.disabled,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          s.edge,
          { top: depth, borderRadius: radius, backgroundColor: edgeColor },
        ]}
      />
      <Animated.View
        style={[
          {
            borderRadius: radius,
            backgroundColor: faceUnderlayColor,
            transform: [{ translateY }, { scale }],
          },
          flatFace.flex != null && { flex: flatFace.flex },
        ]}
      >
        <View style={[{ borderRadius: radius }, faceStyle]}>{children}</View>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  edge: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  disabled: {
    opacity: 0.4,
  },
});

export default TactilePressable;
