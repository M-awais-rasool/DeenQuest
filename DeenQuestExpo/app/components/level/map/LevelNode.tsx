import React, { useCallback, useEffect, useRef, memo } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import * as Haptics from "expo-haptics";
import { Lock, Star, Trophy } from "lucide-react-native";
import type { LevelWithStatus } from "../../../store/services/api";
import { STATUS_CONFIG, getNodeOffset } from "./constants";
import { TreasureBadge } from "./TreasureBadge";
import { LevelPopup } from "./LevelPopup";
import { s } from "./styles";

export const LevelNode = memo(function LevelNode({
  level,
  index,
  isSelected,
  onPress,
  onStart,
}: {
  level: LevelWithStatus;
  index: number;
  isSelected: boolean;
  onPress: () => void;
  onStart: () => void;
}) {
  const config = STATUS_CONFIG[level.status];
  const isLocked = level.status === "locked";
  const isAvailable = level.status === "available";
  const isCompleted = level.status === "completed";
  const progress =
    level.lessons.length > 0
      ? level.lessons_complete / level.lessons.length
      : 0;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pressDepth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 60;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  useEffect(() => {
    if (!isAvailable) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
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
  }, [isAvailable, pulseAnim]);

  const handlePressIn = useCallback(() => {
    if (isLocked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
  }, [isLocked, scaleAnim, pressDepth]);

  const handlePressOut = useCallback(() => {
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
  }, [scaleAnim, pressDepth]);

  const offset = getNodeOffset(index);

  const POPUP_TOP = 90;

  return (
    <Animated.View
      style={[
        s.nodeRow,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        isSelected && {
          zIndex: 100,
          elevation: 10,
        },
      ]}
    >
      <View style={[s.nodeWrapper, { transform: [{ translateX: offset }] }]}>
        <Animated.View
          style={{
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
          }}
        >
          <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isLocked}
            activeOpacity={1}
            style={s.touchableArea}
          >
            <View style={[s.nodeBase, { backgroundColor: config.baseColor }]} />

            <View
              style={[s.nodeBottom, { backgroundColor: config.bottomBg }]}
            />

            {!isLocked && progress > 0 && progress < 1 && (
              <View style={s.progressArcContainer}>
                <View
                  style={[
                    s.progressArc,
                    {
                      backgroundColor: config.progressColor,
                    },
                  ]}
                />
              </View>
            )}

            <Animated.View
              style={[
                s.nodeTop,
                {
                  backgroundColor: config.topBg,
                  borderColor: config.topBg,
                  transform: [{ translateY: pressDepth }],
                },
              ]}
            >
              {isLocked ? (
                <Lock size={26} color={config.iconColor} strokeWidth={2.5} />
              ) : isCompleted ? (
                <Trophy size={26} color={config.iconColor} strokeWidth={2.5} />
              ) : (
                <Star
                  size={30}
                  color={config.iconColor}
                  fill={config.iconColor}
                  strokeWidth={0}
                />
              )}
            </Animated.View>
          </TouchableOpacity>

          <TreasureBadge courseLevel={level.course_level || level.id} />
        </Animated.View>

        <Text
          style={[s.nodeLabel, isLocked && s.nodeLabelLocked]}
          numberOfLines={1}
        >
          {level.title}
        </Text>

        {level.status === "in_progress" && (
          <View style={s.progressPill}>
            <Text style={s.progressText}>
              {level.lessons_complete}/{level.lessons.length}
            </Text>
          </View>
        )}
      </View>

      {isSelected && (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: POPUP_TOP,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <LevelPopup level={level} nodeOffset={offset} onStart={onStart} />
        </View>
      )}
    </Animated.View>
  );
});
