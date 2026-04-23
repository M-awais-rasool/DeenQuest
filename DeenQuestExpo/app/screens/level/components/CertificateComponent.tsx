import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Award, ChevronRight } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";

export function CertificateComponent({
  lesson,
  onComplete,
}: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;

  return (
    <View>
      <View style={s.card}>
        <View style={s.iconCircle}>
          <Award size={40} color={theme.colors.secondary} />
        </View>
        <Text style={s.title}>{data.title}</Text>
        <View style={s.divider} />
        <Text style={s.message}>{data.message}</Text>
        {data.next_phase && (
          <View style={s.nextBadge}>
            <Text style={s.nextLabel}>NEXT UP</Text>
            <Text style={s.nextPhase}>{data.next_phase}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={s.continueBtn} onPress={onComplete}>
        <Text style={s.continueBtnText}>CLAIM CERTIFICATE</Text>
        <ChevronRight size={18} color={theme.colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.secondary30,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.secondary15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    color: theme.colors.secondary,
    fontWeight: "900",
    textAlign: "center",
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: theme.colors.secondary30,
    marginVertical: 16,
  },
  message: {
    fontSize: 15,
    color: theme.colors.text,
    textAlign: "center",
    lineHeight: 24,
  },
  nextBadge: {
    marginTop: 20,
    backgroundColor: theme.colors.primary10,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    width: "100%",
  },
  nextLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: "900",
    letterSpacing: 1,
  },
  nextPhase: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "800",
    marginTop: 4,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.secondary,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
    gap: 6,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.goldDark,
  },
  continueBtnText: {
    color: theme.colors.onSecondary,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },
});
