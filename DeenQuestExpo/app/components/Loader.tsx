import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Easing, Text } from "react-native";
import { theme } from "../theme/themes";

function Dot({ delay, color }: { delay: number; color: string }) {
  const y = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(0.28)).current;
  const sc = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y, {
            toValue: -12,
            duration: 370,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(op, {
            toValue: 1,
            duration: 370,
            useNativeDriver: true,
          }),
          Animated.timing(sc, {
            toValue: 1.35,
            duration: 370,
            easing: Easing.out(Easing.back(1.6)),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(y, {
            toValue: 0,
            duration: 370,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(op, {
            toValue: 0.28,
            duration: 370,
            useNativeDriver: true,
          }),
          Animated.timing(sc, {
            toValue: 0.7,
            duration: 370,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(370),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        s.dot,
        {
          backgroundColor: color,
          opacity: op,
          transform: [{ translateY: y }, { scale: sc }],
        },
      ]}
    />
  );
}

interface LoaderProps {
  label?: string;
  fullScreen?: boolean;
}

export function Loader({ label, fullScreen = false }: LoaderProps) {
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  const STAGGER = 145;

  return (
    <Animated.View
      style={[s.container, fullScreen && s.fullScreen, { opacity: fadeIn }]}
    >
      <View style={s.dotsRow}>
        <Dot delay={0} color={theme.colors.primary} />
        <Dot delay={STAGGER} color={theme.colors.secondary} />
        <Dot delay={STAGGER * 2} color={theme.colors.primary} />
      </View>
      {label != null ? <Text style={s.label}>{label}</Text> : null}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    padding: 32,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    height: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textMuted,
    letterSpacing: 2.0,
    textTransform: "uppercase",
  },
});
