import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { theme } from "../../../../theme/themes";
import { ContinueButton } from "../shared";

export function UpdateAppCard({ onComplete }: { onComplete: () => void }) {
  return (
    <View>
      <View style={s.card}>
        <View style={s.icon}>
          <Sparkles size={26} color="#5EE0CE" strokeWidth={2} />
        </View>
        <Text style={s.title}>A new kind of lesson!</Text>
        <Text style={s.body}>
          This lesson uses features from a newer version of DeenQuest. Update
          the app to play it — or skip it for now and keep going.
        </Text>
      </View>
      <ContinueButton
        label="SKIP FOR NOW"
        onPress={onComplete}
        style={{ marginTop: 22 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 19,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 19,
    fontFamily: "Nunito_900Black",
    color: theme.colors.text,
    marginTop: 16,
  },
  body: {
    fontSize: 13.5,
    lineHeight: 21,
    fontFamily: "Nunito_600SemiBold",
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
});

export default UpdateAppCard;
