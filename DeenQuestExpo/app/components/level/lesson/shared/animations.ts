import { useEffect, useRef, useCallback } from "react";
import { Animated, Easing } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

/**
 * Reusable RN-Animated helpers that give the lesson tasks their
 * "Duolingo feel": shake on a wrong answer, a bounce on a correct one,
 * and a staggered fade-in for entrances.
 *
 * RN core Animated is used (not Reanimated) to match the existing codebase
 * patterns and avoid any new-architecture integration risk.
 *
 * IMPORTANT: the bounce scales DOWN then springs back to exactly 1 with
 * `overshootClamping`, so it can never exceed its layout box — chips never
 * overflow the screen or overlap their neighbours, even when full-width.
 */

const SHAKE_AMP = 7;

function runShake(value: Animated.Value) {
  value.setValue(0);
  Animated.sequence([
    Animated.timing(value, { toValue: SHAKE_AMP, duration: 45, useNativeDriver: true }),
    Animated.timing(value, { toValue: -SHAKE_AMP, duration: 45, useNativeDriver: true }),
    Animated.timing(value, { toValue: SHAKE_AMP * 0.7, duration: 45, useNativeDriver: true }),
    Animated.timing(value, { toValue: -SHAKE_AMP * 0.7, duration: 45, useNativeDriver: true }),
    Animated.timing(value, { toValue: SHAKE_AMP * 0.4, duration: 45, useNativeDriver: true }),
    Animated.timing(value, { toValue: 0, duration: 45, useNativeDriver: true }),
  ]).start();
}

function runPop(value: Animated.Value) {
  value.setValue(1);
  Animated.sequence([
    Animated.timing(value, {
      toValue: 0.92,
      duration: 90,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
    Animated.spring(value, {
      toValue: 1,
      friction: 4,
      tension: 220,
      overshootClamping: true, // never grows past its box → no overflow/overlap
      useNativeDriver: true,
    }),
  ]).start();
}

/**
 * Combined feedback animation for a single element: a shake (translateX)
 * and a bounce (scale) composed into ONE transform so both can be applied
 * together without one overriding the other.
 */
export function useFeedbackAnim() {
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const shake = useCallback(() => runShake(translateX), [translateX]);
  const pop = useCallback(() => runPop(scale), [scale]);

  // RN's strict `transform` tuple type rejects a mixed-key array literal;
  // cast keeps both translateX + scale composed in a single transform.
  const style = {
    transform: [{ translateX }, { scale }],
  } as unknown as StyleProp<ViewStyle>;

  return { shake, pop, style };
}

/** Horizontal shake only — for containers (e.g. an answer row). */
export function useShake() {
  const translateX = useRef(new Animated.Value(0)).current;
  const shake = useCallback(() => runShake(translateX), [translateX]);
  return { translateX, shake, style: { transform: [{ translateX }] } };
}

/** Bounded bounce only — scales down then back to 1, never overflows. */
export function usePop() {
  const scale = useRef(new Animated.Value(1)).current;
  const pop = useCallback(() => runPop(scale), [scale]);
  return { scale, pop, style: { transform: [{ scale }] } };
}

/**
 * Mount entrance: a small upward fade-in. `delay` staggers a list.
 */
export function useEntrance(delay = 0) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 320,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  return { opacity: progress, transform: [{ translateY }] };
}

/** A quick scale-in "drop into place" used when a chip lands in a slot. */
export function snapIn(scale: Animated.Value) {
  scale.setValue(0.6);
  Animated.spring(scale, {
    toValue: 1,
    friction: 5,
    tension: 200,
    overshootClamping: true,
    useNativeDriver: true,
  }).start();
}
