import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Trophy } from "lucide-react-native";
import { haptics } from "../../../utils/haptics";
import { theme } from "../../../theme/themes";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CourseCompletionScreenProps {
  xpEarned: number;
  accuracy: number;
  timeString: string;
  currentTotalXP?: number;
  onContinue: () => void;
}

const SPRING = { friction: 8, tension: 120, useNativeDriver: true };

function useCountUp(
  target: number,
  duration: number = 1200,
  delay: number = 0,
) {
  const [value, setValue] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const startTime = Date.now() + delay;
    let lastHaptic = 0;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTime;

      if (elapsed < 0) {
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      setValue(current);

      if (current - lastHaptic >= 10) {
        lastHaptic = current;
        haptics.light();
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      }
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [target, duration, delay]);

  return value;
}

export default function CourseCompletionScreen({
  xpEarned = 20,
  accuracy = 80,
  timeString = "9:45",
  currentTotalXP = 0,
  onContinue,
}: CourseCompletionScreenProps) {
  const [claimed, setClaimed] = useState(false);
  const [showFlyingXP, setShowFlyingXP] = useState(false);

  // ── Animated values ──
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineTranslateY = useRef(new Animated.Value(20)).current;

  const mascotOpacity = useRef(new Animated.Value(0)).current;
  const mascotScale = useRef(new Animated.Value(0.6)).current;

  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card1Scale = useRef(new Animated.Value(0.8)).current;
  const card1TranslateY = useRef(new Animated.Value(30)).current;

  const card2Opacity = useRef(new Animated.Value(0)).current;
  const card2Scale = useRef(new Animated.Value(0.8)).current;
  const card2TranslateY = useRef(new Animated.Value(30)).current;

  const card3Opacity = useRef(new Animated.Value(0)).current;
  const card3Scale = useRef(new Animated.Value(0.8)).current;
  const card3TranslateY = useRef(new Animated.Value(30)).current;

  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(20)).current;

  // Header XP animation
  const headerScale = useRef(new Animated.Value(1)).current;
  const headerBgPulse = useRef(new Animated.Value(0)).current;

  // Flying XP animation
  const flyY = useRef(new Animated.Value(0)).current;
  const flyX = useRef(new Animated.Value(0)).current;
  const flyScale = useRef(new Animated.Value(1)).current;
  const flyOpacity = useRef(new Animated.Value(0)).current;

  // Trophy rotation
  const trophyRotate = useRef(new Animated.Value(0)).current;

  // Floating particles
  const particles = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      size: 4 + Math.random() * 6,
      left: 15 + Math.random() * 70,
      top: 10 + Math.random() * 80,
      delay: Math.random() * 2000,
      duration: 2000 + Math.random() * 2000,
      opacity: useRef(new Animated.Value(0)).current,
      translateY: useRef(new Animated.Value(0)).current,
      scale: useRef(new Animated.Value(0.5)).current,
    })),
  ).current;

  // ── Counter triggers ──
  const [xpCounterTrigger, setXpCounterTrigger] = useState(false);
  const [accuracyCounterTrigger, setAccuracyCounterTrigger] = useState(false);

  const displayXP = useCountUp(xpEarned, 1200, xpCounterTrigger ? 0 : Infinity);

  const displayAccuracy = useCountUp(
    accuracy,
    1000,
    accuracyCounterTrigger ? 0 : Infinity,
  );

  const finalTotalXP = currentTotalXP + xpEarned;

  // ── Entrance sequence ──
  useEffect(() => {
    const animateCard = (
      opacity: Animated.Value,
      scale: Animated.Value,
      translateY: Animated.Value,
    ) =>
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          ...SPRING,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          ...SPRING,
        }),
      ]);

    // Headline
    Animated.parallel([
      Animated.timing(headlineOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(headlineTranslateY, {
        toValue: 0,
        ...SPRING,
      }),
    ]).start();

    // Trophy + particles
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(mascotOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(mascotScale, {
          toValue: 1,
          friction: 6,
          tension: 140,
          useNativeDriver: true,
        }),
      ]).start(() => haptics.success());

      // Start trophy rotation
      Animated.loop(
        Animated.sequence([
          Animated.timing(trophyRotate, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(trophyRotate, {
            toValue: -1,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Start particles
      particles.forEach((p) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(p.delay),
            Animated.parallel([
              Animated.timing(p.opacity, {
                toValue: 1,
                duration: p.duration * 0.2,
                useNativeDriver: true,
              }),
              Animated.timing(p.translateY, {
                toValue: -30 - Math.random() * 40,
                duration: p.duration,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(p.scale, {
                toValue: 1,
                duration: p.duration * 0.3,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(p.opacity, {
                toValue: 0,
                duration: p.duration * 0.3,
                useNativeDriver: true,
              }),
              Animated.timing(p.scale, {
                toValue: 0.3,
                duration: p.duration * 0.3,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ).start();
      });
    }, 200);

    // Cards sequence
    setTimeout(() => {
      animateCard(card1Opacity, card1Scale, card1TranslateY).start(() => {
        haptics.medium();
        setXpCounterTrigger(true);

        setTimeout(() => {
          animateCard(card2Opacity, card2Scale, card2TranslateY).start(() => {
            haptics.light();
            setAccuracyCounterTrigger(true);

            setTimeout(() => {
              animateCard(card3Opacity, card3Scale, card3TranslateY).start(
                () => {
                  haptics.light();

                  setTimeout(() => {
                    Animated.parallel([
                      Animated.timing(buttonOpacity, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                      }),
                      Animated.spring(buttonTranslateY, {
                        toValue: 0,
                        ...SPRING,
                      }),
                    ]).start();
                  }, 300);
                },
              );
            }, 400);
          });
        }, 400);
      });
    }, 600);
  }, []);

  const handleClaim = () => {
    haptics.success();
    setShowFlyingXP(true);

    flyY.setValue(0);
    flyX.setValue(0);
    flyScale.setValue(1.2);
    flyOpacity.setValue(1);

    Animated.parallel([
      Animated.timing(flyY, {
        toValue: -SCREEN_HEIGHT * 0.8,
        duration: 1000,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
      Animated.timing(flyScale, {
        toValue: 0.35,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(flyOpacity, {
        toValue: 0,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowFlyingXP(false);
      setClaimed(true);

      Animated.sequence([
        Animated.timing(headerScale, {
          toValue: 1.35,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(headerScale, {
          toValue: 1,
          friction: 4,
          tension: 220,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.sequence([
        Animated.timing(headerBgPulse, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(headerBgPulse, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      haptics.success();
      setTimeout(() => {
        onContinue();
      }, 1200);
    });
  };

  const headerBgOpacity = headerBgPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Animated.View
          style={[styles.headerGlow, { opacity: headerBgOpacity }]}
        />

        <Animated.View
          style={{
            transform: [{ scale: headerScale }],
          }}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerEmoji}>🔥</Text>

            <Text style={styles.headerLabel}>Total XP</Text>

            <Text style={styles.headerValue}>
              {claimed
                ? finalTotalXP.toLocaleString()
                : currentTotalXP.toLocaleString()}
            </Text>

            {claimed && <Text style={styles.headerPlus}>+{xpEarned}</Text>}
          </View>
        </Animated.View>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {/* TOP SECTION */}
        <View style={styles.topSection}>
          {/* Headline */}
          <Animated.View
            style={[
              styles.headlineGroup,
              {
                opacity: headlineOpacity,
                transform: [{ translateY: headlineTranslateY }],
              },
            ]}
          >
            <Text style={styles.celebrationHeadline}>
              YOU'RE DONE ALREADY?!
            </Text>

            <Text style={styles.celebrationSubtitle}>
              MashaAllah, that was fast.
            </Text>
          </Animated.View>

          {/* Trophy Visual */}
          <Animated.View
            style={[
              styles.characterFrame,
              {
                opacity: mascotOpacity,
                transform: [{ scale: mascotScale }],
              },
            ]}
          >
            {/* Glow circle */}
            <View style={styles.characterGlowCircle} />

            {/* Trophy with rotation */}
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: trophyRotate.interpolate({
                      inputRange: [-1, 1],
                      outputRange: ["-8deg", "8deg"],
                    }),
                  },
                ],
              }}
            >
              <Trophy
                size={140}
                color={theme.colors.secondary}
                strokeWidth={1.5}
              />
            </Animated.View>

            {/* Floating particles */}
            {particles.map((p) => (
              <Animated.View
                key={p.id}
                style={[
                  styles.particle,
                  {
                    width: p.size,
                    height: p.size,
                    left: `${p.left}%`,
                    top: `${p.top}%`,
                    opacity: p.opacity,
                    transform: [
                      { translateY: p.translateY },
                      { scale: p.scale },
                    ],
                  },
                ]}
              />
            ))}
          </Animated.View>
        </View>

        {/* BOTTOM SECTION */}
        <View style={styles.bottomSection}>
          {/* Stats Cards */}
          <View style={styles.statsPanelRow}>
            {/* XP */}
            <Animated.View
              style={[
                styles.statBadge,
                styles.statXpBadge,
                {
                  opacity: card1Opacity,
                  transform: [
                    { scale: card1Scale },
                    { translateY: card1TranslateY },
                  ],
                },
              ]}
            >
              <Text style={styles.statLabelText}>TOTAL XP</Text>

              <View style={styles.statValueContainer}>
                <Text style={styles.statEmoji}>🔥</Text>

                <Text style={[styles.statValueText, styles.statValueDark]}>
                  {displayXP}
                </Text>
              </View>
            </Animated.View>

            {/* Accuracy */}
            <Animated.View
              style={[
                styles.statBadge,
                styles.statAccuracyBadge,
                {
                  opacity: card2Opacity,
                  transform: [
                    { scale: card2Scale },
                    { translateY: card2TranslateY },
                  ],
                },
              ]}
            >
              <Text style={styles.statLabelText}>ACCURACY</Text>

              <View style={styles.statValueContainer}>
                <Text style={styles.statEmoji}>💚</Text>

                <Text style={[styles.statValueText, styles.statValueDark]}>
                  {displayAccuracy}%
                </Text>
              </View>
            </Animated.View>

            {/* Time */}
            <Animated.View
              style={[
                styles.statBadge,
                styles.statTimeBadge,
                {
                  opacity: card3Opacity,
                  transform: [
                    { scale: card3Scale },
                    { translateY: card3TranslateY },
                  ],
                },
              ]}
            >
              <Text style={[styles.statLabelText, styles.statLabelLight]}>
                TIME
              </Text>

              <View style={styles.statValueContainer}>
                <Text style={styles.statEmoji}>⏱️</Text>

                <Text style={[styles.statValueText, styles.statValueLight]}>
                  {timeString}
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* BUTTON */}
          <View style={styles.buttonWrapper}>
            <Animated.View
              style={{
                width: "100%",
                opacity: buttonOpacity,
                transform: [{ translateY: buttonTranslateY }],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.primaryClaimButton,
                  // claimed && styles.claimedButton,
                ]}
                activeOpacity={0.85}
                onPress={handleClaim}
                // disabled={claimed}
              >
                <View style={styles.buttonTextLayout}>
                  <Text style={styles.claimButtonText}>
                    {claimed ? "CLAIMED!" : "CLAIM REWARDS"}
                  </Text>

                  {!claimed && <Text style={styles.buttonClaimIcon}>🎉</Text>}
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Flying XP */}
            {showFlyingXP && (
              <Animated.View
                style={[
                  styles.flyingXpBadge,
                  {
                    transform: [{ translateY: flyY }, { scale: flyScale }],
                    opacity: flyOpacity,
                  },
                ]}
              >
                <Text style={styles.flyingXpText}>+{xpEarned} XP</Text>
              </Animated.View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 24,
  },

  header: {
    width: "100%",
    paddingBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  headerGlow: {
    position: "absolute",
    top: 3,
    width: 200,
    height: 40,
    borderRadius: 25,
    backgroundColor: theme.colors.secondary,
  },

  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    gap: 6,
  },

  headerEmoji: {
    fontSize: 16,
  },

  headerLabel: {
    fontFamily: "Lexend",
    fontWeight: "700",
    fontSize: 12,
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  headerValue: {
    fontFamily: "Lexend",
    fontWeight: "900",
    fontSize: 16,
    color: theme.colors.secondary,
  },

  headerPlus: {
    fontFamily: "Lexend",
    fontWeight: "900",
    fontSize: 13,
    color: theme.colors.primary,
  },

  content: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
    paddingBottom: 30,
  },

  topSection: {
    alignItems: "center",
    marginTop: 10,
  },

  bottomSection: {
    width: "100%",
  },

  headlineGroup: {
    alignItems: "center",
    marginBottom: 20,
  },

  celebrationHeadline: {
    fontFamily: "Lexend",
    fontWeight: "900",
    fontSize: 29,
    color: theme.colors.secondary,
    textAlign: "center",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  celebrationSubtitle: {
    fontFamily: "Lexend",
    fontWeight: "500",
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: 6,
  },

  characterFrame: {
    height: 400,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  characterGlowCircle: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: theme.colors.primary15,
    opacity: 0.8,
  },

  particle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: theme.colors.secondary,
  },

  statsPanelRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
    width: "100%",
  },

  statBadge: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 5,
  },

  statXpBadge: {
    backgroundColor: theme.colors.secondary,
    borderBottomColor: theme.colors.goldDark,
  },

  statAccuracyBadge: {
    backgroundColor: theme.colors.primary,
    borderBottomColor: theme.colors.primaryContainer,
  },

  statTimeBadge: {
    backgroundColor: theme.colors.surface,
    borderBottomColor: theme.colors.surfaceLow,
  },

  statLabelText: {
    fontFamily: "Lexend",
    fontWeight: "800",
    fontSize: 9,
    color: theme.colors.background,
    letterSpacing: 0.5,
    marginBottom: 4,
    opacity: 0.8,
  },

  statLabelLight: {
    color: theme.colors.textMuted,
  },

  statValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  statEmoji: {
    fontSize: 14,
    marginRight: 4,
  },

  statValueText: {
    fontFamily: "Lexend",
    fontWeight: "800",
    fontSize: 18,
  },

  statValueDark: {
    color: theme.colors.background,
  },

  statValueLight: {
    color: theme.colors.text,
  },

  buttonWrapper: {
    width: "100%",
    position: "relative",
    alignItems: "center",
    marginBottom: 40,
  },

  primaryClaimButton: {
    width: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 6,
    borderBottomColor: theme.colors.primaryContainer,
  },

  claimedButton: {
    backgroundColor: theme.colors.surface,
    borderBottomColor: theme.colors.surfaceLow,
  },

  buttonTextLayout: {
    flexDirection: "row",
    alignItems: "center",
  },

  claimButtonText: {
    fontFamily: "Lexend",
    fontWeight: "800",
    fontSize: 16,
    color: theme.colors.onPrimary,
    letterSpacing: 0.5,
  },

  buttonClaimIcon: {
    fontSize: 18,
    marginLeft: 8,
  },

  flyingXpBadge: {
    position: "absolute",
    bottom: 14,
    alignSelf: "center",
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.goldDark,
  },

  flyingXpText: {
    fontFamily: "Lexend",
    fontWeight: "900",
    fontSize: 18,
    color: theme.colors.background,
  },
});
