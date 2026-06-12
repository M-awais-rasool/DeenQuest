import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TactilePressable } from "../../ui";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BookOpen } from "lucide-react-native";
import type { BlockComponentProps } from "./types";
import { theme } from "../../../theme/themes";
import type { AppStackParamList } from "../../../navigators/navigationTypes";

export const AyahBlock = ({ content }: BlockComponentProps) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const surah = (content.surah as string) ?? "";
  const ayahs = (content.ayahs as number[]) ?? [];
  const surahId = Number(content.surah_id);
  const canOpenSurah =
    Number.isInteger(surahId) && surahId >= 1 && surahId <= 114;

  return (
    <View style={s.card}>
      <Text style={s.surah}>{surah}</Text>
      <Text style={s.ayahs}>Ayahs: {ayahs.join(", ")}</Text>
      {canOpenSurah ? (
        <TactilePressable
          edgeColor={theme.colors.primaryContainer}
          depth={3}
          radius={8}
          haptic="light"
          style={s.openButtonWrap}
          faceStyle={s.openButton}
          onPress={() => navigation.navigate("SurahDetail", { surahId })}
        >
          <BookOpen size={17} color={theme.colors.onPrimary} />
          <Text style={s.openButtonText}>Open Surah</Text>
        </TactilePressable>
      ) : null}
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 24,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    marginBottom: 12,
  },
  surah: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 4,
  },
  ayahs: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: "600",
  },
  openButtonWrap: {
    marginTop: 16,
    alignSelf: "flex-start",
  },
  openButton: {
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  openButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
