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
      <Text style={s.phrase}>{phrase}</Text>
      <Text style={[s.count, reached && s.countDone]}>
        {count} / {target}
      </Text>
      <View style={s.track}>
        <View
          style={[
            s.bar,
            { width: `${Math.min((count / target) * 100, 100)}%` as any },
            reached && s.barDone,
          ]}
        />
      </View>
      <TactilePressable
        edgeColor={theme.colors.primaryContainer}
        depth={5}
        radius={60}
        haptic="light"
        dimWhenDisabled={false}
        style={s.tapBtnWrap}
        faceStyle={[s.tapBtn, (reached || isDisabled) && s.tapBtnDone]}
        onPress={handleTap}
        disabled={isDisabled || reached}
      >
        <Text style={[s.tapText, (reached || isDisabled) && s.tapTextDone]}>
          {reached || completed ? "✓" : "Tap"}
        </Text>
      </TactilePressable>
    </View>
  );
};

const s = StyleSheet.create({
  wrapper: { marginBottom: 8 },
  phrase: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: 16,
  },
  count: {
    fontSize: 48,
    fontWeight: "900",
    color: theme.colors.primary,
    textAlign: "center",
  },
  countDone: { color: theme.colors.secondary },
  track: {
    height: 8,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 4,
    marginVertical: 16,
    overflow: "hidden",
  },
  bar: {
    height: "100%" as any,
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  barDone: { backgroundColor: theme.colors.secondary },
  tapBtnWrap: {
    alignSelf: "center",
    marginBottom: 8,
  },
  tapBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary15,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  tapBtnDone: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    opacity: 0.6,
  },
  tapText: { color: theme.colors.primary, fontSize: 20, fontWeight: "900" },
  tapTextDone: { color: theme.colors.onPrimary, fontSize: 28 },
});
