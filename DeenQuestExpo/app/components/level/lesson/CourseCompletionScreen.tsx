import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { Trophy, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { theme } from "../../../theme/themes";

interface LevelCompletionScreenProps {
  xpEarned: number;
  onContinue: () => void;
}

// Optimized particle component with native driver
const Particle = React.memo(({
  color,
  delay,
}: {
  color: string;
  delay: number;
}) => {
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 60;
    const targetX = Math.cos(angle) * distance;
    const targetY = Math.sin(angle) * distance;
    const targetScale = 0.8 + Math.random() * 0.4;
    const targetOpacity = 0.7 + Math.random() * 0.3;

    Animated.parallel([
      Animated.timing(scale, {
        toValue: targetScale,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: targetOpacity,
        duration: 200,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(x, {
        toValue: targetX,
        duration: 800,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(y, {
        toValue: targetY,
        duration: 800,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(600 + delay),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [delay, x, y, opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          transform: [{ translateX: x }, { translateY: y }, { scale }],
          opacity,
        },
      ]}
    />
  );
});

Particle.displayName = "Particle";

export function CourseCompletionScreen({
  xpEarned,
  onContinue,
}: LevelCompletionScreenProps) {
  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.3)).current;
  const cardTranslateY = useRef(new Animated.Value(100)).current;
  const trophyScale = useRef(new Animated.Value(0)).current;
  const trophyRotate = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const xpOpacity = useRef(new Animated.Value(0)).current;
  const xpTranslateY = useRef(new Animated.Value(15)).current;
  const doneBtnOpacity = useRef(new Animated.Value(0)).current;
  const doneBtnTranslateY = useRef(new Animated.Value(20)).current;

  const [displayXP, setDisplayXP] = useState(0);

  // Memoize particle colors
  const particleColors = useMemo(
    () => [
      theme.colors.secondary,
      theme.colors.goldDark,
      theme.colors.white,
    ],
    []
  );

  useEffect(() => {
    // Reset all values
    backdropOpacity.setValue(0);
    cardScale.setValue(0.3);
    cardTranslateY.setValue(100);
    trophyScale.setValue(0);
    trophyRotate.setValue(0);
    titleOpacity.setValue(0);
    titleTranslateY.setValue(20);
    xpOpacity.setValue(0);
    xpTranslateY.setValue(15);
    doneBtnOpacity.setValue(0);
    doneBtnTranslateY.setValue(20);
    setDisplayXP(0);

    // Start animation sequence
    startAnimation();
  }, []);

  const startAnimation = () => {
    // Haptic feedback on start
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Backdrop fade in
    Animated.timing(backdropOpacity, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Card entrance with spring
    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Trophy entrance
      Animated.spring(trophyScale, {
        toValue: 1,
        tension: 120,
        friction: 5,
        useNativeDriver: true,
      }).start(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        
        // Trophy sway loop
        Animated.loop(
          Animated.sequence([
            Animated.timing(trophyRotate, {
              toValue: 1,
              duration: 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(trophyRotate, {
              toValue: -1,
              duration: 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ).start();
      });

      // Title slide up
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(titleTranslateY, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
        ]).start(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        });
      }, 200);

      // XP counter
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(xpOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(xpTranslateY, {
            toValue: 0,
            duration: 250,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
        ]).start(() => {
          animateXPCounter();
        });
      }, 400);

      // Continue button
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(doneBtnOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(doneBtnTranslateY, {
            toValue: 0,
            duration: 250,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
        ]).start(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        });
      }, 600);
    });
  };

  const animateXPCounter = () => {
    const duration = 1200;
    const startTime = Date.now();
    let lastHapticValue = 0;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(eased * xpEarned);
      
      setDisplayXP(currentValue);
      
      // Haptic feedback every 20 XP
      if (currentValue - lastHapticValue >= 20) {
        lastHapticValue = currentValue;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  };

  const handleContinue = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onContinue();
  }, [onContinue]);

  const trophyRotateDeg = trophyRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-6deg", "0deg", "6deg"],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      />

      <View style={styles.centerContent}>
        {/* Particles */}
        <View pointerEvents="none" style={styles.particlesContainer}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Particle
              key={i}
              color={particleColors[i % particleColors.length]}
              delay={Math.random() * 200}
            />
          ))}
        </View>

        {/* Main Card */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { scale: cardScale },
                { translateY: cardTranslateY },
              ],
            },
          ]}
        >
          {/* Trophy */}
          <Animated.View
            style={[
              styles.trophyContainer,
              {
                transform: [
                  { scale: trophyScale },
                  { rotate: trophyRotateDeg },
                ],
              },
            ]}
          >
            <Trophy
              size={80}
              color={theme.colors.secondary}
              fill={theme.colors.secondary}
            />
          </Animated.View>

          {/* Title */}
          <Animated.Text
            style={[
              styles.title,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            Level Complete!
          </Animated.Text>

          {/* XP Earned */}
          <Animated.View
            style={[
              styles.xpContainer,
              {
                opacity: xpOpacity,
                transform: [{ translateY: xpTranslateY }],
              },
            ]}
          >
            <Text style={styles.xpText}>+{displayXP} XP</Text>
          </Animated.View>

          {/* Continue Button */}
          <Animated.View
            style={[
              styles.buttonWrapper,
              {
                opacity: doneBtnOpacity,
                transform: [{ translateY: doneBtnTranslateY }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={handleContinue}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>CONTINUE</Text>
              <ChevronRight size={18} color={theme.colors.background} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background90,
  },
  centerContent: {
    width: "100%",
    paddingHorizontal: 24,
    alignItems: "center",
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  particle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: theme.colors.surface,
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  trophyContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 20,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  xpContainer: {
    marginBottom: 32,
  },
  xpText: {
    fontSize: 36,
    fontWeight: "900",
    color: theme.colors.secondary,
    letterSpacing: 1,
  },
  buttonWrapper: {
    width: "100%",
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.secondary,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.goldDark,
  },
  continueBtnText: {
    color: theme.colors.background,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },
});
