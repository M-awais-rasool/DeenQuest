import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../../theme/themes";
import { hexToRgba } from "../map";
import { courseEntry } from "./courseCatalog";
import type { PathSection } from "./types";

/**
 * The band that marks where one course ends and the next begins.
 *
 * Every course starts with its first level unlocked, which is correct — but
 * with the courses laid end to end and nothing between them, Namaz's first
 * level reads as a stray unlocked node sitting in the middle of Qaida. This
 * says plainly that a new course starts here, so two open levels look like two
 * beginnings rather than a broken sequence.
 */
export const CourseHeader = memo(function CourseHeader({
  section,
}: {
  section: PathSection;
}) {
  const course = courseEntry(section.courseType);
  const accent = section.colors.accent;

  return (
    <View style={s.wrap}>
      <View style={[s.rule, { backgroundColor: hexToRgba(accent, 0.35) }]} />
      <View
        style={[
          s.plate,
          {
            borderColor: hexToRgba(accent, 0.45),
            backgroundColor: hexToRgba(accent, 0.08),
          },
        ]}
      >
        <course.Icon size={16} color={accent} strokeWidth={2.6} />
        <View style={s.text}>
          <Text style={[s.eyebrow, { color: accent }]}>COURSE</Text>
          <Text style={s.title} numberOfLines={1}>
            {course.title}
          </Text>
        </View>
      </View>
      <Text style={s.subtitle} numberOfLines={2}>
        {course.subtitle}
      </Text>
    </View>
  );
});

const s = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingHorizontal: 26,
    paddingTop: 30,
    paddingBottom: 10,
    gap: 10,
  },
  rule: {
    alignSelf: "stretch",
    height: 1.5,
    borderRadius: 1,
    marginBottom: 6,
  },
  plate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  text: {
    gap: 1,
  },
  eyebrow: {
    fontSize: 9.5,
    fontFamily: "Nunito_900Black",
    letterSpacing: 1.6,
  },
  title: {
    fontSize: 16,
    fontFamily: "Nunito_800ExtraBold",
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 12.5,
    fontFamily: "Nunito_400Regular",
    color: theme.colors.textMuted,
    textAlign: "center",
  },
});
