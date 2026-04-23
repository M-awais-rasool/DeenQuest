import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../../theme/themes";

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
    backgroundColor: theme.colors.secondary15,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.secondary30,
  },
  xpText: {
    color: theme.colors.secondary,
    fontWeight: "800",
    fontSize: 12,
  },
  categoryBadge: {
    backgroundColor: theme.colors.primary15,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary30,
  },
  categoryText: {
    color: theme.colors.primary,
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 1,
  },
});
