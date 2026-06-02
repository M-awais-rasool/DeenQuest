import React from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../theme/themes";

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: any;
  innerStyle?: any;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  style,
  innerStyle,
}) => {
  return (
    <SafeAreaView style={[styles.container, style]} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.content, innerStyle]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
  },
});
