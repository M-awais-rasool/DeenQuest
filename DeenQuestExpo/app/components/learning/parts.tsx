import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { AnimatedPressable } from "../ui";
import { theme } from "../../theme/themes";

// Shared header + empty-state for the Phase-1 learning screens (Daily Review,
// Mistake Notebook, Mastery Map) — keeps them consistent and DRY.

export function LearningHeader({
  title,
  subtitle,
  onBack,
  count,
  countLabel,
  accent = theme.colors.secondary,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  count?: number;
  countLabel?: string;
  accent?: string;
}) {
  return (
    <View style={h.row}>
      <AnimatedPressable onPress={onBack} style={h.back} hitSlop={8}>
        <ChevronLeft size={22} color={theme.colors.text} />
      </AnimatedPressable>
      <View style={h.titles}>
        <Text style={h.title}>{title}</Text>
        {subtitle ? <Text style={h.sub}>{subtitle}</Text> : null}
      </View>
      {count !== undefined && count > 0 ? (
        <View style={[h.chip, { backgroundColor: accent + "1F", borderColor: accent + "40" }]}>
          <Text style={[h.chipText, { color: accent }]}>
            {count}
            {countLabel ? ` ${countLabel}` : ""}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  sub,
}: {
  icon: LucideIcon;
  title: string;
  sub: string;
}) {
  return (
    <View style={e.wrap}>
      <View style={e.circle}>
        <Icon size={30} color={theme.colors.primary} />
      </View>
      <Text style={e.title}>{title}</Text>
      <Text style={e.sub}>{sub}</Text>
    </View>
  );
}

const h = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 8,
    paddingBottom: 16,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline25,
    justifyContent: "center",
    alignItems: "center",
  },
  titles: { flex: 1 },
  title: { color: theme.colors.text, fontSize: 21, fontWeight: "900", letterSpacing: 0.2 },
  sub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 2 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  chipText: { fontSize: 12, fontWeight: "900" },
});

const e = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 64, paddingHorizontal: 24 },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary12,
    borderWidth: 1,
    borderColor: theme.colors.primary30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { color: theme.colors.text, fontSize: 17, fontWeight: "900", marginBottom: 6 },
  sub: { color: theme.colors.textMuted, fontSize: 13, textAlign: "center", lineHeight: 19 },
});
