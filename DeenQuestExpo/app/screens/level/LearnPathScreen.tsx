import React from "react";
import { StyleSheet, View } from "react-native";
import { LearningPathContent } from "../../components/level/path";

/**
 * Deliberately not wrapped in `ScreenWrapper`.
 *
 * This screen's illustrated world has to reach every edge — under the status
 * bar at the top and under the floating tab bar at the bottom — so it takes
 * the safe-area insets itself and pads its own content around them rather than
 * being framed by a differently coloured container.
 */
export function LearnPathScreen() {
  return (
    <View style={s.root}>
      <LearningPathContent />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
});
