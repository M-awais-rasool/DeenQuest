import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { theme } from "../../../theme/themes";

/** Three small dots that visually connect consecutive course cards. */
export const CardConnector = memo(function CardConnector() {
  return (
    <View style={s.wrap}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={s.dot} />
      ))}
    </View>
  );
});

const s = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    alignItems: "center",
    paddingVertical: 5,
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.outline,
  },
});
