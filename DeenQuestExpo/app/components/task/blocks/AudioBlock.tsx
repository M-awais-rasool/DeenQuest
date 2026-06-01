import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Headphones } from "lucide-react-native";
import type { BlockComponentProps } from "./types";
import { theme } from "../../../theme/themes";
import type { AppStackParamList } from "../../../navigators/navigationTypes";
import { haptics } from "../../../utils/haptics";

export const AudioBlock = ({ content }: BlockComponentProps) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const surah = (content.surah as string) ?? "";
  const duration = (content.duration as number) ?? 300;
  const surahId = Number(content.surah_id);
  const canOpenSurah =
    Number.isInteger(surahId) && surahId >= 1 && surahId <= 114;

  return (
    <View style={s.card}>
      <View style={s.iconBox}>
        <Headphones size={28} color={theme.colors.secondary} />
      </View>
      <Text style={s.surah}>{surah}</Text>
      <Text style={s.duration}>{Math.floor(duration / 60)} min listening</Text>
      {canOpenSurah ? (
        <TouchableOpacity
          style={s.openButton}
          onPress={() => {
            haptics.light();
            navigation.navigate("SurahDetail", { surahId });
          }}
          activeOpacity={0.8}
        >
          <Headphones size={17} color={theme.colors.onPrimary} />
          <Text style={s.openButtonText}>Open Player</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    gap: 4,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.secondary12,
    borderWidth: 1,
    borderColor: theme.colors.secondary25,
    marginBottom: 6,
  },
  surah: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.text,
  },
  duration: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: "600",
  },
  openButton: {
    marginTop: 16,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.primaryContainer,
  },
  openButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
