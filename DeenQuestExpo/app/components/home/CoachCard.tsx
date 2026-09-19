import React, { memo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, Sparkles } from "lucide-react-native";
import { AnimatedPressable, TactilePressable } from "../ui";
import { home } from "./tokens";

import type { CoachState } from "../../services/coach";

export const CoachCard = memo(function CoachCard({
  coach,
  onFix,
  onInsights,
}: {
  coach: CoachState;
  onFix: () => void;
  onInsights: () => void;
}) {
  const m = coach.message;

  return (
    <View style={s.card}>
      <View style={s.header}>
        <LinearGradient
          colors={["#3BEDE2", "#0B6F73"]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={s.tile}
        >
          <Sparkles size={24} color="#04262B" strokeWidth={2.2} />
        </LinearGradient>

        <View style={s.headerText}>
          <View style={s.titleRow}>
            <Text style={s.title}>Your Coach</Text>
            <View style={s.aiChip}>
              <Text style={s.aiChipText}>AI</Text>
            </View>
          </View>
          <Text style={s.subtitle} numberOfLines={1}>
            {coach.subtitle}
          </Text>
        </View>

        <Pressable
          onPress={onInsights}
          hitSlop={10}
          style={({ pressed }) => [s.chevron, pressed && { opacity: 0.6 }]}
        >
          <ChevronRight size={20} color={home.tealBright} strokeWidth={2.8} />
        </Pressable>
      </View>

      <View style={s.well}>
        <Text style={s.message}>
          {m.before}
          <Text style={s.arabic}>{m.arabicA}</Text>
          {m.middle}
          <Text style={s.arabic}>{m.arabicB}</Text>
          {m.after}
          <Text style={s.highlight}>{m.highlight}</Text>
          {m.tail}
        </Text>
      </View>

      <View style={s.buttons}>
        <TactilePressable
          style={{ flex: 1 }}
          faceStyle={s.primary}
          edgeColor="#0B7A74"
          radius={14}
          depth={4}
          haptic="medium"
          onPress={onFix}
        >
          <Text style={s.primaryText}>
            {coach.fixMinutes > 0
              ? `FIX IT · ${coach.fixMinutes} MIN`
              : "VIEW INSIGHTS"}
          </Text>
        </TactilePressable>

        <AnimatedPressable style={s.secondary} onPress={onInsights}>
          <Text style={s.secondaryText}>ALL INSIGHTS</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  card: {
    marginHorizontal: home.gutter,
    borderRadius: home.radius,
    borderWidth: 1,
    borderColor: home.cardBorder,
    // The plain card the streak and XP sit on — no artwork behind the coach,
    // so it reads as a note rather than as another place to go.
    backgroundColor: home.card,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  tile: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: home.text,
    fontSize: 17,
    fontFamily: "Nunito_900Black",
  },
  aiChip: {
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: "rgba(47, 227, 208, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(47, 227, 208, 0.45)",
  },
  aiChipText: {
    color: home.tealBright,
    fontSize: 10,
    fontFamily: "Nunito_900Black",
    letterSpacing: 0.8,
  },
  subtitle: {
    color: home.muted,
    fontSize: 13,
    fontFamily: "Nunito_500Medium",
    marginTop: 1,
  },
  chevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(47, 227, 208, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(47, 227, 208, 0.3)",
  },
  well: {
    borderRadius: 14,
    backgroundColor: home.well,
    borderWidth: 1,
    borderColor: home.wellBorder,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  message: {
    color: home.soft,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Nunito_500Medium",
  },
  arabic: {
    color: home.tealBright,
    fontFamily: "Amiri_700Bold",
    fontSize: 17,
  },
  highlight: {
    color: home.goldBright,
    fontFamily: "Nunito_800ExtraBold",
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  primary: {
    backgroundColor: home.teal,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "#04262B",
    fontSize: 14,
    fontFamily: "Nunito_900Black",
    letterSpacing: 0.8,
  },
  secondary: {
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(47, 227, 208, 0.45)",
    backgroundColor: "rgba(47, 227, 208, 0.08)",
  },
  secondaryText: {
    color: home.tealBright,
    fontSize: 13,
    fontFamily: "Nunito_900Black",
    letterSpacing: 0.6,
  },
});
