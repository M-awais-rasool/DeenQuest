import React, { memo } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { Settings } from "lucide-react-native";
import { home } from "./tokens";

const MOON = require("../../../assets/level/moon.png");
const MASCOT = require("../../../assets/home/mascot.png");

const MASCOT_W = 96;
const MASCOT_H = Math.round(MASCOT_W * (155 / 146));

function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 12) return "Good morning,";
  if (h < 17) return "Good afternoon,";
  return "Good evening,";
}

export const HomeHeader = memo(function HomeHeader({
  name,
  onSettings,
}: {
  name: string;
  onSettings: () => void;
}) {
  return (
    <View style={s.wrap}>
      <Image source={MOON} style={s.moon} resizeMode="contain" />

      <View style={s.titles}>
        <Text style={s.greeting} numberOfLines={1}>
          {greetingFor(new Date())}
        </Text>
        <Text style={s.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={s.tagline} numberOfLines={1}>
          Small steps. Big rewards.
        </Text>
      </View>

      <Pressable
        onPress={onSettings}
        hitSlop={12}
        style={({ pressed }) => [s.gear, pressed && { opacity: 0.6 }]}
      >
        <Settings size={24} color={home.soft} strokeWidth={2} />
      </Pressable>

      <Image source={MASCOT} style={s.mascot} resizeMode="contain" />
    </View>
  );
});

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: home.gutter,
    paddingTop: 4,
    gap: 12,
  },
  moon: {
    width: 46,
    height: 46,
    marginTop: 4,
  },
  titles: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    color: home.soft,
    fontSize: 19,
    fontFamily: "Nunito_600SemiBold",
  },
  name: {
    color: home.text,
    fontSize: 29,
    fontFamily: "Nunito_900Black",
    marginTop: -2,
  },
  tagline: {
    color: home.muted,
    fontSize: 13.5,
    fontFamily: "Nunito_500Medium",
    marginTop: 4,
  },
  gear: {
    paddingTop: 2,
  },
  mascot: {
    position: "absolute",
    right: 24,
    // Reaches past the header so the stats card, drawn after it, cuts it off
    // at the waist.
    bottom: -34,
    width: MASCOT_W,
    height: MASCOT_H,
  },
});
