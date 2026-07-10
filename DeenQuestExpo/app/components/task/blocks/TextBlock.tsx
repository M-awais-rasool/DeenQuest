import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { BlockComponentProps } from "./types";
import { theme } from "../../../theme/themes";

export const TextBlock = ({ content }: BlockComponentProps) => {
  const text = (content.content as string) ?? "";
  const items = (content.items as string[]) ?? [];
  const listStyle = (content.style as string) ?? "numbered";

  return (
    <View style={s.wrapper}>
      {text ? <Text style={s.text}>{text}</Text> : null}
      {items.map((item, i) => (
        <View key={i} style={s.row}>
          <View style={s.bullet}>
            <Text style={s.bulletText}>
              {listStyle === "numbered" ? i + 1 : "•"}
            </Text>
          </View>
          <Text style={s.itemText}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

const s = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: theme.colors.textMuted,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 22,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceLow,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    gap: 14,
  },
  bullet: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary15,
    justifyContent: "center",
    alignItems: "center",
  },
  bulletText: {
    color: theme.colors.primary,
    fontFamily: "Nunito_900Black",
    fontSize: 14,
  },
  itemText: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    flex: 1,
  },
});
