import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../theme/themes";

export const XPBadge = ({ xp }: { xp: number }) => (
  <View style={s.xpBadge}>
    <Text style={s.xpText}>+{xp} XP</Text>
  </View>
);

export const CategoryBadge = ({ category }: { category: string }) => (
  <View style={s.categoryBadge}>
    <Text style={s.categoryText}>{category.toUpperCase()}</Text>
  </View>
);

const s = StyleSheet.create({
  xpBadge: {
    backgroundColor: "#3A2F16",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 11,
  },
  xpText: {
    color: theme.colors.secondary,
    fontFamily: "Nunito_900Black",
    fontSize: 11,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#4A3E28",
  },
  categoryText: {
    color: theme.colors.secondary,
    fontFamily: "Nunito_900Black",
    fontSize: 11,
    letterSpacing: 0.7,
  },
});
