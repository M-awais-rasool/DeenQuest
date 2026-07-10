import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { TactilePressable } from "../../ui";
import * as Haptics from "expo-haptics";
import type { BlockComponentProps } from "./types";
import { theme } from "../../../theme/themes";

export const CounterBlock = ({
  content,
  completed,
  loading,
  onAutoComplete,
}: BlockComponentProps) => {
  const target = (content.target as number) ?? 33;
  const phrase = (content.phrase as string) ?? "";
  const [count, setCount] = useState(completed ? target : 0);

  const reached = count >= target;
  const isDisabled = completed || loading;

  useEffect(() => {
    if (reached && !completed) {
      onAutoComplete();
    }
  }, [reached, completed, onAutoComplete]);

  const handleTap = () => {
    if (isDisabled || reached) return;
    setCount((c) => Math.min(c + 1, target));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={s.wrapper}>
      <TactilePressable
        edgeColor="#0E2C29"
        depth={8}
        radius={79}
        haptic="none"
        dimWhenDisabled={false}
        style={s.tapBtnWrap}
        faceStyle={[s.circle, reached && s.circleDone]}
        onPress={handleTap}
        disabled={isDisabled || reached}
      >
        <Text style={s.count}>{count}</Text>
        <Text style={[s.ofText, reached && s.ofTextDone]}>
          {reached ? "complete" : `of ${target}`}
        </Text>
      </TactilePressable>
      <Text style={s.phrase}>{phrase}</Text>
      <Text style={s.helper}>TAP ANYWHERE ON THE CIRCLE TO COUNT</Text>
    </View>
  );
};

const s = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
    alignItems: "center",
    paddingTop: 18,
  },
  tapBtnWrap: {
    alignSelf: "center",
  },
  circle: {
    width: 158,
    height: 158,
    borderRadius: 79,
    backgroundColor: theme.colors.primaryContainer,
    borderWidth: 5,
    borderColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  circleDone: {
    borderColor: theme.colors.secondary,
    backgroundColor: "#3A2F16",
  },
  count: {
    fontSize: 46,
    lineHeight: 50,
    fontFamily: "Nunito_900Black",
    color: theme.colors.text,
  },
  ofText: {
    fontSize: 12,
    fontFamily: "Nunito_800ExtraBold",
    color: "#5EE0CE",
  },
  ofTextDone: { color: theme.colors.secondary },
  phrase: {
    fontSize: 17,
    fontFamily: "Nunito_800ExtraBold",
    color: theme.colors.text,
    textAlign: "center",
    marginTop: 14,
  },
  helper: {
    fontSize: 12,
    fontFamily: "Nunito_700Bold",
    color: "#5F7E7C",
    letterSpacing: 0.7,
    marginTop: 4,
  },
});
