import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Flame } from "lucide-react-native";
import { theme } from "../theme/themes";

interface HeaderProps {
  title: string;
  xp: number;
  Icon?: any;
  onSettingsPress?: () => void;
}

export const Header = ({ title, xp, Icon, onSettingsPress }: HeaderProps) => {
  return (
    <View style={styles.topBar}>
      <View style={styles.logoRow}>
        <Flame
          size={24}
          color={theme.colors.primary}
          fill={theme.colors.primary}
        />
        <Text style={styles.logoText}>{title}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>{xp.toLocaleString()} XP</Text>
        </View>
        {Icon && (
          <TouchableOpacity style={styles.iconButton} onPress={onSettingsPress}>
            <Icon color="#E2E2E2" size={20} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.surfaceLow,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.primary,
    textTransform: "uppercase",
  },
  xpBadge: {
    backgroundColor: theme.colors.surfaceHigh,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(136, 217, 130, 0.3)",
  },
  xpText: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 16,
    textTransform: "uppercase",
  },
  iconButton: {
    backgroundColor: theme.colors.surfaceHigh,
    padding: 8,
    borderRadius: 999,
  },
});
