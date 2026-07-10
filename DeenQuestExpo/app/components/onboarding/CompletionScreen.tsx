import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { theme } from "../../theme/themes";
import { COLORS, FONTS } from "./constants";
import BikeHornWrapper from "./BikeHornWrapper";

interface Props {
  selectedTags: string[];
  onStart: () => void;
  isLoading: boolean;
}

export default function CompletionScreen({ selectedTags, onStart, isLoading }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 80,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={styles.iconCircle}>
          <Sparkles size={48} color={COLORS.primary} />
        </View>
      </Animated.View>

      <Text style={styles.title}>Your path is ready!</Text>
      <Text style={styles.subtitle}>
        MashaAllah! Noor has crafted a personalized learning journey just for you.
      </Text>

      <View style={styles.tags}>
        {selectedTags.map((tag, i) => (
          <View key={i} style={styles.tagPill}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <BikeHornWrapper
        onPress={onStart}
        disabled={isLoading}
        wrapperStyle={{ width: "100%", opacity: isLoading ? 0.6 : 1 }}
        rimStyle={styles.ctaRim}
        capStyle={styles.ctaCap}
        height={64}
      >
        <Text style={styles.ctaText}>
          {isLoading ? "Generating..." : "Start My Journey ✨"}
        </Text>
      </BikeHornWrapper>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 60,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.primary15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: theme.colors.primary30,
  },
  title: {
    fontSize: 28,
    fontFamily: "Nunito_800ExtraBold",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 32,
  },
  tagPill: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  tagText: {
    fontSize: 12,
    fontFamily: "Nunito_700Bold",
    color: COLORS.primary,
  },
  ctaRim: {
    position: "absolute",
    top: 4,
    left: 0,
    right: 0,
    height: 60,
    borderRadius: 16,
    backgroundColor: COLORS.primaryContainer,
  },
  ctaCap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaText: {
    fontSize: 16,
    fontFamily: "Nunito_800ExtraBold",
    color: COLORS.onPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
