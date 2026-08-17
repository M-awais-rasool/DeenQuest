import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Rect } from "react-native-svg";
import { dq } from "../../theme/designTokens";
import { CertificateSeal } from "./CertificateSeal";

export const CERT_TIMELINE = {
  borderOuter: 80,
  borderInner: 360,
  seal: 700,
  corners: 820,
  label: 1000,
  title: 1180,
  awardedTo: 1480,
  name: 1630,
  shine: 1300,
  meta: 1900,
  message: 2050,
  nextPhase: 2350,
  actions: 2550,
};

const BORDER_DRAW_MS = 720;
const CORNER_STAGGER = 90;
const FRAME_PADDING = 8;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const CORNERS: StyleProp<ViewStyle>[] = [
  { top: 6, left: 8 },
  { top: 6, right: 8 },
  { bottom: 6, right: 8 },
  { bottom: 6, left: 8 },
];

function DrawnBorders({
  width,
  height,
  animate,
  outerColor,
  innerColor,
}: {
  width: number;
  height: number;
  animate: boolean;
  outerColor: string;
  innerColor: string;
}) {
  const outer = useRef(new Animated.Value(0)).current;
  const inner = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) {
      outer.setValue(1);
      inner.setValue(1);
      return;
    }
    const run = (value: Animated.Value, delay: number) =>
      Animated.timing(value, {
        toValue: 1,
        duration: BORDER_DRAW_MS,
        delay,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      });
    const anim = Animated.parallel([
      run(outer, CERT_TIMELINE.borderOuter),
      run(inner, CERT_TIMELINE.borderInner),
    ]);
    anim.start();
    return () => anim.stop();
  }, [outer, inner, animate]);

  if (width <= 0 || height <= 0) return null;

  const outerPerimeter = 2 * (width - 2 + (height - 2));
  const innerW = width - FRAME_PADDING * 2;
  const innerH = height - FRAME_PADDING * 2;
  const innerPerimeter = 2 * (innerW + innerH);

  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      width={width}
      height={height}
    >
      <AnimatedRect
        x={1}
        y={1}
        width={Math.max(width - 2, 0)}
        height={Math.max(height - 2, 0)}
        rx={8}
        fill="none"
        stroke={outerColor}
        strokeWidth={2}
        strokeDasharray={outerPerimeter}
        strokeDashoffset={outer.interpolate({
          inputRange: [0, 1],
          outputRange: [outerPerimeter, 0],
        })}
      />
      <AnimatedRect
        x={FRAME_PADDING}
        y={FRAME_PADDING}
        width={Math.max(innerW, 0)}
        height={Math.max(innerH, 0)}
        rx={4}
        fill="none"
        stroke={innerColor}
        strokeWidth={1.5}
        strokeDasharray={innerPerimeter}
        strokeDashoffset={inner.interpolate({
          inputRange: [0, 1],
          outputRange: [innerPerimeter, 0],
        })}
      />
    </Svg>
  );
}

function Corner({
  position,
  delay,
  animate,
}: {
  position: StyleProp<ViewStyle>;
  delay: number;
  animate: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.spring(progress, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [progress, delay, animate]);

  // RN's transform tuple type rejects a mixed-key array literal.
  const style = {
    opacity: progress,
    transform: [
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
      {
        rotate: progress.interpolate({
          inputRange: [0, 1],
          outputRange: ["-120deg", "0deg"],
        }),
      },
    ],
  } as unknown as StyleProp<ViewStyle>;

  return (
    <Animated.View style={[s.cornerWrap, position, style]} pointerEvents="none">
      <Text style={s.corner}>✦</Text>
    </Animated.View>
  );
}

function Shine({ delay }: { delay: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(2800),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [progress, delay]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.shine,
        {
          opacity: progress.interpolate({
            inputRange: [0, 0.15, 0.85, 1],
            outputRange: [0, 1, 1, 0],
          }),
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-260, 340],
              }),
            },
            { rotate: "18deg" },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={["transparent", "rgba(255,240,200,0.16)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

function useSealEntrance(delay: number, animate: boolean) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.spring(progress, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [progress, delay, animate]);

  return {
    opacity: progress,
    transform: [
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
      {
        rotate: progress.interpolate({
          inputRange: [0, 1],
          outputRange: ["-38deg", "0deg"],
        }),
      },
    ],
  } as unknown as StyleProp<ViewStyle>;
}

export function CertificateFrame({
  children,
  sealId,
  animate = true,
  sealSlot,
  outerColor = "#4A3E28",
  innerColor = dq.gold,
}: {
  children: React.ReactNode;
  sealId: string;
  animate?: boolean;
  sealSlot?: React.ReactNode;
  outerColor?: string;
  innerColor?: string;
}) {
  const sealStyle = useSealEntrance(CERT_TIMELINE.seal, animate);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  }, []);

  return (
    <View style={s.frameOuter} onLayout={onLayout}>
      <DrawnBorders
        width={size.width}
        height={size.height}
        animate={animate}
        outerColor={outerColor}
        innerColor={innerColor}
      />
      <View style={s.frameInner}>
        {animate && (
          <View style={s.shineClip} pointerEvents="none">
            <Shine delay={CERT_TIMELINE.shine} />
          </View>
        )}
        {CORNERS.map((position, i) => (
          <Corner
            key={i}
            position={position}
            delay={CERT_TIMELINE.corners + i * CORNER_STAGGER}
            animate={animate}
          />
        ))}

        {sealSlot ?? (
          <Animated.View style={sealStyle}>
            <CertificateSeal id={sealId} />
          </Animated.View>
        )}

        {children}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  frameOuter: {
    backgroundColor: "#0F1D20",
    borderRadius: 8,
    padding: FRAME_PADDING,
  },
  frameInner: {
    borderRadius: 4,
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: "center",
    overflow: "hidden",
  },
  shineClip: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  shine: { position: "absolute", top: -40, bottom: -40, width: 120 },
  cornerWrap: { position: "absolute", zIndex: 2 },
  corner: { fontSize: 12, color: dq.gold },
});

export default CertificateFrame;
