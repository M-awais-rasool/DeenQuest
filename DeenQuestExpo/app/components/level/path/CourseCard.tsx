import React, { memo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { ChevronRight, Zap } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import { BookGlyph } from "../map";
import type { PathSection } from "./types";

interface CourseCardProps {
  title: string;
  section: PathSection | undefined;
  xp: number;
  onPress: () => void;
}

export const CourseCard = memo(function CourseCard({
  title,
  section,
  xp,
  onPress,
}: CourseCardProps) {
  const lessons = section?.data.reduce((n, l) => n + l.lesson_count, 0) ?? 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.card, pressed && s.pressed]}
    >
      <View style={s.tile}>
        <BookGlyph size={26} color="#5FE8D8" />
      </View>

      <View style={s.texts}>
        <Text style={s.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={s.sub} numberOfLines={1}>
          {section ? `Section ${section.number}` : "Getting started"}
          {lessons > 0 ? ` · ${lessons} lessons` : ""}
        </Text>
      </View>

      {xp > 0 && (
        <View style={s.xp}>
          <Zap
            size={13}
            color={theme.colors.secondary}
            fill={theme.colors.secondary}
          />
          <Text style={s.xpText}>{xp}</Text>
        </View>
      )}

      <ChevronRight size={22} color="#7FA0A8" strokeWidth={2.4} />
    </Pressable>
  );
});

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "rgba(13, 47, 56, 0.62)",
    borderWidth: 1,
    borderColor: "rgba(42, 108, 120, 0.7)",
  },
  pressed: {
    opacity: 0.75,
  },
  tile: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(47, 227, 208, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(47, 227, 208, 0.28)",
  },
  texts: {
    flex: 1,
  },
  title: {
    color: theme.colors.white,
    fontSize: 18,
    fontFamily: "Nunito_900Black",
  },
  sub: {
    color: "#8FA8AE",
    fontSize: 13,
    fontFamily: "Nunito_500Medium",
    marginTop: 2,
  },
  xp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(242, 195, 107, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(242, 195, 107, 0.3)",
  },
  xpText: {
    color: theme.colors.secondary,
    fontSize: 12.5,
    fontFamily: "Nunito_800ExtraBold",
  },
});
