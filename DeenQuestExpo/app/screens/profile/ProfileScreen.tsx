import React, { useMemo } from "react";
import { StyleSheet, View, Text, ScrollView, Share, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Star,
  Pencil,
  Share2,
  Zap,
  Sparkles,
  Trophy,
  Settings,
  ChevronRight,
} from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { TactilePressable } from "../../components/ui";
import { dq } from "../../theme/designTokens";
import {
  useGetProfileQuery,
  useGetProgressQuery,
  useGetRewardsQuery,
  useGetLeaderboardQuery,
  type RewardWithStatus,
} from "../../store/services/api";
import { RewardIcon } from "../reward/components/RewardIcon";
import { LearningToolsCard } from "../../components/learning/LearningToolsCard";
import type { DemoTabScreenProps } from "../../navigators/navigationTypes";

type Props = DemoTabScreenProps<"ProfileScreen">;

function rankWord(title?: string): string {
  const first = (title || "Seeker").trim().split(/\s+/)[0] || "Seeker";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function GoldCircle({
  size,
  children,
  style,
}: {
  size: number;
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <LinearGradient
      colors={[dq.badgeGoldFrom, dq.badgeGoldTo]}
      start={{ x: 0.3, y: 0.28 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
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

  const previewBadges = unlockedRewards.slice(0, 3);
  const extraBadges = unlockedRewards.length - previewBadges.length;

  return (
    <ScreenWrapper innerStyle={styles.wrapper}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* header */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Profile</Text>
          <TactilePressable
            faceStyle={styles.gear}
            edgeColor="rgba(0,0,0,0.4)"
            faceUnderlayColor={dq.screen}
            radius={17}
            depth={3}
            haptic="light"
            onPress={() => navigation.navigate("Settings")}
          >
            <Settings size={17} color="#9aa39a" />
          </TactilePressable>
        </View>

        {/* identity */}
        <View style={styles.identityCard}>
          <View style={styles.identityRow}>
            <View style={styles.avatarRing}>
              <LinearGradient
                colors={[dq.green, dq.greenDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{initial}</Text>
              </LinearGradient>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.name}>{displayName}</Text>
              <View style={styles.levelPill}>
                <Star size={12} color={dq.gold} fill={dq.gold} />
                <Text style={styles.levelPillText}>
                  Level {level} · {rankWord(profile?.title)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.btnRow}>
            <TactilePressable
              style={styles.btnFlex}
              faceStyle={styles.editBtn}
              edgeColor="rgba(0,0,0,0.45)"
              faceUnderlayColor={dq.card}
              radius={13}
              depth={3}
              haptic="light"
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Pencil size={14} color={dq.text} />
              <Text style={styles.editText}>Edit</Text>
            </TactilePressable>
            <TactilePressable
              style={styles.btnFlex}
              faceStyle={styles.shareBtn}
              edgeColor="#2E7D32"
              faceUnderlayColor={dq.green}
              radius={13}
              depth={3}
              haptic="light"
              onPress={handleShareProfile}
            >
              <Share2 size={14} color={dq.onGreen} />
              <Text style={styles.shareText}>Share</Text>
            </TactilePressable>
          </View>
        </View>

        {/* stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Zap size={18} color={dq.gold} />
            <Text style={styles.statValue}>{totalXP.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statCard}>
            <Sparkles size={18} color={dq.green} />
            <Text style={styles.statValue}>{barakahScore.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Barakah</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.statCard, pressed && { opacity: 0.8 }]}
            onPress={() => navigation.navigate("Leaderboard")}
          >
            <Trophy size={18} color={dq.gold} />
            <Text style={styles.statValue}>{myRank ? `#${myRank}` : "—"}</Text>
            <Text style={styles.statLabel}>Leaderboard</Text>
          </Pressable>
        </View>

        {/* your learning */}
        <LearningToolsCard />

        {/* streak history */}
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Text style={styles.streakTitle}>Streak history</Text>
            <Text style={styles.streakMeta}>
              Current {currentStreak} · Best {longestStreak}
            </Text>
          </View>
          <View style={styles.squareRow}>
            {Array.from({ length: 14 }, (_, i) => {
              const fromEnd = 13 - i;
              const isToday = i === 13;
              const active = fromEnd < currentStreak;
              return (
                <View
                  key={i}
                  style={[
                    styles.square,
                    isToday
                      ? styles.squareToday
                      : active
                        ? styles.squareActive
                        : styles.squareEmpty,
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* reward vault */}
        <View style={styles.vaultCard}>
          <View style={styles.vaultHeader}>
            <Text style={styles.vaultTitle}>Reward Vault</Text>
            <Pressable
              style={styles.vaultView}
              onPress={() => navigation.navigate("RewardsScreen")}
              hitSlop={8}
            >
              <Text style={styles.vaultViewText}>View</Text>
              <ChevronRight size={14} color={dq.green} />
            </Pressable>
          </View>
          <View style={styles.vaultRow}>
            <View style={styles.vaultBadges}>
              {previewBadges.map((reward, i) => (
                <GoldCircle
                  key={reward.id}
                  size={34}
                  style={[styles.vaultBadge, i > 0 && { marginLeft: -9 }]}
                >
                  <RewardIcon icon={reward.icon} color={dq.onBadgeGold} size={15} />
                </GoldCircle>
              ))}
              {extraBadges > 0 && (
                <View style={[styles.vaultBadge, styles.vaultExtra, { marginLeft: -9 }]}>
                  <Text style={styles.vaultExtraText}>+{extraBadges}</Text>
                </View>
              )}
            </View>
            <Text style={styles.vaultCount}>
              {unlockedRewards.length} of {rewards.length} unlocked
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 90,
    gap: 18,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  screenTitle: { fontSize: 26, fontWeight: "900", color: dq.white },
  gear: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },

  // identity
  identityCard: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    padding: 20,
    gap: 16,
  },
  identityRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: dq.gold55,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 26, fontWeight: "900", color: dq.onGreen },
  name: { fontSize: 20, fontWeight: "900", color: dq.white },
  levelPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: dq.gold12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  levelPillText: { fontSize: 11, fontWeight: "800", color: dq.gold },

  btnRow: { flexDirection: "row", gap: 10 },
  btnFlex: { flex: 1 },
  editBtn: {
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  editText: { fontSize: 13, fontWeight: "800", color: dq.text },
  shareBtn: {
    height: 42,
    borderRadius: 13,
    backgroundColor: dq.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  shareText: { fontSize: 13, fontWeight: "800", color: dq.onGreen },

  // stats
  statsGrid: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: "flex-start",
    gap: 9,
  },
  statValue: { fontSize: 20, fontWeight: "900", color: dq.white, lineHeight: 20 },
  statLabel: { fontSize: 11, fontWeight: "600", color: dq.muted },

  // streak history
  streakCard: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  streakTitle: { fontSize: 14, fontWeight: "800", color: dq.text },
  streakMeta: { fontSize: 12, fontWeight: "700", color: dq.muted },
  squareRow: { flexDirection: "row", gap: 4 },
  square: { flex: 1, aspectRatio: 1, borderRadius: 6 },
  squareActive: { backgroundColor: dq.green },
  squareEmpty: { backgroundColor: dq.squareEmpty },
  squareToday: {
    backgroundColor: dq.gold18,
    borderWidth: 1.5,
    borderColor: dq.gold,
  },

  // reward vault
  vaultCard: {
    backgroundColor: dq.card,
    borderWidth: 1,
    borderColor: dq.cardBorder,
    borderRadius: 18,
    padding: 16,
    gap: 13,
  },
  vaultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vaultTitle: { fontSize: 14, fontWeight: "800", color: dq.text },
  vaultView: { flexDirection: "row", alignItems: "center", gap: 3 },
  vaultViewText: { fontSize: 12, fontWeight: "700", color: dq.green },
  vaultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vaultBadges: { flexDirection: "row", alignItems: "center" },
  vaultBadge: {
    borderWidth: 2,
    borderColor: dq.card,
  },
  vaultExtra: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: dq.lockBadge,
    alignItems: "center",
    justifyContent: "center",
  },
  vaultExtraText: { fontSize: 11, fontWeight: "800", color: dq.muted },
  vaultCount: { fontSize: 12, fontWeight: "700", color: dq.muted },
});
