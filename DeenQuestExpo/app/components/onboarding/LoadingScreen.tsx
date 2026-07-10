import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { Check, Clock } from "lucide-react-native";
import {
  ISLAMIC_QUOTES,
  LOADING_STEPS,
} from "../../utils/onboardingConfig";
import { COLORS, FONTS } from "./constants";

export default function LoadingScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const quote = ISLAMIC_QUOTES[Math.floor(Math.random() * ISLAMIC_QUOTES.length)];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= LOADING_STEPS.length - 1) return prev;
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <View style={styles.characterCircle}>
          <Image
            source={require("../../../assets/login-logo.png")}
            style={styles.characterImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Noor is thinking...</Text>

        <View style={styles.steps}>
          {LOADING_STEPS.map((step, i) => {
            const isVisible = i <= stepIndex;
            const isDone = i < stepIndex;
            return (
              <View
                key={i}
                style={[
                  styles.step,
                  { opacity: isVisible ? 1 : 0, transform: [{ translateX: isVisible ? 0 : -20 }] },
                ]}
              >
                {isDone ? (
                  <Check size={18} color={COLORS.primary} />
                ) : (
                  <Clock size={18} color={COLORS.textMuted} />
                )}
                <Text style={[styles.stepText, isDone && styles.stepTextDone]}>
                  {step}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.quoteBox}>
        <Text style={styles.quoteText}>{quote}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    zIndex: 50,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  characterCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.outline,
    overflow: "hidden",
  },
  characterImage: {
    width: 48,
    height: 48,
  },
  title: {
    fontSize: 20,
    fontFamily: "Nunito_800ExtraBold",
    color: COLORS.text,
    marginBottom: 32,
  },
  steps: {
    width: "100%",
    gap: 14,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  stepCheck: {
    fontSize: 18,
  },
  stepText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: COLORS.textMuted,
    flex: 1,
  },
  stepTextDone: {
    color: COLORS.primary,
    fontFamily: "Nunito_700Bold",
  },
  quoteBox: {
    position: "absolute",
    bottom: 40,
    left: 28,
    right: 28,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  quoteText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textMuted,
    fontStyle: "italic",
    textAlign: "center",
  },
});
