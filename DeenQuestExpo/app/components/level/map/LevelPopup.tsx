import React, { useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { theme } from "../../../theme/themes";
import { LEVEL_GREEN, LEVEL_GREEN_DEEP } from "./constants";
import type { LevelWithStatus } from "../../../store/services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface LevelPopupProps {
  level: LevelWithStatus;
  nodeOffset: number;
  onStart: () => void;
}

export function LevelPopup({ level, nodeOffset, onStart }: LevelPopupProps) {
  // ── Entrance animations ──
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(10)).current;

  // ── Staggered content entrance ──
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(8)).current;
  const buttonEntranceOpacity = useRef(new Animated.Value(0)).current;
  const buttonEntranceTranslateY = useRef(new Animated.Value(12)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  // ── Button press (translateY so text never blurs) ──
  const buttonPressY = useRef(new Animated.Value(0)).current;

  // ── Bottom slide ──
  const slideAnim = useRef(new Animated.Value(-CARD_WIDTH * 0.35)).current;

  // ── Ambient card pulse ──
  const cardPulse = useRef(new Animated.Value(1)).current;

  // ── Glow ring behind card ──
  const glowScale = useRef(new Animated.Value(0.85)).current;
  const glowOpacity = useRef(new Animated.Value(0.25)).current;

  // ── Sparkle twinkles ──
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main popup entrance + staggered content
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }),
      // Title slides in
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 400,
        delay: 90,
        useNativeDriver: true,
      }),
      Animated.spring(titleTranslateY, {
        toValue: 0,
        delay: 90,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }),
      // Button slides in
      Animated.timing(buttonEntranceOpacity, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(buttonEntranceTranslateY, {
        toValue: 0,
        delay: 200,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }),
      // Dots fade in last
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 350,
        delay: 360,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // ── Card ambient breathing pulse ──
    const cardLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cardPulse, {
          toValue: 1.008,
          duration: 1600,
          useNativeDriver: true,
          easing: (t) => t,
        }),
        Animated.timing(cardPulse, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
          easing: (t) => t,
        }),
      ]),
    );
    cardLoop.start();

    // ── Expanding glow ring behind card ──
    const glowLoop = Animated.loop(
      Animated.parallel([
        Animated.timing(glowScale, {
          toValue: 1.28,
          duration: 2400,
          useNativeDriver: true,
          easing: (t) => t,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 2400,
          useNativeDriver: true,
          easing: (t) => t,
        }),
      ]),
    );
    glowLoop.start();

    // ── Twinkling sparkles (staggered) ──
    const s1 = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle1, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(sparkle1, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ]),
    );
    s1.start();

    const s2 = Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(sparkle2, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(sparkle2, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.delay(500),
      ]),
    );
    s2.start();

    const s3 = Animated.loop(
      Animated.sequence([
        Animated.delay(350),
        Animated.timing(sparkle3, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(sparkle3, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.delay(900),
      ]),
    );
    s3.start();

    // ── Button bottom sweep ──
    const slideLoop = Animated.loop(
      Animated.timing(slideAnim, {
        toValue: CARD_WIDTH,
        duration: 1000,
        useNativeDriver: true,
        easing: (x) => x,
      }),
    );
    slideLoop.start();

    return () => {
      cardLoop.stop();
      glowLoop.stop();
      s1.stop();
      s2.stop();
      s3.stop();
      slideLoop.stop();
    };
  }, []);

  const handlePressIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(buttonPressY, {
      toValue: 3,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
  }, [buttonPressY]);

  const handlePressOut = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(buttonPressY, {
      toValue: 0,
      useNativeDriver: true,
      friction: 3,
      tension: 140,
    }).start();
  }, [buttonPressY]);

  const xpReward = level.xp_reward ?? 35;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
        },
      ]}
    >
      {/* Pointer triangle */}
      <View style={styles.pointerContainer}>
        <View
          style={[styles.pointer, { transform: [{ translateX: nodeOffset }] }]}
        />
      </View>

      {/* Expanding glow ring behind the card */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Sparkle decorations */}
      <Animated.View
        style={[styles.sparkle, styles.sparkleLeft, { opacity: sparkle1 }]}
      >
        <View style={styles.sparkleDiamond} />
      </Animated.View>

      <Animated.View
        style={[styles.sparkle, styles.sparkleRight, { opacity: sparkle2 }]}
      >
        <View style={styles.sparkleDiamond} />
      </Animated.View>

      <Animated.View
        style={[styles.sparkle, styles.sparkleTopRight, { opacity: sparkle3 }]}
      >
        <View style={styles.sparkleDiamondSmall} />
      </Animated.View>

      {/* Card */}
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale: cardPulse }],
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.title,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          {level.title}
        </Animated.Text>

        <Animated.View
          style={{
            width: "100%",
            opacity: buttonEntranceOpacity,
            transform: [{ translateY: buttonEntranceTranslateY }],
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={onStart}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.buttonTouchable}
          >
            <Animated.View
              style={[
                styles.button,
                { transform: [{ translateY: buttonPressY }] },
              ]}
            >
              <Text style={styles.buttonText}>START +{xpReward} XP</Text>
              <View style={styles.buttonBottomBase}>
                <Animated.View
                  style={[
                    styles.buttonBottomSlide,
                    { transform: [{ translateX: slideAnim }] },
                  ]}
                />
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const CARD_WIDTH = SCREEN_WIDTH - 48;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 17,
    marginBottom: 12,
  },
  pointerContainer: {
    alignItems: "center",
    width: "100%",
  },
  pointer: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 14,
    borderTopWidth: 0,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: LEVEL_GREEN,
  },
  glowRing: {
    position: "absolute",
    alignSelf: "center",
    width: CARD_WIDTH - 16,
    height: 90,
    borderRadius: 20,
    backgroundColor: "rgba(67,160,71,0.30)",
    top: 18,
    zIndex: 0,
  },
  sparkle: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  sparkleLeft: {
    alignSelf: "flex-start",
    marginLeft: 18,
    top: 42,
  },
  sparkleRight: {
    alignSelf: "flex-end",
    marginRight: 18,
    top: 56,
  },
  sparkleTopRight: {
    alignSelf: "flex-end",
    marginRight: 32,
    top: 26,
  },
  sparkleDiamond: {
    width: 7,
    height: 7,
    backgroundColor: theme.colors.white,
    borderRadius: 1,
    transform: [{ rotate: "45deg" }],
    shadowColor: theme.colors.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  sparkleDiamondSmall: {
    width: 5,
    height: 5,
    backgroundColor: theme.colors.white,
    borderRadius: 1,
    transform: [{ rotate: "45deg" }],
    shadowColor: theme.colors.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 2,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: LEVEL_GREEN,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    alignItems: "center",
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 14,
  },
  buttonTouchable: {
    width: "100%",
  },
  button: {
    backgroundColor: theme.colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  buttonBottomBase: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  buttonBottomSlide: {
    position: "absolute",
    left: 0,
    top: 0,
    width: CARD_WIDTH * 0.35,
    height: 4,
    backgroundColor: "rgba(67,160,71,0.45)",
    borderRadius: 2,
  },
  buttonText: {
    color: LEVEL_GREEN_DEEP,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: {
    backgroundColor: "rgba(255,255,255,0.85)",
  },
});
