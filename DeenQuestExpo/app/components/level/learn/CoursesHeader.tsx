import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Sparkles } from "lucide-react-native";
import { theme } from "../../../theme/themes";

export const CoursesHeader = memo(function CoursesHeader() {
  return (
    <View style={s.wrap}>
      <View style={s.badge}>
        <Sparkles size={12} color={theme.colors.primary} />
        <Text style={s.badgeText}>MY LEARNING PATH</Text>
      </View>
      <Text style={s.title}>Choose a Course</Text>
      <Text style={s.sub}>
        Build your Quran knowledge, one module at a time
      </Text>
    </View>
  );
});

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.colors.primary12,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.primary25,
  },
  badgeText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.2,
  },
  title: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0.1,
    lineHeight: 38,
  },
  sub: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
});
