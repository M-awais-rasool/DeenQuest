import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Lightbulb } from "lucide-react-native";
import { theme } from "../../../../theme/themes";
import { useQuranFont } from "../../../../hooks/useQuranFont";

export function HintCard({
  text,
  arabic,
  style,
}: {
  text?: string;
  arabic?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { fontFamily } = useQuranFont();
  if (!text && !arabic) return null;

  return (
    <View style={[s.card, style]}>
      <Lightbulb size={15} color={theme.colors.secondary} style={s.icon} />
      <Text style={s.text}>
        {text}
        {arabic ? (
          <Text style={[s.arabic, { fontFamily }]}>
            {text ? "  " : ""}
            {arabic}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.secondary10,
    borderColor: theme.colors.secondary30,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  icon: {
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
    color: theme.colors.text,
    fontWeight: "600",
  },
  arabic: {
    fontSize: 20,
    color: theme.colors.secondary,
    writingDirection: "rtl",
  },
});

export default HintCard;
