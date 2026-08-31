import React, { memo, useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { Lock } from "lucide-react-native";

import type { LevelWithStatus } from "../../../store/services/api";
import { WORLD } from "./worldTheme";
import { NODE_SIZE, RING } from "./pathLayout";

/**
 * One stop on the path.
 *
 * The mockup builds each node from four stacked pieces — a cream ring, a
 * coloured disc, a hard offset shadow that gives it thickness, and a soft
 * drop shadow — plus a star tray underneath and a label card to the side.
 * React Native has no multi-value box-shadow, so the ring is a border, the
 * thickness is a sibling view offset behind the disc, and the soft shadow is
 * the platform's own.
 */

export type NodeState = "done" | "current" | "locked";

export function nodeState(level: LevelWithStatus): NodeState {
  if (level.status === "locked") return "locked";
  if (level.status === "completed") return "done";
  return "current";
}

/**
 * Finished nodes alternate between the two greens/blues of the mockup, and
 * locked ones between its violet and plum, so a long run of the same state
 * still has rhythm.
 */
function fillsFor(state: NodeState, index: number) {
  if (state === "current") {
    return { colors: WORLD.current, depth: WORLD.currentDepth, stroke: WORLD.checkInk };
  }
  if (state === "done") {
    return index % 2 === 0
      ? { colors: WORLD.doneA, depth: WORLD.doneADepth, stroke: "#06302B" }
      : { colors: WORLD.doneB, depth: WORLD.doneBDepth, stroke: "#0E2A3A" };
  }
  return index % 2 === 0
    ? { colors: WORLD.lockedA, depth: WORLD.lockedDepth, stroke: WORLD.lockedAStroke }
    : { colors: WORLD.lockedB, depth: WORLD.lockedDepth, stroke: WORLD.lockedBStroke };
}

export const PathNode = memo(function PathNode({
  level,
  index,
  glyph,
  onPress,
}: {
  level: LevelWithStatus;
  index: number;
  /** Arabic letter or short label drawn inside the disc; falls back to an icon. */
  glyph?: string;
  onPress: () => void;
}) {
  const state = nodeState(level);
  const size = NODE_SIZE[state];
  const { colors, depth, stroke } = fillsFor(state, index);
  const depthOffset = state === "locked" ? 7 : 9;

  const press = useRef(new Animated.Value(0)).current;

  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(press, { toValue: 1, useNativeDriver: true, speed: 40 }).start()
      }
      onPressOut={() =>
        Animated.spring(press, { toValue: 0, useNativeDriver: true, speed: 40 }).start()
      }
      onPress={onPress}
      disabled={state === "locked"}
      accessibilityRole="button"
      accessibilityLabel={`Level ${index + 1}: ${level.title}`}
      accessibilityState={{ disabled: state === "locked" }}
      hitSlop={6}
    >
      <Animated.View
        style={{
          width: size + RING * 2,
          height: size + RING * 2 + depthOffset,
          transform: [
            {
              translateY: press.interpolate({
                inputRange: [0, 1],
                outputRange: [0, depthOffset - 2],
              }),
            },
          ],
        }}
      >
        {/* Thickness.
            
            The mockup's `0 9px 0 <dark>` has no spread, so it is the *inner*
            disc offset down — 80 px, not the 92 px the cream ring occupies.
            The ring then covers all but the last few pixels of it, leaving a
            thin dark lip. Sizing this to the outer circle instead puts the
            whole 9 px on show and the node grows a heavy dark blob under it. */}
        <View
          style={[
            s.disc,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: depth,
              left: RING,
              top: RING + depthOffset,
            },
          ]}
        />
        <View
          style={[
            s.disc,
            s.face,
            {
              width: size + RING * 2,
              height: size + RING * 2,
              borderRadius: (size + RING * 2) / 2,
              borderWidth: RING,
            },
          ]}
        >
          <LinearGradient
            colors={colors}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={[s.fill, { width: size, height: size, borderRadius: size / 2 }]}
          >
            {glyph ? (
              <Text style={[s.glyph, { color: stroke, fontSize: size * 0.44 }]}>
                {glyph}
              </Text>
            ) : (
              <Lock size={size * 0.32} color={stroke} strokeWidth={2.4} />
            )}
          </LinearGradient>
        </View>

        {state === "done" && (
          <View style={s.check}>
            <Text style={s.checkMark}>✓</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
});

const STAR_D =
  "M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5L2.5 9.5l6.6-.9z";

/**
 * The three-star tray under a node the learner has attempted.
 *
 * One <Svg> holding three paths, not three <Svg>s. Each one is a native view,
 * and a course runs to two dozen levels — the difference is 24 of them against
 * 72, which is most of what made the first paint of a long path drag.
 */
export const StarTray = memo(function StarTray({ earned }: { earned: number }) {
  return (
    <View style={s.tray}>
      <Svg width={47} height={15} viewBox="0 0 76 24">
        {[0, 1, 2].map((i) => (
          <Path
            key={i}
            d={STAR_D}
            translateX={i * 26}
            fill={i < earned ? WORLD.starFill : WORLD.starEmptyFill}
            stroke={i < earned ? WORLD.starStroke : WORLD.starEmptyStroke}
            strokeWidth={1.6}
          />
        ))}
      </Svg>
    </View>
  );
});

/** The card beside a node: its number, its title, and a lock when it is shut. */
export const NodeLabel = memo(function NodeLabel({
  number,
  title,
  state,
}: {
  number: number;
  title: string;
  state: NodeState;
}) {
  const current = state === "current";
  const locked = state === "locked";

  return (
    <View
      style={[
        s.label,
        current && s.labelCurrent,
        locked && s.labelLocked,
      ]}
    >
      <Text style={[s.labelNumber, current && s.labelNumberCurrent, locked && s.labelNumberLocked]}>
        {number}
      </Text>
      <View style={s.labelTitleRow}>
        <Text
          style={[s.labelTitle, current && s.labelTitleCurrent, locked && s.labelTitleLocked]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {locked && <Lock size={13} color={WORLD.lockedBody} strokeWidth={2.4} />}
      </View>
    </View>
  );
});

/** The "START" flag that marks where the learner picks up. */
export const StartFlag = memo(function StartFlag() {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  return (
    <Animated.View
      style={{
        transform: [
          { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) },
        ],
      }}
    >
      <Text style={s.start}>START</Text>
    </Animated.View>
  );
});

/** The halo that breathes behind the current node. */
export const NodePulse = memo(function NodePulse({ size }: { size: number }) {
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(ring, { toValue: 1, duration: 2200, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [ring]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: WORLD.current[0],
        opacity: ring.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.4, 0, 0] }),
        transform: [
          { scale: ring.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1.55, 1.55] }) },
        ],
      }}
    />
  );
});

const s = StyleSheet.create({
  disc: {
    position: "absolute",
  },
  face: {
    top: 0,
    borderColor: WORLD.ring,
    alignItems: "center",
    justifyContent: "center",
    // `0 14px 26px rgba(0,0,0,.5)` from the mockup. Android's elevation is
    // kept low: it draws its own shadow on top of this one, and at 10 the two
    // stack into a dark smear under every node.
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 14 },
    elevation: 3,
  },
  fill: {
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: {
    fontFamily: "Amiri_700Bold",
    includeFontPadding: false,
    textAlign: "center",
  },
  check: {
    position: "absolute",
    top: -9,
    right: -9,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: WORLD.check,
    borderWidth: 3,
    borderColor: WORLD.ring,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    color: WORLD.checkInk,
    fontSize: 12,
    fontFamily: "Nunito_900Black",
    includeFontPadding: false,
  },
  tray: {
    width: 60,
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: WORLD.ring,
    borderRadius: 11,
    paddingVertical: 2,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  label: {
    maxWidth: 150,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: WORLD.panelSolid,
    borderWidth: 1,
    borderColor: WORLD.panelBorderBright,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  labelCurrent: {
    backgroundColor: "rgba(239,182,90,0.18)",
    borderWidth: 1.5,
    borderColor: WORLD.gold,
  },
  labelLocked: {
    backgroundColor: WORLD.panelStrong,
    borderColor: WORLD.panelBorderSoft,
  },
  labelNumber: {
    color: WORLD.text,
    fontSize: 17,
    fontFamily: "Nunito_900Black",
    lineHeight: 19,
  },
  labelNumberCurrent: {
    color: "#FFFFFF",
  },
  labelNumberLocked: {
    color: WORLD.lockedTitle,
  },
  labelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  labelTitle: {
    flexShrink: 1,
    color: WORLD.textMuted,
    fontSize: 12.5,
    fontFamily: "Nunito_800ExtraBold",
  },
  labelTitleCurrent: {
    color: WORLD.goldSoft,
  },
  labelTitleLocked: {
    color: WORLD.lockedBody,
  },
  start: {
    backgroundColor: WORLD.text,
    color: "#0B1517",
    fontSize: 9.5,
    fontFamily: "Nunito_900Black",
    letterSpacing: 1,
    borderRadius: 9,
    paddingVertical: 4,
    paddingHorizontal: 11,
    overflow: "hidden",
  },
});
