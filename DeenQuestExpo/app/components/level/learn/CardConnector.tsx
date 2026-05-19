import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { theme } from "../../../theme/themes";

export const CardConnector = memo(function CardConnector() {
  return (
    <View style={s.wrap}>
      <View style={s.dot} />
    </View>
  );
});

const s = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    alignItems: "center",
    paddingVertical: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.outline + "70",
  },
});
