import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Brain, Clock, Swords, Users } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { AnimatedPressable } from "../ui";
import { home } from "./tokens";

export type ExploreRoute =
  "PrayerTimes" | "HifzHome" | "Challenges" | "ParentDashboard";

const LINKS: {
  route: ExploreRoute;
  label: string;
  Icon: LucideIcon;
  tile: [string, string];
}[] = [
  {
    route: "PrayerTimes",
    label: "Prayers",
    Icon: Clock,
    tile: ["#4FC3E8", "#14465C"],
  },
  {
    route: "HifzHome",
    label: "My Hifz",
    Icon: Brain,
    tile: ["#E0A64F", "#6A4413"],
  },
  {
    route: "Challenges",
    label: "Challenges",
    Icon: Swords,
    tile: ["#8A7AE8", "#3A3470"],
  },
  {
    route: "ParentDashboard",
    label: "Family",
    Icon: Users,
    tile: ["#E874A8", "#6A2745"],
  },
];

export const ExploreRow = memo(function ExploreRow({
  onOpen,
}: {
  onOpen: (route: ExploreRoute) => void;
}) {
  return (
    <View style={s.row}>
      {LINKS.map(({ route, label, Icon, tile }) => (
        <AnimatedPressable
          key={route}
          style={s.card}
          onPress={() => onOpen(route)}
        >
          <LinearGradient
            colors={tile}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={s.tile}
          >
            <Icon size={21} color="#EAFBF9" strokeWidth={2.2} />
          </LinearGradient>
          <Text style={s.label} numberOfLines={1}>
            {label}
          </Text>
        </AnimatedPressable>
      ))}
    </View>
  );
});

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: home.gutter,
  },
  card: {
    flex: 1,
    alignItems: "center",
    gap: 9,
    paddingVertical: 14,
    borderRadius: home.radius,
    borderWidth: 1,
    borderColor: home.cardBorder,
    backgroundColor: home.card,
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: home.soft,
    fontSize: 12.5,
    fontFamily: "Nunito_700Bold",
  },
});
