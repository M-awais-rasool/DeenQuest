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
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: 22,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: "center",
  },
  surah: {
    fontSize: 22,
    fontFamily: "Nunito_900Black",
    color: theme.colors.text,
    marginBottom: 6,
    textAlign: "center",
  },
  ayahs: {
    fontSize: 11.5,
    color: theme.colors.secondary,
    fontFamily: "Nunito_800ExtraBold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  openButtonWrap: {
    marginTop: 16,
    alignSelf: "center",
  },
  openButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  openButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
    fontFamily: "Nunito_900Black",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
