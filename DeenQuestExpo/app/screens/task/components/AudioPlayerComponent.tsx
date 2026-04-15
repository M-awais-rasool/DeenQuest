import React from "react";
import { View, Text } from "react-native";
import type { ComponentProps } from "./types";
import { CompleteButton } from "./CompleteButton";
import { shared } from "./sharedStyles";

export const AudioPlayerComponent = ({
  task,
  onComplete,
  loading,
}: ComponentProps) => {
  const surah = (task.data?.surah as string) ?? "";
  const duration = (task.data?.duration as number) ?? 300;

  return (
    <View style={shared.container}>
      <View style={shared.audioCard}>
        <Text style={shared.audioSurah}>{surah}</Text>
        <Text style={shared.audioDuration}>
          {Math.floor(duration / 60)} min listening
        </Text>
      </View>
      <Text style={shared.audioHint}>
        Play the audio and listen attentively.
      </Text>
      <CompleteButton
        onPress={onComplete}
        loading={loading}
        disabled={task.completed}
        label="I've Listened"
      />
    </View>
  );
};
