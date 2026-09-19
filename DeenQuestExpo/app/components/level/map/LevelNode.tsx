import React, { useCallback, useEffect, useRef, memo } from "react";
import { View, Text, TouchableOpacity, Animated, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Check, Lock } from "lucide-react-native";
import type { LevelWithStatus } from "../../../store/services/api";
import {
  ACTIVE_NODE_SIZE,
  NODE_SIZE,
  nodeVisual,
  getNodeOffset,
  DEFAULT_SECTION_COLORS,
  PATH_GOLD,
  type SectionColors,
} from "./constants";
import { BookGlyph } from "./BookGlyph";
import { PathConnector } from "./PathConnector";
import { LevelPopup } from "./LevelPopup";
import { s } from "./styles";

const ISLAND_ART = require("../../../../assets/level/island.png");
const TROPHY_ISLAND_ART = require("../../../../assets/level/island-trophy.png");

const GLOSS = ["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0)"] as const;

const HALO_RINGS = [
  { grow: 30, alpha: 0.5 },
  { grow: 18, alpha: 0.7 },
  { grow: 8, alpha: 1 },
];

export const LevelNode = memo(function LevelNode({
  level,
  offsetIndex,
  appearIndex,
  isSelected,
  isLast,
  isSectionEnd,
  onPress,
  onStart,
  colors = DEFAULT_SECTION_COLORS,
}: {
  level: LevelWithStatus;
  /** Absolute position along the path — drives the winding sway. */
  offsetIndex: number;
  /** Position used only to stagger the entrance animation (capped by caller). */
  appearIndex: number;
  isSelected: boolean;
  /** Last stop on the whole path — nothing to draw a trail towards. */
  isLast: boolean;
  /** Closes a section: it carries the trophy instead of a circle. */
  isSectionEnd: boolean;
  onPress: () => void;
  onStart: () => void;
  /** Color identity of the section this node belongs to. */
  colors?: SectionColors;
}) {
  const config = nodeVisual(level.status, colors);
  const isLocked = level.status === "locked";
  const isCompleted = level.status === "completed";
  const isLit = !isLocked && !isCompleted;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = appearIndex * 55;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, appearIndex]);

  useEffect(() => {
    if (!isLit) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isLit, pulseAnim]);

  const handlePressIn = useCallback(() => {
    if (isLocked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
  }, [isLocked, scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 120,
    }).start();
  }, [scaleAnim]);

  const offset = getNodeOffset(offsetIndex);
  const circleSize = isLit ? ACTIVE_NODE_SIZE : NODE_SIZE;
  const label = `Level ${level.course_level || offsetIndex + 1}`;

  return (
    <Animated.View
      style={[
        s.nodeRow,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        isSelected && { zIndex: 100, elevation: 10 },
      ]}
    >
      {/* Under the islands on purpose — both ends of the trail disappear
          behind artwork instead of stopping in mid-air. */}
      {!isLast && <PathConnector offsetIndex={offsetIndex} />}

      <View style={[s.block, { transform: [{ translateX: offset }] }]}>
        {isSectionEnd ? (
          <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isLocked}
            activeOpacity={0.85}
            style={[s.trophyIsland, isLocked && s.trophyLocked]}
          >
            <Animated.Image
              source={TROPHY_ISLAND_ART}
              resizeMode="contain"
              style={[
                { width: "100%", height: "100%" },
                {
                  transform: [
                    { scale: Animated.multiply(scaleAnim, pulseAnim) },
                  ],
                },
              ]}
            />
          </TouchableOpacity>
        ) : (
          <>
            <Image
              source={ISLAND_ART}
              style={[s.island, isLocked && s.islandLocked]}
              resizeMode="contain"
            />
            <View style={s.circleHolder}>
              <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isLocked}
                activeOpacity={1}
                style={s.circleTouch}
              >
                {config.halo && (
                  <Animated.View
                    style={[s.haloLayer, { transform: [{ scale: pulseAnim }] }]}
                    pointerEvents="none"
                  >
                    {HALO_RINGS.map((ring) => (
                      <View
                        key={ring.grow}
                        style={[
                          s.halo,
                          {
                            width: circleSize + ring.grow,
                            height: circleSize + ring.grow,
                            backgroundColor: config.halo,
                            opacity: ring.alpha,
                          },
                        ]}
                      />
                    ))}
                  </Animated.View>
                )}

                <Animated.View
                  style={{
                    transform: [
                      { scale: Animated.multiply(scaleAnim, pulseAnim) },
                    ],
                  }}
                >
                  <View
                    style={[
                      s.circle,
                      isLit && s.circleActive,
                      {
                        borderColor: config.borderColor,
                        borderWidth: config.borderWidth,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={config.face}
                      start={{ x: 0.15, y: 0 }}
                      end={{ x: 0.85, y: 1 }}
                      style={s.face}
                    />
                    {!isLit && (
                      <LinearGradient
                        colors={GLOSS}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 0.62 }}
                        style={s.face}
                      />
                    )}

                    {isLocked ? (
                      <Lock
                        size={24}
                        color={config.iconColor}
                        strokeWidth={2.6}
                      />
                    ) : isCompleted ? (
                      <Check
                        size={28}
                        color={config.iconColor}
                        strokeWidth={3.4}
                      />
                    ) : (
                      <BookGlyph size={30} color={config.iconColor} />
                    )}
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </View>
          </>
        )}

        {isLit && (
          <View
            style={[s.bubble, isSectionEnd && s.bubbleHigh]}
            pointerEvents="none"
          >
            <View style={s.bubbleBody}>
              <Text style={s.bubbleText}>START</Text>
            </View>
            <View style={s.bubbleTail} />
          </View>
        )}

        <View
          style={[
            s.label,
            {
              backgroundColor: config.labelFill,
              borderColor: isSectionEnd
                ? "rgba(242, 226, 115, 0.45)"
                : config.labelBorder,
            },
            isLit && s.labelActive,
          ]}
          pointerEvents="none"
        >
          <Text
            style={[
              s.labelText,
              { color: isSectionEnd ? PATH_GOLD : config.labelText },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>

        {level.status === "in_progress" && level.lesson_count > 0 && (
          <View style={s.progressPill} pointerEvents="none">
            <Text style={s.progressText}>
              {/* lesson_count, not lessons.length: the list endpoint sends
                  the levels with `lessons` emptied and the count in its own
                  field, so this pill read "4/0" for every level in progress. */}
              {level.lessons_complete}/{level.lesson_count}
            </Text>
          </View>
        )}
      </View>

      {isSelected && (
        <View pointerEvents="box-none" style={POPUP_LAYER}>
          <LevelPopup
            level={level}
            nodeOffset={offset}
            onStart={onStart}
            colors={colors}
          />
        </View>
      )}
    </Animated.View>
  );
});

const POPUP_LAYER = {
  position: "absolute",
  top: 96,
  left: 0,
  right: 0,
  alignItems: "center",
} as const;
