import React, { useMemo } from "react";
import { StyleSheet, View, Text, ScrollView, Share, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Flame, Share2, Settings, Check } from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { AnimatedPressable } from "../../components/ui";
import { dq } from "../../theme/designTokens";
import {
  useGetProfileQuery,
  useGetProgressQuery,
  useGetRewardsQuery,
  useGetLeaderboardQuery,
  type RewardWithStatus,
} from "../../store/services/api";
import { RewardIcon } from "../reward/components/RewardIcon";
import type { DemoTabScreenProps } from "../../navigators/navigationTypes";

type Props = DemoTabScreenProps<"ProfileScreen">;

function rankWord(title?: string): string {
  const first = (title || "Seeker").trim().split(/\s+/)[0] || "Seeker";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export function ProfileScreen({ navigation }: Props) {
  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery();
  const { data: progressData, isLoading: progressLoading } = useGetProgressQuery();
  const { data: rewardsData, isLoading: rewardsLoading } = useGetRewardsQuery();
  const { data: leaderboardData } = useGetLeaderboardQuery(undefined);

  const profile = profileData?.data;
  const progress = progressData?.data;
  const rewards: RewardWithStatus[] = rewardsData?.data ?? [];

  const unlockedRewards = useMemo(
    () => rewards.filter((r) => r.unlocked),
    [rewards],
  );
  const lockedRewards = useMemo(
    () => rewards.filter((r) => !r.unlocked),
    [rewards],
  );

  const myRank = useMemo(() => {
    const me = leaderboardData?.data?.find((u) => u.user_id === profile?.id);
    return me?.rank;
  }, [leaderboardData, profile?.id]);

  if (profileLoading || progressLoading || rewardsLoading) {
    return (
      <ScreenWrapper>
        <Loader fullScreen />
      </ScreenWrapper>
    );
  }

  const displayName =
    profile?.display_name || profile?.email?.split("@")[0] || "Explorer";
  const initial = displayName.charAt(0).toUpperCase();
  const totalXP = progress?.xp ?? 0;
  const level = progress?.level ?? 1;
  const currentStreak = progress?.current_streak ?? 0;
  const longestStreak = progress?.longest_streak ?? currentStreak;
  const barakahScore = progress?.barakah_score ?? 0;
  const weeklyCompletions: boolean[] =
    progress?.weekly_completions ?? new Array(7).fill(false);

  const handleShareProfile = async () => {
    if (!profile?.id) return;
    const deepLink = `deenquest://profile/${profile.id}`;
    try {
      await Share.share({
        title: `${displayName}'s DeenQuest Profile`,
        message: `Check out ${displayName}'s profile on DeenQuest!\n${deepLink}`,
        url: deepLink,
      });
    } catch {}
  };

  // Vault preview: up to 3 unlocked gold medallions, then dashed locked
  // slots to fill the 5-circle row (F1 mock).
  const vaultUnlocked = unlockedRewards.slice(0, 3);
  const vaultLocked = lockedRewards.slice(0, 5 - vaultUnlocked.length);

  return (
    <ScreenWrapper innerStyle={styles.wrapper}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* header */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Profile</Text>
          <AnimatedPressable
            style={styles.gear}
            onPress={() => navigation.navigate("Settings")}
          >
            <Settings size={18} color={dq.muted} strokeWidth={2} />
          </AnimatedPressable>
        </View>

        {/* identity */}
        <View style={styles.identityCard}>
          <LinearGradient
            colors={[dq.green, dq.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </LinearGradient>
          <View style={styles.identityBody}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.rankLine}>
              Level {level} · {rankWord(profile?.title)}
            </Text>
            {!!profile?.bio && (
              <Text style={styles.joinLine} numberOfLines={1}>
                {profile.bio}
              </Text>
            )}
          </View>
          <AnimatedPressable style={styles.shareChip} onPress={handleShareProfile}>
            <Share2 size={13} color="#5EE0CE" strokeWidth={2.4} />
            <Text style={styles.shareChipText}>SHARE</Text>
          </AnimatedPressable>
        </View>

        {/* stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: dq.gold }]}>
              {totalXP.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>TOTAL XP</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: dq.green }]}>
              {barakahScore.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>BARAKAH</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.statCard, pressed && { opacity: 0.8 }]}
            onPress={() => navigation.navigate("Leaderboard")}
          >
            <Text style={[styles.statValue, { color: "#A78BFA" }]}>
              {myRank ? `#${myRank}` : "—"}
            </Text>
            <Text style={styles.statLabel}>RANK</Text>
          </Pressable>
        </View>

        {/* streak card */}
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <View style={styles.streakTitleRow}>
              <Flame size={22} color={dq.gold} fill={dq.gold} />
              <Text style={styles.streakTitle}>
                {currentStreak}-day streak
              </Text>
            </View>
            <Text style={styles.streakMeta}>Longest: {longestStreak}</Text>
          </View>
          <View style={styles.weekRow}>
            {weeklyCompletions.map((done, i) => {
              const isToday = i === 6;
              return (
                <View
                  key={i}
                  style={[
                    styles.dayDot,
                    done
                      ? styles.dayDotDone
                      : isToday
                        ? styles.dayDotToday
                        : styles.dayDotEmpty,
                  ]}
                >
                  {done ? (
                    <Check size={12} color={dq.green} strokeWidth={3.5} />
                  ) : isToday ? (
                    <Text style={styles.todayDotMark}>•</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        {/* reward vault */}
        <View style={styles.vaultHeader}>
          <Text style={styles.vaultTitle}>Reward Vault</Text>
          <Pressable
            onPress={() => navigation.navigate("RewardsScreen")}
            hitSlop={8}
          >
            <Text style={styles.vaultSeeAll}>See all →</Text>
          </Pressable>
        </View>
        <View style={styles.vaultRow}>
          {vaultUnlocked.map((reward) => (
            <LinearGradient
              key={reward.id}
              colors={[dq.gold, dq.goldDark]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.vaultBadge}
            >
              <RewardIcon icon={reward.icon} color={dq.onGold} size={24} />
            </LinearGradient>
          ))}
          {vaultLocked.map((reward) => (
            <View key={reward.id} style={styles.vaultLocked}>
              <RewardIcon icon={reward.icon} color="#5F7E7C" size={20} />
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 90,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  screenTitle: { fontSize: 22, fontFamily: "Nunito_900Black", color: dq.text },
  gear: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },

  // identity
  identityCard: {
    marginTop: 16,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 26, fontFamily: "Nunito_900Black", color: dq.onGreen },
  identityBody: { flex: 1, minWidth: 0 },
  name: { fontSize: 19, fontFamily: "Nunito_900Black", color: dq.text },
  rankLine: {
    fontSize: 12.5,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.green,
    marginTop: 1,
  },
  joinLine: {
    fontSize: 11.5,
    fontFamily: "Nunito_600SemiBold",
    color: dq.faint,
    marginTop: 2,
  },
  shareChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: dq.greenTint,
    borderWidth: 1.5,
    borderColor: dq.green,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  shareChipText: {
    fontSize: 11,
    fontFamily: "Nunito_900Black",
    color: "#5EE0CE",
  },

  // stats
  statsGrid: { flexDirection: "row", gap: 12, marginTop: 14 },
  statCard: {
    flex: 1,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    gap: 3,
  },
  statValue: { fontSize: 19, fontFamily: "Nunito_900Black" },
  statLabel: {
    fontSize: 10,
    fontFamily: "Nunito_800ExtraBold",
    color: dq.faint,
    letterSpacing: 0.8,
  },

  // streak
  streakCard: {
    marginTop: 14,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  streakTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  streakTitle: { fontSize: 15, fontFamily: "Nunito_900Black", color: dq.text },
  streakMeta: { fontSize: 12, fontFamily: "Nunito_700Bold", color: dq.faint },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  dayDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dayDotDone: { backgroundColor: dq.greenTint },
  dayDotToday: { borderWidth: 2, borderColor: dq.gold },
  dayDotEmpty: { borderWidth: 2, borderColor: "#2C464C" },
  todayDotMark: {
    fontSize: 11,
    fontFamily: "Nunito_900Black",
    color: dq.gold,
    lineHeight: 13,
  },

  // vault
  vaultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 4,
  },
  vaultTitle: { fontSize: 15, fontFamily: "Nunito_900Black", color: dq.text },
  vaultSeeAll: { fontSize: 12, fontFamily: "Nunito_800ExtraBold", color: dq.green },
  vaultRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  vaultBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  vaultLocked: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: dq.card,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#2C464C",
    alignItems: "center",
    justifyContent: "center",
  },
});
