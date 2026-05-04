import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { theme } from "../../../theme/themes";
import type { MiniGame } from "../../../store/services/api";

export function FallbackGame({
  game,
  onFinish,
}: {
  game: MiniGame;
  onFinish: (stars: number) => void;
}) {
  return (
    <View>
      <View style={s.fallbackCard}>
        <Text style={s.fallbackType}>
          {game.type.replace(/_/g, " ").toUpperCase()}
        </Text>
        <Text style={s.fallbackDesc}>{game.description}</Text>
      </View>
      <TouchableOpacity style={s.nextBtn} onPress={() => onFinish(3)}>
        <Text style={s.nextBtnText}>COMPLETE</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  fallbackCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  fallbackType: {
    fontSize: 12,
    color: theme.colors.secondary,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  fallbackDesc: {
    fontSize: 15,
    color: theme.colors.text,
    textAlign: "center",
    lineHeight: 22,
  },
  nextBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.primaryContainer,
  },
  nextBtnText: {
    color: theme.colors.onPrimary,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },
});
