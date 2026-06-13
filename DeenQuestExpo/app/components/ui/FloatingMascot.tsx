import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
} from "react-native";

/**
 * A static mascot image given a gentle, looping "idle" life:
 * it slowly floats up and down (bob) while subtly breathing (scale).
 *
 * Both transforms are driven by a single Animated.Value on the native
 * thread (useNativeDriver), so the loop never re-renders React and never
 * touches layout — surrounding elements stay exactly where they are.
 *
 * Matches the built-in `Animated` style used by AnimatedPressable.
 */

export interface FloatingMascotProps {
  source: ImageSourcePropType;
  /** Width & height of the (square) mascot. Default 100. */
  size?: number;
  /** How far up (px) it rises at the top of the bob. Default 10. */
  floatDistance?: number;
  /** Scale at the top of the breath. 1 disables breathing. Default 1.04. */
  breathScale?: number;
  /** Duration (ms) of one direction of the bob. Default 1600. */
  duration?: number;
  style?: StyleProp<ImageStyle>;
}

export function FloatingMascot({
  source,
  size = 100,
  floatDistance = 10,
  breathScale = 1.04,
  duration = 1600,
  style,
}: FloatingMascotProps) {
  // 0 = resting (down), 1 = top of the float.
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration]);

  const translateY = t.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -floatDistance],
  });
  const scale = t.interpolate({
    inputRange: [0, 1],
    outputRange: [1, breathScale],
  });

  return (
    <Animated.Image
      source={source}
      resizeMode="contain"
      style={[
        { width: size, height: size, transform: [{ translateY }, { scale }] },
        style,
      ]}
    />
  );
}

export default FloatingMascot;
