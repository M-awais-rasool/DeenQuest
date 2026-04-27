import React from "react";
import { View, StyleSheet, StatusBar, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../theme/themes";

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: any;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  style,
}) => {
  return (
    <SafeAreaView style={[styles.container, style]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  content: { flex: 1 },
});
