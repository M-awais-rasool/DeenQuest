import React, { useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Share,
} from "react-native";
import { Flame, Settings, Trophy, Heart, Check } from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { Header } from "../../components/Header";
import { TactileButton } from "../../components/TactileButton";
import { theme } from "../../theme/themes";
import {
  useGetProfileQuery,
  useGetProgressQuery,
  useGetRewardsQuery,
  type RewardWithStatus,
} from "../../store/services/api";
import { RewardIcon } from "../reward/components/RewardIcon";
import type { DemoTabScreenProps } from "../../navigators/navigationTypes";

type Props = DemoTabScreenProps<"ProfileScreen">;

export function ProfileScreen({ navigation }: Props) {
  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery();
  const { data: progressData, isLoading: progressLoading } =
    useGetProgressQuery();
  const { data: rewardsData, isLoading: rewardsLoading } = useGetRewardsQuery();

  const profile = profileData?.data;
  const progress = progressData?.data;
  const rewards: RewardWithStatus[] = rewardsData?.data ?? [];

  const weeklyCompletions = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        progress?.weekly_completions?.[index] === true ? true : false,
      ),
    [progress?.weekly_completions],
  );

  const streakDays = ["M", "T", "W", "T", "F", "S", "S"];

  const unlockedRewardsCount = useMemo(
    () => rewards.filter((reward) => reward.unlocked).length,
    [rewards],
  );

  const rewardsProgressPct = useMemo(
    () => (rewards.length ? (unlockedRewardsCount / rewards.length) * 100 : 0),
    [rewards.length, unlockedRewardsCount],
  );

  const nextReward = useMemo(
    () => rewards.find((reward) => !reward.unlocked),
    [rewards],
  );

  const rewardPreview = useMemo(() => rewards.slice(0, 4), [rewards]);

  if (profileLoading || progressLoading || rewardsLoading) {
    return (
      <ScreenWrapper>
        <Loader fullScreen />
      </ScreenWrapper>
    );
  }

  const displayName =
    profile?.display_name || profile?.email?.split("@")[0] || "Explorer";
  const userTitle = profile?.title || "SEEKER OF KNOWLEDGE";
  const totalXP = progress?.xp ?? 0;
  const level = progress?.level ?? 1;
  const currentStreak = progress?.current_streak ?? 0;
  const barakahScore = progress?.barakah_score ?? 0;

  const handleShareProfile = async () => {
    if (!profile?.id) return;
    const deepLink = `deenquest://profile/${profile.id}`;
    const shareText = `Check out ${displayName}'s profile on DeenQuest!\n${deepLink}`;
    try {
      await Share.share(
        {
          title: `${displayName}'s DeenQuest Profile`,
          message: shareText,
          url: deepLink,
        },
        {
          excludedActivityTypes: [],
        },
      );
    } catch {}
  };

  return (
    <ScreenWrapper>
      <StatusBar barStyle="light-content" />
      <Header
        title="DEENQUEST"
        xp={totalXP}
        Icon={Settings}
        onSettingsPress={() => navigation.navigate("Settings")}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGradient}>
              <Image
                source={{
                  uri:
                    profile?.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=88D982&color=003909&size=300`,
                }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>LEVEL {level}</Text>
            </View>
          </View>

          <View style={styles.nameContainer}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.title}>{userTitle.toUpperCase()}</Text>
          </View>

          <View style={styles.buttonRow}>
            <TactileButton
              title="Edit Profile"
              onPress={() => navigation.navigate("EditProfile")}
              style={styles.secondaryButton}
              textStyle={styles.buttonText}
            />
            <TactileButton
              title="Share Stats"
              onPress={handleShareProfile}
              style={styles.primaryButton}
              textStyle={styles.primaryButtonText}
            />
          </View>
        </View>

        {/* Bento Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Trophy
              color={theme.colors.white05}
              size={80}
              style={styles.bgIcon}
            />
            <Text style={styles.statLabel}>TOTAL XP</Text>
            <Text style={[styles.statValue, { color: theme.colors.secondary }]}>
              {totalXP >= 1000 ? `${(totalXP / 1000).toFixed(1)}k` : totalXP}
            </Text>
            <Text style={styles.statSubtext}>Level {level}</Text>
          </View>

          <View style={styles.statCard}>
            <Heart
              color={theme.colors.white05}
              size={80}
              style={styles.bgIcon}
            />
            <Text style={styles.statLabel}>BARAKAH SCORE</Text>
            <Text style={styles.statValue}>
              {barakahScore >= 1000
                ? `${(barakahScore / 1000).toFixed(1)}k`
                : barakahScore}
            </Text>
            <Text style={styles.statSubtext}>Points for good deeds</Text>
          </View>

          {/* Streak History */}
          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <View>
                <Text style={styles.sectionTitle}>Streak History</Text>
                <Text style={styles.sectionSubtext}>
                  Your consistency this week
                </Text>
              </View>
              <View style={styles.streakBadge}>
                <Flame
                  color={theme.colors.secondary}
                  fill={theme.colors.secondary}
                  size={14}
                />
                <Text style={styles.streakBadgeText}>{currentStreak} Days</Text>
              </View>
            </View>
            <View style={styles.daysGrid}>
              {streakDays.map((day, i) => {
                const isCompleted = weeklyCompletions[i] === true;
                return (
                  <View key={i} style={styles.dayColumn}>
                    <Text style={styles.dayLabel}>{day}</Text>
                    <View
                      style={[
                        styles.dayBox,
                        isCompleted ? styles.dayBoxActive : styles.dayBoxEmpty,
                      ]}
                    >
                      {isCompleted && (
                        <Check color={theme.colors.onPrimary} size={16} />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Rewards Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Reward Vault</Text>
              <Text style={styles.sectionSubtext}>
                {unlockedRewardsCount}/{rewards.length} unlocked
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("RewardsScreen")}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rewardSummaryCard}>
            <View style={styles.rewardSummaryTop}>
              <View>
                <Text style={styles.rewardSummaryLabel}>Next milestone</Text>
                <Text style={styles.rewardSummaryTitle}>
                  {nextReward?.title ?? "All rewards unlocked"}
                </Text>
              </View>
              <View style={styles.rewardSummaryBadge}>
                <Trophy
                  size={18}
                  color={theme.colors.secondary}
                  fill={theme.colors.secondary}
                />
                <Text style={styles.rewardSummaryBadgeText}>
                  {rewards.length > 0
                    ? `${Math.round(rewardsProgressPct)}%`
                    : "0%"}
                </Text>
              </View>
            </View>

            <View style={styles.heroProgressTrack}>
              <View
                style={[
                  styles.heroProgressFill,
                  { width: `${Math.min(rewardsProgressPct, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.rewardProgressText}>
              {rewards.length > 0
                ? `${unlockedRewardsCount} of ${rewards.length} milestones completed`
                : "No rewards available yet."}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.rewardPreviewScroll}
            >
              {rewardPreview.map((reward) => (
                <View
                  key={reward.id}
                  style={[
                    styles.rewardPreviewPill,
                    reward.unlocked
                      ? styles.rewardPreviewPillActive
                      : styles.rewardPreviewPillLocked,
                  ]}
                >
                  <RewardIcon
                    icon={reward.icon}
                    color={
                      reward.unlocked
                        ? theme.colors.secondary
                        : theme.colors.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.rewardPreviewLabel,
                      reward.unlocked && { color: theme.colors.secondary },
                    ]}
                    numberOfLines={1}
                  >
                    {reward.title}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {},
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 50,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarGradient: {
    width: 128,
    height: 128,
    borderRadius: 64,
    padding: 4,
    backgroundColor: theme.colors.primary, // Simplified gradient for StyleSheet
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.background,
  },
  levelBadge: {
    position: "absolute",
    bottom: -8,
    alignSelf: "center",
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  levelText: {
    fontFamily: "Lexend",
    fontWeight: "900",
    fontSize: 10,
    color: theme.colors.onSecondary,
    letterSpacing: 1,
  },
  nameContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  name: {
    fontFamily: "Lexend",
    fontWeight: "700",
    fontSize: 32,
    color: theme.colors.white,
  },
  title: {
    fontFamily: "Lexend",
    fontWeight: "700",
    fontSize: 12,
    color: theme.colors.primary,
    letterSpacing: 3,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderBottomWidth: 4,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderBottomColor: theme.colors.shadowGreen,
  },
  primaryButtonText: {
    fontFamily: "Lexend",
    fontWeight: "700",
    color: theme.colors.onPrimary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surfaceHigh,
    borderBottomColor: theme.colors.black,
  },
  buttonText: {
    fontFamily: "Lexend",
    fontWeight: "700",
    color: theme.colors.text,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: theme.colors.surfaceLow,
    padding: 24,
    borderRadius: 16,
    position: "relative",
    overflow: "hidden",
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.black20,
  },
  bgIcon: {
    position: "absolute",
    right: -16,
    top: -16,
  },
  statLabel: {
    fontFamily: "Lexend",
    fontWeight: "700",
    fontSize: 10,
    color: theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: "Lexend",
    fontWeight: "900",
    fontSize: 36,
    color: theme.colors.white,
  },
  statSubtext: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: "700",
    marginTop: 8,
  },
  streakCard: {
    width: "100%",
    backgroundColor: theme.colors.surface,
    padding: 24,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.black20,
  },
  streakHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Lexend",
    fontWeight: "700",
    fontSize: 18,
    color: theme.colors.white,
  },
  sectionSubtext: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  streakBadgeText: {
    fontFamily: "Lexend",
    fontWeight: "700",
    fontSize: 14,
    color: theme.colors.secondary,
    marginLeft: 6,
  },
  daysGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayColumn: {
    alignItems: "center",
    gap: 4,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.textMuted,
  },
  dayBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dayBoxActive: {
    backgroundColor: theme.colors.primary,
  },
  dayBoxStar: {
    backgroundColor: theme.colors.secondary,
  },
  dayBoxEmpty: {
    backgroundColor: theme.colors.surfaceHigh,
    opacity: 0.4,
  },
  section: {},
  goalCardContainer: {
    marginTop: 16,
    gap: 12,
  },
  goalCard: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  goalTitle: {
    fontWeight: "700",
    color: theme.colors.white,
    fontSize: 16,
  },
  goalSubtext: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  goalPercent: {
    fontFamily: "Lexend",
    fontWeight: "900",
    fontSize: 16,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  rewardSummaryCard: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.black20,
    gap: 14,
    marginBottom: 20,
  },
  rewardSummaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  rewardSummaryLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.textMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  rewardSummaryTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.colors.white,
  },
  rewardSummaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.surfaceHigh,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  rewardSummaryBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.colors.secondary,
  },
  heroProgressTrack: {
    width: "100%",
    height: 8,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 8,
  },
  heroProgressFill: {
    height: "100%",
    backgroundColor: theme.colors.secondary,
    borderRadius: 6,
  },
  rewardProgressText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
  rewardPreviewScroll: {
    marginTop: 14,
  },
  rewardPreviewPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHigh,
    backgroundColor: theme.colors.surfaceLow,
    marginRight: 12,
  },
  rewardPreviewPillActive: {
    borderColor: theme.colors.secondary,
  },
  rewardPreviewPillLocked: {
    opacity: 0.62,
  },
  rewardPreviewLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.text,
    maxWidth: 120,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  viewAllText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  badgeScroll: {
    marginTop: 16,
  },
  badgeItem: {
    width: 80,
    alignItems: "center",
    marginRight: 16,
  },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    marginBottom: 8,
  },
  badgeUnlocked: {
    backgroundColor: theme.colors.surfaceHigh,
    borderColor: theme.colors.surfaceBright,
  },
  badgeLocked: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.surfaceHigh,
    borderStyle: "dashed",
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    color: theme.colors.textMuted,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: theme.colors.background,
    borderTopWidth: 4,
    borderTopColor: theme.colors.surface,
  },
  navItem: {
    alignItems: "center",
    padding: 8,
  },
  navItemActive: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.primary,
    paddingHorizontal: 16,
  },
  navLabel: {
    fontFamily: "Lexend",
    fontWeight: "900",
    fontSize: 10,
    color: theme.colors.text,
    textTransform: "uppercase",
    marginTop: 4,
    opacity: 0.6,
  },
  navLabelActive: {
    color: theme.colors.primary,
    opacity: 1,
  },
});
