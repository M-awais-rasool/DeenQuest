import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Trophy } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../../theme/themes";
import { type RewardWithStatus } from "../../../store/services/api";

type Props = {
  rewards: RewardWithStatus[];
  xp: number;
};

export function StatsHeader({ rewards, xp }: Props) {
  const unlocked = rewards.filter((r) => r.unlocked).length;
  const total = rewards.length;
  const pct = total > 0 ? (unlocked / total) * 100 : 0;

  return (
    <LinearGradient
      colors={[theme.colors.primaryContainer, "#1a4d1e"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.heroCard}
    >
      <View style={s.heroIconWrap}>
        <Trophy
          size={56}
          color={theme.colors.secondary}
          fill={theme.colors.secondary}
        />
      </View>

      <Text style={s.heroTitle}>Reward Vault</Text>
      <Text style={s.heroSub}>
        Milestones unlock automatically as you grow.
      </Text>

      <View style={s.heroStats}>
        <View style={s.statBox}>
          <Text style={s.statVal}>{unlocked}</Text>
          <Text style={s.statLab}>Unlocked</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statBox}>
          <Text style={s.statVal}>{total}</Text>
          <Text style={s.statLab}>Total</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statBox}>
          <Text style={s.statVal}>{xp.toLocaleString()}</Text>
          <Text style={s.statLab}>Total XP</Text>
        </View>
      </View>

      <View style={s.heroProgressTrack}>
        <View style={[s.heroProgressFill, { width: `${pct}%` as any }]} />
      </View>
      <Text style={s.heroProgressLabel}>
        {unlocked}/{total} milestones reached
      </Text>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  heroCard: {
    borderRadius: theme.borderRadius.xl,
    padding: 28,
    alignItems: "center",
    marginBottom: 4,
    overflow: "hidden",
  },
  heroIconWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: theme.colors.white10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.colors.white20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.white,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    color: theme.colors.white70,
    textAlign: "center",
    marginBottom: 22,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.black20,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 20,
    marginBottom: 16,
  },
  statBox: { alignItems: "center" },
  statVal: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.secondary,
  },
  statLab: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.white60,
    textTransform: "uppercase",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.white10,
  },
  heroProgressTrack: {
    width: "100%",
    height: 6,
    backgroundColor: theme.colors.black20,
    borderRadius: 3,
    overflow: "hidden",
  },
  heroProgressFill: {
    height: "100%",
    backgroundColor: theme.colors.secondary,
    borderRadius: 3,
  },
  heroProgressLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.white60,
  },
});
