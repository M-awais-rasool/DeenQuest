import React from "react";
import { View, Text } from "react-native";
import type { ComponentProps } from "./types";
import { CompleteButton } from "./CompleteButton";
import { shared } from "./sharedStyles";

export const QuranReaderComponent = ({
  task,
  onComplete,
  loading,
}: ComponentProps) => {
  const surah = (task.data?.surah as string) ?? "";
  const ayahs = (task.data?.ayahs as number[]) ?? [];

  return (
    <View style={shared.container}>
      <View style={shared.quranCard}>
        <Text style={shared.quranSurah}>{surah}</Text>
        <Text style={shared.quranAyahs}>Ayahs: {ayahs.join(", ")}</Text>
      </View>
      <Text style={shared.quranHint}>
        Read the ayahs above and reflect on their meaning.
      </Text>
      <CompleteButton
        onPress={onComplete}
        loading={loading}
        disabled={task.completed}
        label="I've Read Them"
      />
    </View>
  );
};
